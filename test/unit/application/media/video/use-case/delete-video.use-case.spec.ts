import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

// Use Case
import { DeleteVideoUseCase } from '@/src/application/media/video/use-cases/delete-video.use-case';

// Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks & Factories
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// Utils
import * as fileUtils from '@/src/platform/shared/utils/file.util';
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

jest.mock('@/src/platform/shared/utils/file.util', () => ({
  cleanupFiles: jest.fn(),
}));

describe('DeleteVideoUseCase', () => {
  let useCase: DeleteVideoUseCase;
  let videoPort: jest.Mocked<VideoPort>;
  let accountPort: jest.Mocked<AccountPort>;

  const userId = 'user-123';
  const filename = 'video-to-delete.mp4';
  const videoId = 'vid-999';

  beforeEach(async () => {
    accountPort = accountPortMock();
    videoPort = {
      findByFilename: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteVideoUseCase,
        { provide: VideoPort, useValue: videoPort },
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<DeleteVideoUseCase>(DeleteVideoUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete video file and remove database entry successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: userId,
        storagePath: '/valid/storage/path',
      });
      const mockVideo = {
        id: videoId,
        filename: filename,
      };

      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(mockVideo as any);
      videoPort.delete.mockResolvedValue(true);
      (fileUtils.cleanupFiles as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      const result = await useCase.execute(userId, filename);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(userId);
      expect(videoPort.findByFilename).toHaveBeenCalledWith(
        filename,
        account.id,
      );
      expect(fileUtils.cleanupFiles).toHaveBeenCalledWith(
        [expect.stringContaining(filename)],
        expect.any(Object),
      );
      expect(videoPort.delete).toHaveBeenCalledWith(videoId);
      expect(result.message).toBe('media.video.messages.deleted');
    });

    it('should throw AccountNotFoundException if account or storagePath is missing', async () => {
      // GIVEN
      accountPort.findById.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'identity.account.errors.not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(videoPort.findByFilename).not.toHaveBeenCalled();
    });

    it('should throw FileNotFoundException if video record does not exist', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(fileUtils.cleanupFiles).not.toHaveBeenCalled();
      expect(videoPort.delete).not.toHaveBeenCalled();
    });

    it('should throw FileNotFoundException if video id is missing', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      const mockVideoIncomplete = { filename: filename }; // Missing ID

      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(mockVideoIncomplete as any);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
