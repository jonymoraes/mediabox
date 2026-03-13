import { Queue } from 'bullmq';
import { createBullMQRedisConfig } from '@/src/platform/config/settings/bullmq.config';

// Dedicated queue instance for video transcoding tasks
export const videoTranscodingQueue = new Queue('video-transcoding', {
  connection: createBullMQRedisConfig(),
});
