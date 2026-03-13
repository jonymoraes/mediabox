export abstract class UpdateImagePort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
