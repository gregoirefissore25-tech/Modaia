export type Product = {
  id: number;
  title: string;
  brand: string | null;
  category: string;
  price_cents: number;
  currency: string;
  image_url: string;
  merchant: string;
  merchant_id?: number;
};

export type Filters = {
  gender: "women" | "men";
  categories: string[];
  budget: number; // cents, 0 = illimite
};

export const CATEGORIES = [
  "dress", "top", "shorts", "skirt", "pants",
  "denim", "shoes", "swim", "active", "accessories"
] as const;

export const CATEGORY_LABELS: Record<string, string> = {
  dress: "Robes", top: "Hauts", shorts: "Shorts", skirt: "Jupes",
  pants: "Pantalons", denim: "Denim", shoes: "Chaussures",
  swim: "Maillots", active: "Sport", accessories: "Accessoires"
};

export const price = (cents: number, cur = "EUR") =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur }).format(cents / 100);
