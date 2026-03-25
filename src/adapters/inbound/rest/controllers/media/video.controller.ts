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
import { VideoUploadPipe } from '@/src/adapters/inbound/rest/pipes/video-upload.pipe';
import { VideoUploadPayload } from '../../transformers/video-upload.transformer';

// Decorators
import { User } from '../../decorators/user.decorator';

// UseCases
import { VideoUploadUseCase } from '@/src/application/media/video/use-cases/video-upload.use-case';
import { VideoCancelUseCase } from '@/src/application/media/video/use-cases/video-cancel.use-case';
import { UpdateVideoUseCase } from '@/src/application/media/video/use-cases/update-video.use-case';
import { DeleteVideoUseCase } from '@/src/application/media/video/use-cases/delete-video.use-case';

// Constants
import { Session } from '../../interfaces/auth.interface';

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoUploadUseCase: VideoUploadUseCase,
    private readonly videoCancelUseCase: VideoCancelUseCase,
    private readonly updateVideoUseCase: UpdateVideoUseCase,
    private readonly deleteVideoUseCase: DeleteVideoUseCase,
  ) {}

  /**
   * @description Uploads video and starts the transcoding process
   * @param file
   * @param format
   */
  @UseGuards(AuthenticateGuard)
  @Post()
  async upload(
    @User() user: Session,
    @Query(VideoUploadPipe) payload: VideoUploadPayload,
  ) {
    return await this.videoUploadUseCase.execute(
      user.sub,
      user.client,
      payload,
    );
  }

  /**
   * @description Cancel video process
   * @param jobId
   */
  @UseGuards(AuthenticateGuard)
  @Post(':jobId')
  async cancel(@Param('jobId') jobId: string): Promise<{ message: string }> {
    return await this.videoCancelUseCase.execute(jobId);
  }

  /**
   * @description Updates video status
   * @param filename
   * @param user User ID from session
   */
  @UseGuards(AuthenticateGuard)
  @Patch(':filename')
  async update(@Param('filename') filename: string, @User() user: Session) {
    return await this.updateVideoUseCase.execute(user.sub, filename);
  }

  /**
   * @description Deletes video
   * @param filename
   */
  @UseGuards(AuthenticateGuard)
  @Delete(':filename')
  async delete(@Param('filename') filename: string, @User() user: Session) {
    return await this.deleteVideoUseCase.execute(user.sub, filename);
  }
}
