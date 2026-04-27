import { UserKeyMaterialInfo } from "./types";

// Crypto constants
const PBKDF2_ITERATIONS = 600000;
const PBKDF2_SALT_BYTES = 16;
const AES_GCM_IV_BYTES = 12;

export type VGCryptoKeyType = {
  algorithm: string;
  key: CryptoKey;
};

export type VGKeyPairType = {
  algorithm: string;
  key: CryptoKeyPair;
};

export function generateIV() : Uint8Array {
  return crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
}

export function generateSalt() : Uint8Array {
  return crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
}

export async function encryptDataWithSymmetricKey(key: CryptoKey, iv: Uint8Array, data: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.encrypt(
    {name: "AES-GCM", iv: iv as BufferSource}, 
    key, 
    data,
  );
}

export async function encryptSymmetricKeyWithPublicKey(symmetricKey: CryptoKey, publicKey: CryptoKey): Promise<ArrayBuffer> {
  const rawSymmetricKey = await crypto.subtle.exportKey("raw", symmetricKey);

  return await crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    publicKey,
    rawSymmetricKey as BufferSource
  );
}

/**
 * Generates a 256-bit AES-GCM symmetric key.
 * Suitable for encrypting data (e.g. audio payloads).
 */
export async function generateSymmetricKey(): Promise<VGCryptoKeyType> {
  return { 
    algorithm: "AES-GCM",
    key: await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,       // extractable — allows exporting the key
      ["encrypt", "decrypt"]
    )
  };
}

/**
 * Generates an RSA-OAEP public/private key pair.
 * The public key encrypts data; the private key decrypts it.
 */
export async function generateKeyPair(): Promise<VGKeyPairType> {
  return {
      algorithm: "RSA-OAEP-SHA256", 
      key: await crypto.subtle.generateKey(
        {
          name: "RSA-OAEP",
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]), // 65537
          hash: "SHA-256",
        },
        true,       // extractable — allows exporting keys
        ["encrypt", "decrypt"]
      )
  };
}

/**
 * Exports a CryptoKey to a Base64 string for storage or transmission.
 */
export async function exportPublicKeyToBase64(
  key: CryptoKey,
  format: "raw" | "spki" | "pkcs8"
): Promise<string> {
  const buffer = await crypto.subtle.exportKey(format, key);
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

export function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
}

export async function deriveWrappingKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
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

/**
 * Decrypts a previously stored private key package.
 */
export async function decryptStoredPrivateKey(
  password: string,
  keyPackage: UserKeyMaterialInfo
): Promise<CryptoKey> {
  const salt = base64ToBytes(keyPackage.salt_base64);
  const iv = base64ToBytes(keyPackage.iv_base64);
  const encryptedPrivateKey = base64ToBytes(keyPackage.encrypted_private_key_base64);
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

export async function importKeyFromBase64(
  keyBase64: string,
): Promise<CryptoKey> {
  
  const keyBytes = Uint8Array.from(atob(keyBase64), (i) => i.charCodeAt(0));

  return crypto.subtle.importKey(
        "spki",
        keyBytes,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["encrypt"]
    );
}

export async function decryptSymmetricKeyWithPrivateKey(encryptedSymmetricKeyBase64: string, algorithmForData: string, privateKey: CryptoKey): Promise<CryptoKey> {
  const encryptedSymmetricKeyBytes = base64ToBytes(encryptedSymmetricKeyBase64);

  return crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedSymmetricKeyBytes as BufferSource
  ).then((symmetricKeyRaw) => {
    return crypto.subtle.importKey(
      "raw",
      symmetricKeyRaw,
      { name: algorithmForData },
      false,
      ["decrypt"]
    );
  });
}

export async function decryptDataWithSymmetricKey(symmetricKey: CryptoKey, ivForData: Uint8Array, algorithmForData: string, encryptedData: ArrayBuffer): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    { name: algorithmForData, iv: ivForData as BufferSource },
    symmetricKey,
    encryptedData
  );
}