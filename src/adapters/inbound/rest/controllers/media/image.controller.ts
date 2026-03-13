import {
  Controller,
  Post,
  Param,
  Query,
  Patch,
  UseGuards,
  Delete,
} from '@nestjs/common';

// Guards
import { AuthenticateGuard } from '../../guards/authenticate.guard';

// Pipes & Interfaces
import { ImageUploadPipe } from '@/src/adapters/inbound/rest/pipes/image-upload.pipe';
import { ImageUploadPayload } from '../../transformers/image-upload.transformer';

// Decorators
import { User } from '../../decorators/user.decorator';
import { Session } from '../../interfaces/auth.interface';

// UseCases
import { ImageUploadUseCase } from '@/src/application/media/image/use-cases/image-upload.use-case';
import { ImageCancelUseCase } from '@/src/application/media/image/use-cases/image-cancel.use-case';
import { UpdateImageUseCase } from '@/src/application/media/image/use-cases/update-image.use-case';
import { DeleteImageUseCase } from '@/src/application/media/image/use-cases/delete-image.use-case';

@Controller('image')
export class ImageController {
  constructor(
    private readonly imageUploadUseCase: ImageUploadUseCase,
    private readonly imageCancelUseCase: ImageCancelUseCase,
    private readonly updateImageUseCase: UpdateImageUseCase,
    private readonly deleteImageUseCase: DeleteImageUseCase,
  ) {}

  /**
   * @description Uploads image and starts the optimization process
   * @param file
   * @param context
   */
  @UseGuards(AuthenticateGuard)
  @Post()
  async upload(
    @User() user: Session,
    @Query(ImageUploadPipe) payload: ImageUploadPayload,
  ) {
    return await this.imageUploadUseCase.execute(user.sub, payload);
  }

  /**
   * @description Cancel image process
   * @param jobId
   */
  @UseGuards(AuthenticateGuard)
  @Post(':jobId')
  async cancel(@Param('jobId') jobId: string): Promise<{ message: string }> {
    return await this.imageCancelUseCase.execute(jobId);
  }

  /**
   * @description Updates image status
   * @param filename
   * @param user User ID from session
   */
  @UseGuards(AuthenticateGuard)
  @Patch(':filename')
  async update(@Param('filename') filename: string, @User() user: Session) {
    return await this.updateImageUseCase.execute(user.sub, filename);
  }

  /**
   * @description Delete image
   * @param filename
   */
  @UseGuards(AuthenticateGuard)
  @Delete(':filename')
  async delete(@Param('filename') filename: string, @User() user: Session) {
    return await this.deleteImageUseCase.execute(user.sub, filename);
  }
}
