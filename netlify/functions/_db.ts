import { neon } from "@neondatabase/serverless";
import type { HandlerResponse } from "@netlify/functions";

export const sql = neon(process.env.DATABASE_URL as string);

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
