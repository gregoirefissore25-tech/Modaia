import { neon } from "@neondatabase/serverless";
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";

export const sql = neon(process.env.DATABASE_URL as string);

// device_id est genere client-side via crypto.randomUUID() (voir src/lib/api.ts) :
// on valide ce format cote serveur avant de creer un utilisateur, pour ne pas laisser
// n'importe quelle chaine arbitraire non authentifiee peupler la table users.
const DEVICE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidDeviceId(device: unknown): device is string {
  return typeof device === "string" && DEVICE_ID_RE.test(device);
}

export function clientIp(event: HandlerEvent): string {
  return event.headers["x-nf-client-connection-ip"] || event.headers["client-ip"] || "unknown";
}

// Rate limiting par IP, fenetre fixe stockee en base (table rate_limits, voir db/schema.sql).
// Fail-open : si la table n'existe pas encore (migration pas encore appliquee) ou en cas
// d'erreur DB, on laisse passer plutot que de casser tout l'endpoint pour une protection
// annexe. La cle combine endpoint + ip pour isoler les fenetres entre routes.
export async function checkRateLimit(
  endpoint: string,
  event: HandlerEvent,
  max: number,
  windowSeconds: number
): Promise<boolean> {
  const key = `${endpoint}:${clientIp(event)}`;
  try {
    const rows = await sql`
      insert into rate_limits (key, window_start, count)
      values (${key}, now(), 1)
      on conflict (key) do update set
        count = case
          when rate_limits.window_start < now() - (${windowSeconds} * interval '1 second')
          then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when rate_limits.window_start < now() - (${windowSeconds} * interval '1 second')
          then now()
          else rate_limits.window_start
        end
      returning count
    `;
    return (rows[0]?.count ?? 0) <= max;
  } catch (error) {
    console.error("checkRateLimit: fail-open (table manquante ou erreur DB)", error);
    return true;
  }
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
