
import { generateSymmetricKey, generateIV, encryptWithSymmetricKey, encryptSymmetricKeyWithPublicKey, bytesToBase64, fetchRecipientPublicKey } from "@/lib/crypto";
import { uploadBinaryData } from "./api";

export type RecordingPayload = {
    data: ArrayBuffer;
    mimeType: string;
};

export type RecordingReadyOptions = {
    onRecordingReady?: (payload: RecordingPayload) => void | Promise<void>;
};

export type SetupSendRecordingPayload = {
    encryptedData: ArrayBuffer;
    ivBase64ForData: string;
    algorithmForData: string;

    encryptedSymmetricKeyBase64: string;
    algorithmForSymmetricKey: string;
};

export type OnRecordingReadyCallback = (payload: RecordingPayload) => Promise<void>;

export async function setupSendRecordingPayload(data: ArrayBuffer, recipientPublicKey: CryptoKey): Promise<SetupSendRecordingPayload> {
    
    const symmetricKey = await generateSymmetricKey();
    const iv = generateIV();

    const encryptedData = await encryptWithSymmetricKey(symmetricKey.key, iv, data);
    const encryptedSymmetricKey = await encryptSymmetricKeyWithPublicKey(symmetricKey.key, recipientPublicKey);

    return {
        encryptedData: encryptedData,
        ivBase64ForData: bytesToBase64(iv),
        algorithmForData: "AES-GCM",
        encryptedSymmetricKeyBase64: bytesToBase64(new Uint8Array(encryptedSymmetricKey)),
        algorithmForSymmetricKey: "RSA-OAEP-SHA-256",
    };
}

export async function sendRecordingToRecipient(accessToken: string, recipientUser: string, data: ArrayBuffer) : Promise<string> {
    const recipientPublicKey = await fetchRecipientPublicKey(recipientUser, accessToken);
    const payload = await setupSendRecordingPayload(data, recipientPublicKey);

    const fieldId = `${recipientUser}-${Date.now()}`;
    await uploadBinaryData(fieldId, recipientUser, payload.encryptedData, accessToken);
    
    return fieldId;


}
