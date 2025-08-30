import { createClient } from "@vercel/kv";
import { mockKv } from "./kv-mock";

let kv: typeof mockKv | ReturnType<typeof createClient>;

if (process.env.NODE_ENV === 'production') {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    throw new Error("Missing Vercel KV REST API environment variables for production");
  }
  kv = createClient({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
  });
} else {
  // For local development, use the mock
  console.log("Using mock KV store for local development.");
  kv = mockKv;
}

export { kv };
