import { OptimizationStatus } from '@/src/domain/media/value-objects/optimization-status.vo';

export type ImageOptimization = {
  taskId: string;
  status: OptimizationStatus;
  filename: string;
  filepath: string;
  mimetype: string;
  filesize: number;
  context: string;
  accountId: string;
  quotaId: string;
};
