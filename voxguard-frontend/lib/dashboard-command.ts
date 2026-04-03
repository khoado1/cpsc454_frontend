
import { RecordingPayload } from "@/lib/audio-processing";
import {
    type RecipientEvent,
    type RecipientState,
    initialRecipientState,
    recipientTransition,
} from "@/lib/recipient-domain";

import {
    type RecordingEvent,
    type RecordingState,
    initialRecordingState,
    recordingTransition,
} from "@/lib/recording-domain";
import {
    type SendRecordingEvent,
    type SendRecordingState,
    initialSendRecordingState,
    sendRecordingTransition,
} from "@/lib/send-recording-domain";

type DashboardCoreState = {};

type DashboardCoreEvent = { type: "dashboard" };

export type DashboardState = DashboardCoreState & RecipientState & RecordingState & SendRecordingState;

export type DashboardCommands = {
    setRecipient: (userId: string | null) => void;
    clearPendingRecording: () => void;
    sendRecording: (userId?: string, recording?: RecordingPayload) => Promise<void>;
    onRecordingReady: (payload: RecordingPayload) => Promise<void>;
    sendReset: () => void;
};

export type DashboardController = DashboardState & DashboardCommands;

export type DashboardDependencies = {
    sendRecordingToRecipient: (userId: string, recording: RecordingPayload) => Promise<void>;
};

type DashboardEvent = DashboardCoreEvent | RecipientEvent | RecordingEvent | SendRecordingEvent;

function asRecipientEvent(event: DashboardEvent): RecipientEvent | null {
    switch (event.type) {
        case "set-recipient":
            return event;
        default:
            return null;
    }
}

function asRecordingEvent(event: DashboardEvent): RecordingEvent | null {
    switch (event.type) {
        case "recording-ready":
        case "clear-pending-recording":
            return event;
        default:
            return null;
    }
}

function asSendRecordingEvent(event: DashboardEvent): SendRecordingEvent | null {
    switch (event.type) {
        case "send-started":
        case "send-succeeded":
        case "send-failed":
        case "send-validation-failed":
        case "send-reset":
            return event;
        default:
            return null;
    }
}

export const initialDashboardState: DashboardState = {
    ...initialRecipientState,
    ...initialRecordingState,
    ...initialSendRecordingState,
};

export function dashboardTransition(
    state: DashboardState,
    event: DashboardEvent
): DashboardState {
    const recipientEvent = asRecipientEvent(event);
    const recordingEvent = asRecordingEvent(event);
    const sendEvent = asSendRecordingEvent(event);

    const nextRecipientState = recipientEvent
        ? recipientTransition({ recipientUserId: state.recipientUserId }, recipientEvent)
        : { recipientUserId: state.recipientUserId };

    const nextRecordingState = recordingEvent
        ? recordingTransition({ pendingRecording: state.pendingRecording }, recordingEvent)
        : { pendingRecording: state.pendingRecording };

    const nextSendState = sendEvent
        ? sendRecordingTransition({ sendStatus: state.sendStatus, sendError: state.sendError }, sendEvent)
        : { sendStatus: state.sendStatus, sendError: state.sendError };

    switch (event.type) {
        case "set-recipient":
        case "clear-pending-recording":
        case "recording-ready":
        case "send-started":
        case "send-succeeded":
        case "send-validation-failed":
        case "send-failed":
        case "send-reset":
            return {
                ...state,
                ...nextRecipientState,
                ...nextRecordingState,
                ...nextSendState,
            };
        default:
            return state;
    }
}

type DashboardCommandCreateArgs = {
    deps: DashboardDependencies;
    state: DashboardState;
    send: (event: DashboardCoreEvent | RecipientEvent | RecordingEvent | SendRecordingEvent) => void;
};

export type DashboardCommandFactory = {
    create: (args: DashboardCommandCreateArgs) => DashboardCommands;
};

export const dashboardCommandFactory: DashboardCommandFactory = {
    create: ({ deps, state, send }) => ({

        setRecipient: (userId: string | null) => {
            send({ type: "set-recipient", recipientUserId: userId });
        },

        onRecordingReady: async (payload: RecordingPayload) => {
            send({ type: "recording-ready", payload });
        },

        clearPendingRecording: () => {
            send({ type: "clear-pending-recording" });
        },

        sendRecording: async (userId?: string, recording?: RecordingPayload) => {
            const resolvedUserId = userId ?? state.recipientUserId;
            const resolvedRecording = recording ?? state.pendingRecording;

            if (!resolvedUserId) {
                send({ type: "send-validation-failed", error: "Recipient user id is required." });
                return;
            }

            if (!resolvedRecording) {
                send({ type: "send-validation-failed", error: "No recording is available to send." });
                return;
            }

            send({ type: "send-started" });

            try {
                await deps.sendRecordingToRecipient(resolvedUserId, resolvedRecording);
                send({ type: "send-succeeded" });
            } catch (error) {
                send({
                    type: "send-failed",
                    error: error instanceof Error ? error.message : "Failed to send recording.",
                });
            }
        },
        sendReset: () => {
            send({ type: "send-reset" });
        },
    }),
};

