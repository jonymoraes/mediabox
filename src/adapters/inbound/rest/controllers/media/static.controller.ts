import { Controller, Get, Param, Res, Query, UseGuards } from '@nestjs/common';
import { FastifyReply } from 'fastify';
import { join } from 'path';
import { existsSync, statSync } from 'fs';

// Guards
import { AuthenticateGuard } from '../../guards/authenticate.guard';

// Decorators
import { User } from '../../decorators/user.decorator';
import { Session } from '../../interfaces/auth.interface';

// Ports / Use Cases
import { UpdateTransferUseCase } from '@/src/application/identity/quota/use-case/update-transfer.use-case';

// Utils & Exceptions
import { getFileType } from '@/src/platform/shared/utils/file.util';
import {
  FileNotFoundException,
  InvalidFileTypeException,
} from '@/src/domain/shared/exceptions/common.exceptions';

@Controller('static')
export class StaticController {
  constructor(private readonly updateTransferUseCase: UpdateTransferUseCase) {}

  @UseGuards(AuthenticateGuard)
  @Get('*')
  async getFile(
    @Param('*') path: string,
    @Query() query: any,
    @Res() reply: FastifyReply,
    @User() user: Session,
  ) {
    const root = join(process.cwd(), 'public');
    const filePath = join(root, path);

    //  Validate file
    if (!existsSync(filePath)) throw new FileNotFoundException();

    //  Validate type
    const fileType = getFileType(path);
    if (!fileType) throw new InvalidFileTypeException();

    //  Calculate transfer
    const stats = statSync(filePath);
    const fileSizeInBytes = BigInt(stats.size);

    // Register transfer
    await this.updateTransferUseCase.execute(user.sub, fileSizeInBytes);

    //  Download header
    if (query.download === 'true') {
      reply.header(
        'Content-Disposition',
        `attachment; filename="${path.split('/').pop()}"`,
      );
    }

    return reply.sendFile(path, root);
  }
}
