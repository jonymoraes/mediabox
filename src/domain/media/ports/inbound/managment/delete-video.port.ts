export abstract class DeleteVideoPort {
  /**
   * @description Deletes an video by its filename and owner ID
   * @param userId The ID of the account that owns the video
   * @param filename The unique name of the file to be removed
   */
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
