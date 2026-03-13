import { Injectable, Logger } from '@nestjs/common';

// Outbound Ports
import { AccountPort } from '@/src/domain/identity/ports/outbound/account.port';
import { QuotaPort } from '@/src/domain/identity/ports/outbound/quota.port';

// Domain
import { Account } from '@/src/domain/identity/entities/account.entity';
import { Role } from '@/src/domain/identity/value-objects/role.vo';
import { Quota } from '@/src/domain/identity/entities/quota.entity';

// Utils
import { ensureDir } from '@/src/platform/shared/utils/file.util';

@Injectable()
export class AccountSeeder {
  private readonly logger = new Logger(AccountSeeder.name);
  private readonly ADMIN_APIKEY =
    'bb324db151b6cb7261c1dc9de577e4530515764ec90cf9f74661400980aa25e2';

  constructor(
    private readonly accountPort: AccountPort,
    private readonly quotaPort: QuotaPort,
  ) {}

  /**
   * Seeds the initial Admin account.
   */
  async seed(): Promise<void> {
    try {
      this.logger.log('Checking for existing Admin account...');

      const existingAdmin = await this.accountPort.findByApiKey(
        this.ADMIN_APIKEY,
      );

      if (existingAdmin) {
        this.logger.log('Admin account already exists. Skipping seed.');
        return;
      }

      this.logger.log('Creating Admin Domain Entity...');
      const adminAccount = Account.create({
        name: 'System Admin',
        role: Role.admin(),
        apikey: this.ADMIN_APIKEY,
      });

      if (adminAccount.storagePath) {
        ensureDir(adminAccount.storagePath);
      }

      this.logger.log('Persisting Admin account...');
      const savedAdmin = await this.accountPort.save(adminAccount);

      if (!savedAdmin || !savedAdmin.id) {
        throw new Error('Persistence failed: Saved account missing ID');
      }

      this.logger.log(
        `Account persisted with ID: ${savedAdmin.id}. Creating Quota...`,
      );
      const quota = Quota.create({ accountId: savedAdmin.id });

      await this.quotaPort.save(quota);

      this.logger.log('SUCCESS: Admin account and quota created.');
    } catch (error) {
      this.logger.error('CRITICAL ERROR DURING SEEDING:');
      console.error(error);
    }
  }
}
