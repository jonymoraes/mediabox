export abstract class ImageCancelPort {
  abstract execute(jobId: string): Promise<{ message: string }>;
}
