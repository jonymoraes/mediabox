import { Test, TestingModule } from '@nestjs/testing';
import { StaticController } from '@/src/adapters/inbound/rest/controllers/media/static.controller';
import { UpdateTransferUseCase } from '@/src/application/identity/quota/use-case/update-transfer.use-case';
import { AuthenticateGuard } from '@/src/adapters/inbound/rest/guards/authenticate.guard';
import { Session } from '@/src/adapters/inbound/rest/interfaces/auth.interface';
import { RoleType } from '@/src/domain/identity/value-objects/role.vo';
import { FastifyReply } from 'fastify';
import * as fs from 'fs';
import * as fileUtil from '@/src/platform/shared/utils/file.util';

jest.mock('fs');
jest.mock('@/src/platform/shared/utils/file.util');

describe('StaticController', () => {
  let controller: StaticController;
  let updateTransferUseCase: jest.Mocked<UpdateTransferUseCase>;

  const mockSession: Session = {
    sub: 'user-uuid-123',
    role: 'USER' as unknown as RoleType,
  };

  const mockReply = {
    header: jest.fn().mockReturnThis(),
    sendFile: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<FastifyReply>;

  const mockGuard = { canActivate: jest.fn(() => true) };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaticController],
      providers: [
        {
          provide: UpdateTransferUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    })
      .overrideGuard(AuthenticateGuard)
      .useValue(mockGuard)
      .compile();

    controller = module.get<StaticController>(StaticController);
    updateTransferUseCase = module.get(UpdateTransferUseCase);

    jest.clearAllMocks();
  });

  describe('getFile', () => {
    const path = 'images/test.jpg';
    const query = {};

    it('should throw error if file does not exist', async () => {
      // GIVEN
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      // WHEN & THEN
      await expect(
        controller.getFile(path, query, mockReply, mockSession),
      ).rejects.toThrow('shared.errors.file_not_found');
    });

    it('should throw error if file type is not recognized', async () => {
      // GIVEN
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fileUtil.getFileType as jest.Mock).mockReturnValue(null);

      // WHEN & THEN
      await expect(
        controller.getFile(path, query, mockReply, mockSession),
      ).rejects.toThrow('shared.errors.invalid_file_type');
    });

    it('should register transfer and send file successfully', async () => {
      // GIVEN
      const fileSize = 1024 * 1024;
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fileUtil.getFileType as jest.Mock).mockReturnValue('image/jpeg');
      (fs.statSync as jest.Mock).mockReturnValue({ size: fileSize });

      // WHEN
      await controller.getFile(path, query, mockReply, mockSession);

      // THEN
      expect(updateTransferUseCase.execute).toHaveBeenCalledWith(
        mockSession.sub,
        BigInt(fileSize),
      );
      expect(mockReply.sendFile).toHaveBeenCalledWith(path, expect.any(String));
    });

    it('should set Content-Disposition header if download query is true', async () => {
      // GIVEN
      const downloadQuery = { download: 'true' };
      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fileUtil.getFileType as jest.Mock).mockReturnValue('image/jpeg');
      (fs.statSync as jest.Mock).mockReturnValue({ size: 500 });

      // WHEN
      await controller.getFile(path, downloadQuery, mockReply, mockSession);

      // THEN
      expect(mockReply.header).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="test.jpg"',
      );
      expect(mockReply.sendFile).toHaveBeenCalled();
    });
  });
});
