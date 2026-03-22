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
