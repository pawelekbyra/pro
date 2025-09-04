import { createClient } from "@vercel/kv";

function initializeKv() {
  // If we're in mock mode, return null. The app logic should handle this.
  if (process.env.MOCK_API === 'true') {
    return null;
  }

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error("Missing Vercel KV REST API environment variables. Set them in .env.local or enable MOCK_API=true for local development.");
  }

  return createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
}

export const kv = initializeKv();
