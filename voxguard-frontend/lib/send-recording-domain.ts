export type SendRecordingStatus = "idle" | "sending" | "success" | "error";

export type SendRecordingState = {
    sendStatus: SendRecordingStatus;
    sendError: string | null;
};

export type SendRecordingEvent =
    | { type: "send-started" }
    | { type: "send-succeeded" }
    | { type: "send-failed"; error: string }
    | { type: "send-validation-failed"; error: string };

export const initialSendRecordingState: SendRecordingState = {
    sendStatus: "idle",
    sendError: null,
};

export function sendRecordingTransition(
    state: SendRecordingState,
    event: SendRecordingEvent
): SendRecordingState {
    switch (event.type) {
        case "send-started":
            return {
                ...state,
                sendStatus: "sending",
                sendError: null,
            };
        case "send-succeeded":
            return {
                ...state,
                sendStatus: "success",
                sendError: null,
            };
        case "send-validation-failed":
        case "send-failed":
            return {
                ...state,
                sendStatus: "error",
                sendError: event.error,
            };
        default:
            return state;
    }
}
