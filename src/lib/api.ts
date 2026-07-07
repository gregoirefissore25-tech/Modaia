import type { Filters, Product } from "./types";

export function deviceId(): string {
  let id = localStorage.getItem("modaia_device");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("modaia_device", id);
  }
  return id;
}

export async function fetchProducts(f: Filters): Promise<Product[]> {
  const p = new URLSearchParams({
    device: deviceId(),
    gender: f.gender,
    categories: f.categories.join(","),
    budget: String(f.budget)
  });
  const r = await fetch(`/api/products?${p}`);
  const d = await r.json();
  return d.products as Product[];
}

export async function sendSwipe(productId: number, action: "like" | "pass" | "save") {
  await fetch("/api/swipe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ device: deviceId(), productId, action })
  });
}

export async function fetchSaved(): Promise<Product[]> {
  const r = await fetch(`/api/saved?device=${deviceId()}`);
  const d = await r.json();
  return d.items as Product[];
}

export async function saveProfile(profile: {
  sizes?: Record<string, string>;
  budgetMaxCents?: number;
  filters?: Partial<Filters>;
  styleVector?: Record<string, number>;
}) {
  await fetch("/api/profile", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ device: deviceId(), ...profile })
  });
}

export const goUrl = (productId: number) =>
  `/api/go?device=${deviceId()}&pid=${productId}`;
