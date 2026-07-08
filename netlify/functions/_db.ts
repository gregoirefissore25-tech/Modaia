import { neon } from "@neondatabase/serverless";
import type { HandlerResponse } from "@netlify/functions";

export const sql = neon(process.env.DATABASE_URL as string);

// device_id est genere client-side via crypto.randomUUID() (voir src/lib/api.ts) :
// on valide ce format cote serveur avant de creer un utilisateur, pour ne pas laisser
// n'importe quelle chaine arbitraire non authentifiee peupler la table users.
const DEVICE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidDeviceId(device: unknown): device is string {
  return typeof device === "string" && DEVICE_ID_RE.test(device);
}

export async function getOrCreateUser(deviceId: string): Promise<string> {
  const rows = await sql`
    insert into users (device_id) values (${deviceId})
    on conflict (device_id) do update set device_id = excluded.device_id
    returning id
  `;
  return rows[0].id as string;
}

export const json = (status: number, body: unknown): HandlerResponse => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body)
});
