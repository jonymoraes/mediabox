export abstract class DeleteImagePort {
  /**
   * @description Deletes an image by its filename and owner ID
   * @param userId The ID of the account that owns the image
   * @param filename The unique name of the file to be removed
   */
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
