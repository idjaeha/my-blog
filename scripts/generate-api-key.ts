/**
 * Generate and register an API key for blog API access.
 *
 * Usage:
 *   node --env-file=.env --import=tsx scripts/generate-api-key.ts <key-name>
 *
 * Example:
 *   node --env-file=.env --import=tsx scripts/generate-api-key.ts mcp-local
 *
 * Required env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { randomBytes, createHash } from "crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const name = process.argv[2];
if (!name) {
  console.error("Usage: npx tsx scripts/generate-api-key.ts <key-name>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const apiKey = `blog-${randomBytes(32).toString("hex")}`;
const keyHash = createHash("sha256").update(apiKey).digest("hex");

const { error } = await supabase.from("api_keys").insert({
  key_hash: keyHash,
  name,
});

if (error) {
  console.error(`Failed to register key: ${error.message}`);
  process.exit(1);
}

console.log(`API key generated for "${name}":`);
console.log(`\n  ${apiKey}\n`);
console.log("Save this key securely — it cannot be retrieved again.");
console.log("Add it to your MCP server config as BLOG_API_KEY.");
