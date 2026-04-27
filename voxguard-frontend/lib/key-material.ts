import {
  register,
  login,
  saveUserKeyMaterial,
  getUserKeyMaterial,
  type ApiCallOptions,
  getUsers,
} from "@/lib/api";
import {
  generateKeyPair,
  generateSalt,
  generateIV,
  deriveWrappingKey,
  exportPublicKeyToBase64,
  bytesToBase64,
  importKeyFromBase64,
} from "@/lib/crypto";
import { UserKeyMaterialInfo } from "./types";

export type RegistrationInfo = {
  accessToken: string;
  userKeyMaterial: UserKeyMaterialInfo;
};

/**
 * Creates a keypair, encrypts the private key with a password-derived key,
 * and sends public + encrypted private key material to the backend.
 */
export async function createAndStoreUserKeyMaterial(
  password: string,
  accessToken?: string
): Promise<UserKeyMaterialInfo> {
  const { key: { publicKey, privateKey } } = await generateKeyPair();

  const salt = generateSalt();
  const iv = generateIV();
  const wrappingKey = await deriveWrappingKey(password, salt);

  const privateKeyPkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    wrappingKey,
    privateKeyPkcs8
  );

  const payload: UserKeyMaterialInfo = {
    public_key_base64: await exportPublicKeyToBase64(publicKey, "spki"),
    encrypted_private_key_base64 : bytesToBase64(new Uint8Array(encryptedPrivateKey)),
    salt_base64: bytesToBase64(salt),
    iv_base64: bytesToBase64(iv),
  };

  await saveUserKeyMaterial(payload, accessToken);

  return payload;
}

/**
 * Full registration flow:
 * 1. Creates the user account
 * 2. Logs in to get an access token
 * 3. Generates keypair, encrypts private key with password, stores key material on server
 */
export async function registerAndSetupKeys(
  username: string,
  password: string,
  options?: ApiCallOptions
): Promise<RegistrationInfo> {
  await register(username, password, options);
  const accessToken = await login(username, password, options);
  const userKeyMaterial = await createAndStoreUserKeyMaterial(password, accessToken);
  return {
    accessToken,
    userKeyMaterial,
  };
}

/**
 * Fetches encrypted private key package from the backend.
 * The returned values can be used with the same password to decrypt the private key locally.
 */
export async function fetchStoredPrivateKeyPackage(
  accessToken?: string
): Promise<UserKeyMaterialInfo> {
  return await getUserKeyMaterial(accessToken);
}

/**
 * Fetches another user's public key so you can encrypt a symmetric key for them.
 * Used in the send-message flow before encrypting audio for a recipient.
 */
export async function fetchRecipientPublicKey(
  user_id: string,
  accessToken: string
): Promise<CryptoKey> {

    const users = await getUsers(accessToken);

    const user = users.find((i) => i.user_id === user_id);
    if (!user) throw new Error(`User ${user_id} not found`);

    return importKeyFromBase64(user.public_key_base64);
}
