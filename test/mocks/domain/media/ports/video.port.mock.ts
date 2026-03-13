import { VideoPort } from '@/src/domain/media/ports/outbound/video.port';

/**
 * Factory to create a mocked instance of VideoPort.
 * Extending the abstract class ensures prototype compatibility.
 */
export const videoPortMock = (): jest.Mocked<VideoPort> => {
  const mock = new (class extends VideoPort {
    // Video Transcoding (Redis)
    getTranscoding = jest.fn();
    saveTranscoding = jest.fn();
    updateTranscodingStatus = jest.fn();
    markTranscodingProcessing = jest.fn();
    markTranscodingCanceled = jest.fn();
    markTranscodingCompleted = jest.fn();
    deleteTranscoding = jest.fn();

    // Video Persistence (ORM)
    findById = jest.fn();
    findByAccountId = jest.fn();
    findByFilename = jest.fn();
    findExpired = jest.fn();
    save = jest.fn();
    delete = jest.fn();
  })();

  return mock as jest.Mocked<VideoPort>;
};
