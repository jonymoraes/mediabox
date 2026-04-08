import { Injectable, Logger } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { promises as fs } from 'fs';

// Entities & Dtos
import { Image as ImageEntity } from '@/src/domain/media/entities/image.entity';
import { AccountToDto } from '@/src/application/identity/account/dto/output/account.to-dto';
import { Account } from '@/src/domain/identity/entities/account.entity';

// Ports
import { OptimizeImagePort } from '@/src/domain/media/ports/inbound/conversions/optimize-image.port';
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Exceptions
import { AccountNotFoundException } from '@/src/domain/identity/exceptions/account.exceptions';
import { QuotaNotFoundException } from '@/src/domain/identity/exceptions/quota.exceptions';

// Utils & Value objects
import {
  Sizes,
  Context,
} from '@/src/platform/shared/constants/image.constants';
import { transform } from '@/src/platform/shared/utils/image-processor.util';
import { addDays } from '@/src/platform/shared/utils/date.util';

// Gateway
import { AccountGateway } from '@/src/adapters/inbound/ws/websockets/account.gateway';

@Injectable()
export class OptimizeImageUseCase extends OptimizeImagePort {
  private readonly logger = new Logger(OptimizeImageUseCase.name);

  constructor(
    private readonly imagePort: ImagePort,
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
    const {
      filename,
      filepath,
      filesize,
      context,
      accountId,
      quotaId,
      client,
    } = data;

    // Get quota
    const quota = await this.quotaPort.findById(quotaId);
    if (!quota) throw new QuotaNotFoundException();

    // Update transfer
    quota.addTransfer(BigInt(filesize));
    await this.quotaPort.save(quota);

    // Mark image as processing
    await this.imagePort.markOptimizationProcessing(jobId);
    await onProgress(10, this.i18n.t('shared.job_status.messages.processing'));

    // Get account
    const account = await this.accountPort.findById(accountId);
    if (!account) throw new AccountNotFoundException();
    await onProgress(30, this.i18n.t('shared.job_status.messages.validated'));

    // Emit account updates
    this.accountGateway.emitUpdated(AccountToDto.fromDomain(account), client);

    // Get dimensions
    const { width, height } = Sizes[context] || Sizes[Context.GENERIC];
    await onProgress(50, this.i18n.t('shared.job_status.messages.preparing'));

    // Transform
    await transform(filepath, {
      width,
      height,
      fit: 'contain',
      cancel: control.cancel,
    });
    await onProgress(70, this.i18n.t('shared.job_status.messages.executing'));

    // Post-processing file size
    const { size: convertedFilesize } = await fs.stat(filepath);

    // Storage accounting
    account.addUsedBytes(BigInt(convertedFilesize));
    const updatedAccount = await this.accountPort.save(account);

    // Merge updated quotas into account
    const accountWithQuotas = Account.load({
      ...updatedAccount.unpack(),
      quotas: [quota],
    });

    // Emit new account updates
    this.accountGateway.emitUpdated(
      AccountToDto.fromDomain(accountWithQuotas),
      client,
    );

    // Generate URL
    const url = `${account.domain}/static/${filename}`;

    // Create image entry
    const image = ImageEntity.create({
      filename: filename,
      mimetype: 'image/webp',
      filesize: Number(convertedFilesize),
      accountId: accountId,
      quotaId: quotaId,
      expiresAt: addDays(new Date(), 1),
    });

    // Persist
    await this.imagePort.save(image);
    await onProgress(100, this.i18n.t('shared.job_status.messages.completed'));

    return {
      success: true,
      jobId,
      url,
    };
  }
}
