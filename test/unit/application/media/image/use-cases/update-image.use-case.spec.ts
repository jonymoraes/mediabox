import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { UpdateImageUseCase } from '@/src/application/media/image/use-cases/update-image.use-case';

// Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';

// Mocks & Factories
import { accountPortMock } from '@/test/mocks/domain/identity/ports/account.port.mock';
import { AccountFactory } from '@/test/mocks/domain/identity/entities/account.factory';

// Utils
import { expectDomainExceptionAsync } from '@/test/unit/domain/shared/exceptions/expect-domain-exception';

describe('UpdateImageUseCase', () => {
  let useCase: UpdateImageUseCase;
  let imagePort: jest.Mocked<ImagePort>;
  let accountPort: jest.Mocked<AccountPort>;

  const userId = 'user-123';
  const filename = 'test-image.jpg';

  beforeEach(async () => {
    accountPort = accountPortMock();
    // Manual mock for ImagePort methods
    imagePort = {
      findByFilename: jest.fn(),
      save: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateImageUseCase,
        { provide: ImagePort, useValue: imagePort },
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<UpdateImageUseCase>(UpdateImageUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should activate a temporary image successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      const mockImage = {
        status: { isTemporary: () => true },
        activate: jest.fn(),
      };

      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(mockImage as any);
      imagePort.save.mockResolvedValue(mockImage as any);

      // WHEN
      const result = await useCase.execute(userId, filename);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(userId);
      expect(imagePort.findByFilename).toHaveBeenCalledWith(
        filename,
        account.id,
      );
      expect(mockImage.activate).toHaveBeenCalled();
      expect(imagePort.save).toHaveBeenCalledWith(mockImage);
      expect(result.message).toBe('media.image.messages.activated');
    });

    it('should not call activate if image is not temporary', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      const mockImage = {
        status: { isTemporary: () => false },
        activate: jest.fn(),
      };

      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(mockImage as any);

      // WHEN
      await useCase.execute(userId, filename);

      // THEN
      expect(mockImage.activate).not.toHaveBeenCalled();
      expect(imagePort.save).not.toHaveBeenCalled();
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

      expect(imagePort.findByFilename).not.toHaveBeenCalled();
    });

    it('should throw FileNotFoundException if image does not exist', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId });
      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(null);

      // WHEN & THEN: FileNotFoundException ahora es 404 tras tu corrección
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
