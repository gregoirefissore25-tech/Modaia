// Parser CSV minimal, zero dependance, gere les champs quotes avec virgules et retours ligne.
export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let field = "", row: string[] = [], inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.length > 1 || row[0] !== "") rows.push(row);
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) { row.push(field); rows.push(row); }
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) =>
    Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""]))
  );
}

// Mapping categories Awin/marchands -> taxonomie Modaia
export function mapCategory(raw: string): string | null {
  const s = raw.toLowerCase();
  if (/robe|dress/.test(s)) return "dress";
  if (/jean|denim/.test(s)) return "denim";
  if (/pantalon|trouser|pant/.test(s)) return "pants";
  if (/short/.test(s)) return "shorts";
  if (/jupe|skirt/.test(s)) return "skirt";
  if (/chaussure|shoe|sneaker|sandal|boot|basket/.test(s)) return "shoes";
  if (/maillot|swim|bikini/.test(s)) return "swim";
  if (/sport|active|legging|yoga/.test(s)) return "active";
  if (/\bsacs?\b|sacoche|maroquinerie|\bbags?\b|ceinture|belt|bijou|jewel|lunette|foulard|[ée]charpe|\bgants?\b|chapeau|casquette|portefeuille|bagagerie|accessoires? de mode|fashion accessor/.test(s)) return "accessories";
  if (/top|shirt|blouse|pull|sweat|tee|haut|chemise|cardigan|veste|jacket|manteau|coat|polo/.test(s)) return "top";
  return null;
}

// Tags de style deduits du titre produit (pour le scoring F2)
export function extractTags(title: string): string[] {
  const s = title.toLowerCase();
  const tags: string[] = [];
  if (/casual|basic|everyday|lin |linen|coton|cotton/.test(s)) tags.push("casual");
  if (/chic|elegant|tailor|blazer|satin|soie|silk/.test(s)) tags.push("chic");
  if (/oversize|street|cargo|hoodie|graphic/.test(s)) tags.push("street");
  if (/boho|boh[eè]me|floral|fleur|wrap|crochet/.test(s)) tags.push("boheme");
  if (/sport|running|training|legging|active/.test(s)) tags.push("sport");
  return tags;
}
