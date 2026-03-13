import {
  TranscodingStatus,
  TranscodingStatusType,
} from '@/src/domain/media/value-objects/transcoding-status.vo';

export const TranscodingStatusTransformer = {
  /**
   * From Domain to Persistence (string)
   */
  to: (status: TranscodingStatus | TranscodingStatusType): string => {
    return status instanceof TranscodingStatus ? status.getValue() : status;
  },

  /**
   * From Persistence (string) to Domain
   */
  from: (value: string): TranscodingStatus => {
    return TranscodingStatus.fromString(value);
  },
};
