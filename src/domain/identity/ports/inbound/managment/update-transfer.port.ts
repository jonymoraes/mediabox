export abstract class UpdateTransferPort {
  /**
   * American English.
   * Updates the transfer quota for a specific account.
   * @param accountId - Derived from user.sub or similar identifier.
   * @param fileSizeInBytes - The size to add to the current transfer.
   */
  abstract execute(accountId: string, fileSizeInBytes: bigint): Promise<void>;
}
