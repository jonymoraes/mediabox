export abstract class OptimizeImagePort {
  /**
   * Executes the optimization process.
   * @param jobId - Unique job identifier from the queue.
   * @param data - Job payload containing file and account metadata.
   * @param onProgress - Callback to report percentage and status.
   * @param control - Mutable object to monitor external cancellation.
   */
  abstract execute(
    jobId: string,
    data: any,
    onProgress: (percentage: number, stage: string) => Promise<void>,
    control: { cancel: boolean },
  ): Promise<{
    success: boolean;
    jobId: string;
    url: string;
  }>;
}
