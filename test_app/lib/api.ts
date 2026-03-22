import { BASE_URL } from "@/lib/config";
import { createAndStoreUserKeyMaterial, KEY_MATERIAL_ENDPOINT } from "@/lib/crypto";

export type BinaryFileRecord = {
  id: string;
  user_id: string;
  recipient_user_id: string;
};

export async function register(username: string, password: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error(`Registration failed: ${response.status}`);
  }
}

export async function login(username: string, password: string): Promise<string> {
  const response = await fetch(`${BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error("Invalid credentials");
  }

  const data = await response.json();
  // data = { access_token, token_type, expires_in }
  return data.access_token;
}

export async function uploadBinaryData(
  id: string,
  binaryData: ArrayBuffer,
  accessToken: string
): Promise<void> {
  const formData = new FormData();
  formData.append("id", id);
  formData.append("binary_data", new Blob([binaryData]));

  const response = await fetch(`${BASE_URL}/binary-files`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload binary data: ${response.status}`);
  }
}

export async function downloadBinaryFile(id: string, accessToken: string): Promise<Blob> {
  const response = await fetch(`${BASE_URL}/binary-files/${id}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status}`);
  }

  return response.blob();
}

export async function listBinaryFiles(accessToken: string): Promise<BinaryFileRecord[]> {
  const response = await fetch(`${BASE_URL}/binary-files`, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to list binary files: ${response.status}`);
  }

  const data = await response.json();
  if (Array.isArray(data)) {
    return data as BinaryFileRecord[];
  }

  if (Array.isArray(data.files)) {
    return data.files as BinaryFileRecord[];
  }

  if (Array.isArray(data.items)) {
    return data.items as BinaryFileRecord[];
  }

  return [];
}

/**
 * Full registration flow:
 * 1. Creates the user account
 * 2. Logs in to get an access token
 * 3. Generates keypair, encrypts private key with password, stores key material on server
 */
export async function registerAndSetupKeys(
  username: string,
  password: string
): Promise<string> {
  await register(username, password);
  const accessToken = await login(username, password);
  await createAndStoreUserKeyMaterial(password, KEY_MATERIAL_ENDPOINT, accessToken);
  return accessToken;
}