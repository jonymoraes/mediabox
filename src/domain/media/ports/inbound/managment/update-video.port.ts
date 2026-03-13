export abstract class UpdateVideoPort {
  abstract execute(
    userId: string,
    filename: string,
  ): Promise<{ message: string }>;
}
