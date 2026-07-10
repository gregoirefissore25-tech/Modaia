// Parser CSV minimal, zero dependance, gere les champs quotes avec virgules et
// retours ligne. En generateur (une ligne a la fois) : certains flux depassent
// 20000 lignes / plusieurs dizaines de colonnes, construire le tableau complet
// en memoire avant de le traiter provoquait un Out Of Memory sur la function.
export function* parseCsv(text: string): Generator<Record<string, string>> {
  let header: string[] | null = null;
  let field = "", row: string[] = [], inQuotes = false;

  function* emitRow(): Generator<Record<string, string>> {
    if (row.length <= 1 && row[0] === "") return;
    if (!header) { header = row.map((h) => h.trim().toLowerCase()); return; }
    yield Object.fromEntries(header.map((h, i) => [h, row[i] ?? ""]));
  }

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
      yield* emitRow();
      row = [];
    } else field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    yield* emitRow();
  }
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
  if (/top|shirt|blouse|pull|sweat|tee|haut|chemise|cardigan|veste|jacket|manteau|coat|polo|suit|tuxedo|costume|smoking|blazer/.test(s)) return "top";
  return null;
}

// "69.00 USD" -> { amount: 69, currency: "USD" } (format Google Shopping ; les
// flux Awin natifs ont deja search_price et currency separes).
export function parsePriceWithCurrency(raw: string): { amount: number; currency: string | null } {
  const match = (raw || "").trim().match(/^([\d.,]+)\s*([A-Z]{3})?$/);
  if (!match) return { amount: parseFloat(raw) || 0, currency: null };
  return { amount: parseFloat(match[1].replace(",", ".")) || 0, currency: match[2] || null };
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
