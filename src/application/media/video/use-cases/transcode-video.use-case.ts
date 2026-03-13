import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { promises as fs, existsSync } from 'fs';
import { basename } from 'path';

// Entities & Dtos
import { Video as VideoEntity } from '@/src/domain/media/entities/video.entity';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';
import { Account } from '@/src/domain/identity/entities/account.entity';

// Ports
import { TranscodeVideoPort } from '@/src/domain/media/ports/inbound/conversions/transcode-video.port';
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { QuotaNotFoundException } from '@/src/domain/identity/exceptions/quota.exceptions';

// Utils & Value objects
import {
  Codecs,
  Format,
} from '@/src/platform/shared/constants/video.constants';
import { addDays } from '@/src/platform/shared/utils/date.util';
import {
  generateOutputFilePath,
  getMimeType,
} from '@/src/platform/shared/utils/file.util';
import {
  getVideoDuration,
  transcodeVideo,
} from '@/src/platform/shared/utils/video-processor.util';

// Gateway
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

@Injectable()
export class TranscodeVideoUseCase extends TranscodeVideoPort {
  private readonly logger = new Logger(TranscodeVideoUseCase.name);

  constructor(
    private readonly videoPort: VideoPort,
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
    private readonly accountGateway: AccountGateway,
    private readonly i18n: I18nService,
  ) {
    super();
  }

  async execute(
    jobId: string,
    data: any,
    onProgress: (percentage: number, stage: string) => Promise<void>,
    control: { cancel: boolean },
  ): Promise<{ success: boolean; jobId: string; url: string }> {
    const { filename, filepath, filesize, format, accountId, quotaId } = data;

    // Quota update
    const quota = await this.quotaPort.findById(quotaId);
    if (!quota) throw new QuotaNotFoundException();
    quota.addTransfer(BigInt(filesize));
    await this.quotaPort.save(quota);

    // Initial status update
    await this.videoPort.markTranscodingProcessing(jobId);
    await onProgress(5, this.i18n.t('shared.job_status.messages.processing'));

    // Get account
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();
    await onProgress(8, this.i18n.t('shared.job_status.messages.validated'));

    // Emit account updates
    this.accountGateway.emitUpdated(AccountToDto.fromDomain(account));

    // Get file paths
    const outputPath = generateOutputFilePath(filepath, filename, format);

    // Get video duration
    const duration = await getVideoDuration(
      filepath,
      TranscodeVideoUseCase.name,
    );
    await onProgress(13, this.i18n.t('shared.job_status.messages.executing'));

    //  Get codecs
    const { videoCodec, audioCodec } = Codecs[format as Format];

    // Transcode video using shared helper
    await transcodeVideo({
      input: filepath,
      output: outputPath,
      videoCodec,
      audioCodec,
      duration,
      loggerName: TranscodeVideoUseCase.name,
      onProgress: (p, stage) => void onProgress(p, stage),
      onCancel: () => {
        if (!control.cancel) return false;

        // Immediate cleanup of partial output if canceled
        if (existsSync(outputPath)) {
          fs.unlink(outputPath).catch(() => {
            this.logger.warn(
              `${this.i18n.t('common.failed_deletion')}: ${outputPath}`,
            );
          });
        }

        return true;
      },
    });

    //  Delete original file
    if (outputPath !== filepath && existsSync(filepath))
      await fs.unlink(filepath);

    //  Get transcoded filesize
    const { size: transcodedFilesize } = await fs.stat(outputPath);

    //  Get output mimetype
    const outputMimetype = getMimeType(format);

    //  Get relative path
    const relativePath = outputPath.split(`${process.env.PUBLIC_DIR}/`).pop();

    //  Generate url
    const url = `${process.env.STATIC}/${account.folder}/${basename(relativePath!)}`;
    await onProgress(90, this.i18n.t('shared.job_status.messages.finalizing'));

    // Create video entry
    const video = VideoEntity.create({
      filename: basename(outputPath),
      mimetype: outputMimetype,
      filesize: transcodedFilesize,
      accountId: account.id,
      quotaId: quota.id,
      expiresAt: addDays(new Date(), 1),
    });

    //  Save video entry
    await this.videoPort.save(video);

    // Storage accounting
    account.addUsedBytes(BigInt(transcodedFilesize));
    const updatedAccount = await this.accountPort.save(account);

    // Merge updated quotas into account
    const accountWithQuotas = Account.load({
      ...updatedAccount.unpack(),
      quotas: [quota],
    });

    // Emit account updates
    this.accountGateway.emitUpdated(AccountToDto.fromDomain(accountWithQuotas));

    await onProgress(100, this.i18n.t('shared.job_status.messages.completed'));

    return {
      success: true,
      jobId,
      url,
    };
  }
}
