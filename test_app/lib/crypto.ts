/**
 * Generates a 256-bit AES-GCM symmetric key.
 * Suitable for encrypting data (e.g. audio payloads).
 */
export async function generateSymmetricKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,       // extractable — allows exporting the key
    ["encrypt", "decrypt"]
  );
}

/**
 * Generates an RSA-OAEP public/private key pair.
 * The public key encrypts data; the private key decrypts it.
 */
export async function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,       // extractable — allows exporting keys
    ["encrypt", "decrypt"]
  );
}

/**
 * Exports a CryptoKey to a Base64 string for storage or transmission.
 */
export async function exportKeyToBase64(
  key: CryptoKey,
  format: "raw" | "spki" | "pkcs8"
): Promise<string> {
  const buffer = await crypto.subtle.exportKey(format, key);
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

import { BASE_URL } from "@/lib/config";
export const KEY_MATERIAL_ENDPOINT = `${BASE_URL}/user/key-material`;

const PBKDF2_ITERATIONS = 600000;
const PBKDF2_SALT_BYTES = 16;
const AES_GCM_IV_BYTES = 12;

function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

async function deriveWrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export type StoredPrivateKeyPackage = {
  encryptedPrivateKeyBase64: string;
  saltBase64: string;
  ivBase64: string;
};

type SaveKeyMaterialRequest = StoredPrivateKeyPackage & {
  publicKeyBase64: string;
};

/**
 * Creates a keypair, encrypts the private key with a password-derived key,
 * and sends public + encrypted private key material to your backend.
 */
export async function createAndStoreUserKeyMaterial(
  password: string,
  endpoint: string,
  accessToken?: string
): Promise<{ publicKeyBase64: string } & StoredPrivateKeyPackage> {
  const { publicKey, privateKey } = await generateKeyPair();

  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const wrappingKey = await deriveWrappingKey(password, salt);

  const privateKeyPkcs8 = await crypto.subtle.exportKey("pkcs8", privateKey);
  const encryptedPrivateKey = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    wrappingKey,
    privateKeyPkcs8
  );

  const payload: SaveKeyMaterialRequest = {
    publicKeyBase64: await exportKeyToBase64(publicKey, "spki"),
    encryptedPrivateKeyBase64: bytesToBase64(new Uint8Array(encryptedPrivateKey)),
    saltBase64: bytesToBase64(salt),
    ivBase64: bytesToBase64(iv),
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Failed to store key material: ${response.status}`);
  }

  return payload;
}

/**
 * Fetches encrypted private key package from your backend.
 * The returned values can be used with the same password to decrypt the private key locally.
 */
export async function fetchStoredPrivateKeyPackage(
  endpoint: string,
  accessToken?: string
): Promise<StoredPrivateKeyPackage> {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch key material: ${response.status}`);
  }

  const data = (await response.json()) as Partial<StoredPrivateKeyPackage>;
  if (!data.encryptedPrivateKeyBase64 || !data.saltBase64 || !data.ivBase64) {
    throw new Error("Server response is missing encryptedPrivateKeyBase64, saltBase64, or ivBase64");
  }

  return {
    encryptedPrivateKeyBase64: data.encryptedPrivateKeyBase64,
    saltBase64: data.saltBase64,
    ivBase64: data.ivBase64,
  };
}

/**
 * Optional helper to decrypt previously stored private key package.
 */
export async function decryptStoredPrivateKey(
  password: string,
  keyPackage: StoredPrivateKeyPackage
): Promise<CryptoKey> {
  const salt = base64ToBytes(keyPackage.saltBase64);
  const iv = base64ToBytes(keyPackage.ivBase64);
  const encryptedPrivateKey = base64ToBytes(keyPackage.encryptedPrivateKeyBase64);
  const wrappingKey = await deriveWrappingKey(password, salt);

  const pkcs8 = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    wrappingKey,
    encryptedPrivateKey as BufferSource
  );

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    ["decrypt"]
  );
}

/**
 * Fetches another user's public key by email so you can encrypt a symmetric key for them.
 * Used in the send-message flow before encrypting audio for a recipient.
 */
export async function fetchRecipientPublicKey(
  email: string,
  accessToken: string
): Promise<CryptoKey> {
  const response = await fetch(
    `${BASE_URL}/user/key-material?email=${encodeURIComponent(email)}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch recipient public key: ${response.status}`);
  }

  const data = (await response.json()) as { publicKeyBase64?: string };
  if (!data.publicKeyBase64) {
    throw new Error("Server response is missing publicKeyBase64");
  }

  const keyBytes = Uint8Array.from(atob(data.publicKeyBase64), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    keyBytes,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"]
  );
}
