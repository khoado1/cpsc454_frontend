
import { generateSymmetricKey, generateIV, encryptDataWithSymmetricKey, encryptSymmetricKeyWithPublicKey, bytesToBase64, decryptSymmetricKeyWithPrivateKey, base64ToBytes, decryptDataWithSymmetricKey } from "@/lib/crypto";
import { fetchRecipientPublicKey as getUserPublicKey } from "@/lib/key-material";
import { downloadBinaryFile, uploadBinaryData } from "./api";

export type RecordingPayload = {
    data: ArrayBuffer;
    mimeType: string;
};

export type RecordingReadyOptions = {
    onRecordingReady?: (payload: RecordingPayload) => void | Promise<void>;
};

export type SetupSendRecordingPayload = {
    encryptedData: ArrayBuffer;
    ivForDataBase64: string;
    algorithmForData: string;

    encryptedSymmetricKeyBase64: string;
    algorithmForSymmetricKey: string;
};

export type DownloadedRecordingPayload = {
    data: ArrayBuffer;
    mimeType: string;
};

export type OnRecordingReadyCallback = (payload: RecordingPayload) => Promise<void>;

export async function setupSendRecordingPayload(data: ArrayBuffer, recipientPublicKey: CryptoKey): Promise<SetupSendRecordingPayload> {
    
    const symmetricKey = await generateSymmetricKey();
    const iv = generateIV();

    const encryptedData = await encryptDataWithSymmetricKey(symmetricKey.key, iv, data);
    const encryptedSymmetricKey = await encryptSymmetricKeyWithPublicKey(symmetricKey.key, recipientPublicKey);

    return {
        encryptedData: encryptedData,
        ivForDataBase64: bytesToBase64(iv),
        algorithmForData: "AES-GCM",
        encryptedSymmetricKeyBase64: bytesToBase64(new Uint8Array(encryptedSymmetricKey)),
        algorithmForSymmetricKey: "RSA-OAEP-SHA-256",
    };
}

export async function sendRecordingToRecipient(accessToken: string, receiver_user_id: string, data: ArrayBuffer, mimeType: string) : Promise<string> {
    const recipientPublicKey = await getUserPublicKey(receiver_user_id, accessToken);
    const payload = await setupSendRecordingPayload(data, recipientPublicKey);

    const request_id = `${receiver_user_id}-${Date.now()}`;
    await uploadBinaryData(
        payload.encryptedData, 
        receiver_user_id, 
        request_id,
        payload.ivForDataBase64,
        payload.algorithmForData,
        payload.encryptedSymmetricKeyBase64,
        payload.algorithmForSymmetricKey,
        mimeType,
        accessToken
    );
    
    return request_id;
}

export async function downloadAndDecryptRecording(fileId: string, privateKey: CryptoKey | null, accessToken: string): Promise<DownloadedRecordingPayload> {
    
    if (!privateKey) {
        throw new Error("Private key is required to decrypt the recording.");
    }
    const downloaded = await downloadBinaryFile(fileId, accessToken);
    
    // The server should return the encrypted symmetric key and IV in the response headers or metadata.
    // For this example, let's assume they are returned in custom headers:
    const ivForDataBase64 = downloaded.headers.get("X-Iv-For-Data-Base64");
    const algorithmForData = downloaded.headers.get("X-Algorithm-For-Data");
    const encryptedSymmetricKeyBase64 = downloaded.headers.get("X-Encrypted-Symmetric-Key-Base64");
    const algorithmForSymmetricKey = downloaded.headers.get("X-Algorithm-For-Symmetric-Key");
    const decryptedContentType = downloaded.headers.get("X-Decrypted-Content-Type");
    if (!ivForDataBase64 || !algorithmForData || !encryptedSymmetricKeyBase64 || !algorithmForSymmetricKey || !decryptedContentType) {
        throw new Error("Missing encryption metadata in response headers.");
    }

    const symmetricKey = await decryptSymmetricKeyWithPrivateKey(encryptedSymmetricKeyBase64, algorithmForData, privateKey);
    
    const iv = base64ToBytes(ivForDataBase64);
    const decryptedData = await decryptDataWithSymmetricKey(symmetricKey, iv, algorithmForData, await downloaded.blob.arrayBuffer());

    return {
        data: decryptedData,
        mimeType: decryptedContentType,
    };  

}