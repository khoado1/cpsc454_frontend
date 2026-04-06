
import { generateSymmetricKey, generateIV, encryptWithSymmetricKey, encryptSymmetricKeyWithPublicKey, bytesToBase64 } from "@/lib/crypto";
import { fetchRecipientPublicKey as getUserPublicKey } from "@/lib/key-material";
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

export async function sendRecordingToRecipient(accessToken: string, receiver_user_id: string, data: ArrayBuffer) : Promise<string> {
    const recipientPublicKey = await getUserPublicKey(receiver_user_id, accessToken);
    const payload = await setupSendRecordingPayload(data, recipientPublicKey);

    const request_id = `${receiver_user_id}-${Date.now()}`;
    await uploadBinaryData(payload.encryptedData, receiver_user_id, request_id, accessToken);
    
    return request_id;


}
