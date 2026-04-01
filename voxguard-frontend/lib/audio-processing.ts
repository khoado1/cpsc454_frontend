
export type RecordingReadyPayload = {
    audioData: ArrayBuffer;
    mimeType: string;
};

export type RecordingReadyOptions = {
    onRecordingReady?: (payload: RecordingReadyPayload) => void | Promise<void>;
};