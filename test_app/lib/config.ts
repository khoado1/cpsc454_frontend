if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL is not set in your .env.local file");
}

export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
