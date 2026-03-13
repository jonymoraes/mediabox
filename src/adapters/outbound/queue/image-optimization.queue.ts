import { Queue } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

// Dedicated queue instance for image optimization tasks
export const imageOptimizationQueue = new Queue('image-optimization', {
  connection: createBullMQRedisConfig(),
});
