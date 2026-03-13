import { Logger } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import { dirname } from 'path';
import { ensureDir } from './file.util';

import {
  VideoTranscodeException,
  VideoMetadataException,
} from '@/src/domain/media/exceptions/video.exceptions';
import { ProcessCanceledException } from '@/src/domain/shared/exceptions/common.exceptions';

export interface TranscodeOptions {
  input: string;
  output: string;
  videoCodec: string;
  audioCodec: string;
  duration?: number;
  loggerName: string;
  onProgress?: (percentage: number, stage: string) => void;
  onCancel?: () => boolean;
}

/**
 * Transcodes a video using ffmpeg spawn process.
 * Monitors progress via stderr parsing and supports process cancellation.
 */
export const transcodeVideo = async (
  options: TranscodeOptions,
): Promise<void> => {
  const {
    input,
    output,
    videoCodec,
    audioCodec,
    duration,
    loggerName,
    onProgress,
    onCancel,
  } = options;

  const logger = new Logger(loggerName);

  ensureDir(dirname(output));

  return new Promise<void>((resolve, reject) => {
    const ffmpeg: ChildProcessWithoutNullStreams = spawn('ffmpeg', [
      '-y',
      '-i',
      input,
      '-c:v',
      videoCodec,
      '-b:v',
      '1M',
      '-c:a',
      audioCodec,
      output,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      const line = data.toString();
      logger.debug(`ffmpeg: ${line}`);

      if (onCancel?.()) {
        logger.warn('Killing ffmpeg process due to cancellation');
        ffmpeg.kill('SIGINT');
        return reject(new ProcessCanceledException());
      }

      if (duration && onProgress) {
        const match = line.match(/time=(\d+):(\d+):(\d+\.\d+)/);
        if (match) {
          const [, hh, mm, ss] = match;
          const current =
            parseInt(hh) * 3600 + parseInt(mm) * 60 + parseFloat(ss);
          const percentage = Math.min(
            95,
            Math.floor((current / duration) * 65) + 15,
          );
          onProgress(percentage, 'transcoding');
        }
      }
    });

    ffmpeg.on('error', (err) => {
      logger.error(`ffmpeg execution error: ${err.message}`);
      reject(new VideoTranscodeException());
    });

    ffmpeg.on('close', (code) => {
      if (onCancel?.()) return reject(new ProcessCanceledException());

      if (code === 0) {
        resolve();
      } else {
        logger.error(`ffmpeg process exited with code ${code}`);
        reject(new VideoTranscodeException());
      }
    });
  });
};

/**
 * Gets the duration of a video file using ffprobe.
 * Returns the duration in seconds.
 */
export const getVideoDuration = async (
  filepath: string,
  loggerName = 'VideoProcessor',
): Promise<number> => {
  const logger = new Logger(loggerName);

  return new Promise<number>((resolve, reject) => {
    const ffprobe = spawn('ffprobe', [
      '-v',
      'error',
      '-select_streams',
      'v:0',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      filepath,
    ]);

    let output = '';
    let errorOutput = '';

    ffprobe.stdout.on('data', (data: Buffer) => (output += data.toString()));
    ffprobe.stderr.on(
      'data',
      (data: Buffer) => (errorOutput += data.toString()),
    );

    ffprobe.on('close', (code: number) => {
      if (code === 0) {
        const duration = parseFloat(output.trim());
        if (isNaN(duration)) {
          logger.error(`Duration is NaN. Output: "${output}"`);
          reject(new VideoMetadataException());
        } else {
          resolve(duration);
        }
      } else {
        logger.error(`ffprobe failed. Code: ${code}. Error: ${errorOutput}`);
        reject(new VideoMetadataException());
      }
    });
  });
};
