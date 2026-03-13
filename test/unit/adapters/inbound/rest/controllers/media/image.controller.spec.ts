import { Test, TestingModule } from '@nestjs/testing';
import { ImageController } from '@/src/adapters/inbound/rest/controllers/media/image.controller';
import { ImageUploadUseCase } from '@/src/application/media/image/use-cases/image-upload.use-case';
import { ImageCancelUseCase } from '@/src/application/media/image/use-cases/image-cancel.use-case';
import { UpdateImageUseCase } from '@/src/application/media/image/use-cases/update-image.use-case';
import { DeleteImageUseCase } from '@/src/application/media/image/use-cases/delete-image.use-case';
import { AuthenticateGuard } from '@/src/adapters/inbound/rest/guards/authenticate.guard';
import { Session } from '@/src/adapters/inbound/rest/interfaces/auth.interface';
import { ImageUploadPayload } from '@/src/adapters/inbound/rest/transformers/image-upload.transformer';
import { ImageUploadPipe } from '@/src/adapters/inbound/rest/pipes/image-upload.pipe';
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';

describe('ImageController', () => {
  let controller: ImageController;
  let uploadUseCase: jest.Mocked<ImageUploadUseCase>;
  let cancelUseCase: jest.Mocked<ImageCancelUseCase>;
  let updateUseCase: jest.Mocked<UpdateImageUseCase>;
  let deleteUseCase: jest.Mocked<DeleteImageUseCase>;

  const mockSession: Session = {
    sub: 'user-uuid-123',
    role: 'USER' as unknown as RoleType,
  };

  const mockGuard = { canActivate: jest.fn(() => true) };
  // Mock simple para el pipe que solo devuelve el valor
  const mockPipe = { transform: (value: any) => value };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ImageController],
      providers: [
        {
          provide: ImageUploadUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: ImageCancelUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: UpdateImageUseCase,
          useValue: { execute: jest.fn() },
        },
        {
          provide: DeleteImageUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthenticateGuard)
      .useValue(mockGuard)
      .overridePipe(ImageUploadPipe)
      .useValue(mockPipe)
      .compile();

    controller = module.get<ImageController>(ImageController);
    uploadUseCase = module.get(ImageUploadUseCase);
    cancelUseCase = module.get(ImageCancelUseCase);
    updateUseCase = module.get(UpdateImageUseCase);
    deleteUseCase = module.get(DeleteImageUseCase);
  });

  describe('upload', () => {
    it('should call ImageUploadUseCase with user sub and payload', async () => {
      // GIVEN
      const payload = {
        file: {
          buffer: Buffer.from('fake-image-content'),
          filename: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
        },
        context: 'generic',
      } as unknown as ImageUploadPayload;

      const expectedOutput = { jobId: 'job-123', message: 'Processing' };
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
    it('should call ImageCancelUseCase with jobId', async () => {
      // GIVEN
      const jobId = 'job-123';
      const expectedOutput = { message: 'Cancelled' };
      cancelUseCase.execute.mockResolvedValue(expectedOutput);

      // WHEN
      const result = await controller.cancel(jobId);

      // THEN
      expect(cancelUseCase.execute).toHaveBeenCalledWith(jobId);
      expect(result).toEqual(expectedOutput);
    });
  });

  describe('update', () => {
    it('should call UpdateImageUseCase with user sub and filename', async () => {
      // GIVEN
      const filename = 'test.jpg';
      const expectedOutput = { message: 'Image updated' };
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
    it('should call DeleteImageUseCase with user sub and filename', async () => {
      // GIVEN
      const filename = 'test.jpg';
      const expectedOutput = { message: 'Image deleted' };
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
