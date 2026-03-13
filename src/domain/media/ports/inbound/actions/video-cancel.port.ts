export abstract class VideoCancelPort {
  abstract execute(jobId: string): Promise<{ message: string }>;
}
