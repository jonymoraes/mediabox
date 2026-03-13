import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

// Use Case
import { UpdateVideoUseCase } from '@/src/application/media/video/use-cases/update-video.use-case';

// Ports
import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks & Factories
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// Utils
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

describe('UpdateVideoUseCase', () => {
  let useCase: UpdateVideoUseCase;
  let videoPort: jest.Mocked<VideoPort>;
  let accountPort: jest.Mocked<AccountPort>;

  const userId = 'user-123';
  const filename = 'test-video.mp4';

  beforeEach(async () => {
    accountPort = accountPortMock();
    videoPort = {
      findByFilename: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateVideoUseCase,
        { provide: VideoPort, useValue: videoPort },
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<UpdateVideoUseCase>(UpdateVideoUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should activate a temporary video successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      const mockVideo = {
        status: { isTemporary: () => true },
        activate: jest.fn(),
      };

      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(mockVideo as any);
      videoPort.save.mockResolvedValue(mockVideo as any);

      // WHEN
      const result = await useCase.execute(userId, filename);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(userId);
      expect(videoPort.findByFilename).toHaveBeenCalledWith(
        filename,
        account.id,
      );
      expect(mockVideo.activate).toHaveBeenCalled();
      expect(videoPort.save).toHaveBeenCalledWith(mockVideo);
      expect(result.message).toBe('media.video.messages.activated');
    });

    it('should not call activate if video is not temporary', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      const mockVideo = {
        status: { isTemporary: () => false },
        activate: jest.fn(),
      };

      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(mockVideo as any);

      // WHEN
      await useCase.execute(userId, filename);

      // THEN
      expect(mockVideo.activate).not.toHaveBeenCalled();
      expect(videoPort.save).not.toHaveBeenCalled();
    });

    it('should throw AccountNotFoundException if account does not exist', async () => {
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

    it('should throw FileNotFoundException if video does not exist', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      accountPort.findById.mockResolvedValue(account);
      videoPort.findByFilename.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
