import { Test, TestingModule } from '@nestjs/testing';
import { VideoController } from '@/src/adapters/inbound/rest/controllers/media/video.controller';
import { VideoUploadUseCase } from '@/src/application/media/video/use-cases/video-upload.use-case';
import { VideoCancelUseCase } from '@/src/application/media/video/use-cases/video-cancel.use-case';
import { UpdateVideoUseCase } from '@/src/application/media/video/use-cases/update-video.use-case';
import { DeleteVideoUseCase } from '@/src/application/media/video/use-cases/delete-video.use-case';
import { AuthenticateGuard } from '@/src/adapters/inbound/rest/guards/authenticate.guard';
import { VideoUploadPipe } from '@/src/adapters/inbound/rest/pipes/video-upload.pipe';
import { Session } from '@/src/adapters/inbound/rest/interfaces/auth.interface';
import { VideoUploadPayload } from '@/src/adapters/inbound/rest/transformers/video-upload.transformer';
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';

describe('VideoController', () => {
  let controller: VideoController;
  let uploadUseCase: jest.Mocked<VideoUploadUseCase>;
  let cancelUseCase: jest.Mocked<VideoCancelUseCase>;
  let updateUseCase: jest.Mocked<UpdateVideoUseCase>;
  let deleteUseCase: jest.Mocked<DeleteVideoUseCase>;

  const mockSession: Session = {
    sub: 'user-uuid-123',
    role: 'USER' as unknown as RoleType,
  };

  const mockGuard = { canActivate: jest.fn(() => true) };
  const mockPipe = { transform: (value: any) => value };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoController],
      providers: [
        {
          provide: VideoUploadUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: VideoCancelUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateVideoUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteVideoUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthenticateGuard)
      .useValue(mockGuard)
      .overridePipe(VideoUploadPipe)
      .useValue(mockPipe)
      .compile();

    controller = module.get<VideoController>(VideoController);
    uploadUseCase = module.get(VideoUploadUseCase);
    cancelUseCase = module.get(VideoCancelUseCase);
    updateUseCase = module.get(UpdateVideoUseCase);
    deleteUseCase = module.get(DeleteVideoUseCase);
  });

  describe('upload', () => {
    it('should call VideoUploadUseCase with user sub and payload', async () => {
      // GIVEN
      const payload = {
        file: {
          buffer: Buffer.from('fake-video-content'),
          filename: 'test.mp4',
          mimetype: 'video/mp4',
          size: 5000,
        },
        format: 'mp4',
      } as unknown as VideoUploadPayload;

      const expectedOutput = {
        jobId: 'video-job-123',
        message: 'Transcoding started',
      };
      uploadUseCase.execute.mockResolvedValue(expectedOutput as any);

      // WHEN
      const result = await controller.upload(mockSession, payload);

      // THEN
      expect(uploadUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
        payload,
      );
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('cancel', () => {
    it('should call VideoCancelUseCase with jobId', async () => {
      // GIVEN
      const jobId = 'video-job-123';
      const expectedOutput = { message: 'Video process cancelled' };
      cancelUseCase.execute.mockResolvedValue(expectedOutput);

      // WHEN
      const result = await controller.cancel(jobId);

      // THEN
      expect(cancelUseCase.execute).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('update', () => {
    it('should call UpdateVideoUseCase with user sub and filename', async () => {
      // GIVEN
      const filename = 'test.mp4';
      const expectedOutput = { message: 'Video status updated' };
      updateUseCase.execute.mockResolvedValue(expectedOutput as any);

      // WHEN
      const result = await controller.update(filename, mockSession);

      // THEN
      expect(updateUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
        filename,
      );
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('delete', () => {
    it('should call DeleteVideoUseCase with user sub and filename', async () => {
      // GIVEN
      const filename = 'test.mp4';
      const expectedOutput = { message: 'Video deleted' };
      deleteUseCase.execute.mockResolvedValue(expectedOutput as any);

      // WHEN
      const result = await controller.delete(filename, mockSession);

      // THEN
      expect(deleteUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
        filename,
      );
      expect(result).toEqual(expectedOutput);
    });
  });
});
