
export type RecipientState = {
    recipientUserId: string | null;
};

export type RecipientEvent = { type: "set-recipient"; recipientUserId: string };

export const initialRecipientState: RecipientState = {
    recipientUserId: null,
};

export function recipientTransition(
    state: RecipientState,
    event: RecipientEvent
): RecipientState {
    switch (event.type) {
        case "set-recipient":
            return {
                ...state,
                recipientUserId: event.recipientUserId,
            };
        default:
            return state;
    }
}
