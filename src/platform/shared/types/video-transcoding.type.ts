import { TranscodingStatus } from '@/src/domain/media/value-objects/transcoding-status.vo';

export type VideoTranscoding = {
  taskId: string;
  status: TranscodingStatus;
  filename: string;
  filepath: string;
  mimetype: string;
  filesize: number;
  format: string;
  accountId: string;
  quotaId: string;
};
