import { RecordingPayload } from "@/lib/audio-processing";

export type RecordingState = {
    pendingRecording: RecordingPayload | null;
};

export type RecordingEvent =
    | { type: "recording-ready"; payload: RecordingPayload }
    | { type: "clear-pending-recording" };

export const initialRecordingState: RecordingState = {
    pendingRecording: null,
};

export function recordingTransition(
    state: RecordingState,
    event: RecordingEvent
): RecordingState {
    switch (event.type) {
        case "recording-ready":
            return {
                ...state,
                pendingRecording: event.payload,
            };
        case "clear-pending-recording":
            return {
                ...state,
                pendingRecording: null,
            };
        default:
            return state;
    }
}
