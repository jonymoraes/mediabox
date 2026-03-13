import {
  OptimizationStatus,
  OptimizationStatusType,
} from '@/src/domain/media/value-objects/optimization-status.vo';

export const OptimizationStatusTransformer = {
  /**
   * From Domain to Persistence (string)
   */
  to: (status: OptimizationStatus | OptimizationStatusType): string => {
    return status instanceof OptimizationStatus ? status.getValue() : status;
  },

  /**
   * From Persistence (string) to Domain
   */
  from: (value: string): OptimizationStatus => {
    return OptimizationStatus.fromString(value);
  },
};
