import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';
import { DeleteImageUseCase } from '@/src/application/media/image/use-cases/delete-image.use-case';

// Ports
import { ImagePort } from '@/src/domain/media/ports/outbound/image.port';
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

describe('DeleteImageUseCase', () => {
  let useCase: DeleteImageUseCase;
  let imagePort: jest.Mocked<ImagePort>;
  let accountPort: jest.Mocked<AccountPort>;

  const userId = 'user-123';
  const filename = 'image-to-delete.png';
  const imageId = 'img-999';

  beforeEach(async () => {
    accountPort = accountPortMock();
    imagePort = {
      findByFilename: jest.fn(),
      delete: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteImageUseCase,
        { provide: ImagePort, useValue: imagePort },
        { provide: AccountPort, useValue: accountPort },
      ],
    }).compile();

    useCase = module.get<DeleteImageUseCase>(DeleteImageUseCase);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete image file and remove database entry successfully', async () => {
      // GIVEN
      const account = AccountFactory.load({
        id: userId,
        storagePath: '/valid/storage/path',
      });
      const mockImage = {
        id: imageId,
        filename: filename,
      };

      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(mockImage as any);
      // Corregido: mockResolvedValue ahora devuelve true para cumplir el contrato
      imagePort.delete.mockResolvedValue(true);
      (fileUtils.cleanupFiles as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      const result = await useCase.execute(userId, filename);

      // THEN
      expect(accountPort.findById).toHaveBeenCalledWith(userId);
      expect(imagePort.findByFilename).toHaveBeenCalledWith(
        filename,
        account.id,
      );
      expect(fileUtils.cleanupFiles).toHaveBeenCalledWith(
        [expect.stringContaining(filename)],
        expect.any(Object),
      );
      expect(imagePort.delete).toHaveBeenCalledWith(imageId);
      expect(result.message).toBe('media.image.messages.deleted');
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

      expect(imagePort.findByFilename).not.toHaveBeenCalled();
    });

    it('should throw FileNotFoundException if image record does not exist', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(null);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );

      expect(fileUtils.cleanupFiles).not.toHaveBeenCalled();
      expect(imagePort.delete).not.toHaveBeenCalled();
    });

    it('should throw FileNotFoundException if image id is missing', async () => {
      // GIVEN
      const account = AccountFactory.load({ id: userId, storagePath: '/path' });
      const mockImageIncomplete = { filename: filename }; // Sin ID

      accountPort.findById.mockResolvedValue(account);
      imagePort.findByFilename.mockResolvedValue(mockImageIncomplete as any);

      // WHEN & THEN
      await expectDomainExceptionAsync(
        () => useCase.execute(userId, filename),
        'shared.errors.file_not_found',
        HttpStatus.NOT_FOUND,
      );
    });
  });
});
