export function downloadCsv(headers: string[], rows: (string | number)[][], filename: string) {
  const escape = (cell: string | number) => {
    const s = String(cell);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Normalize phone for 10-digit local storage (Ethiopia-style prefixes). */
export function normalizeStaffImportPhone(raw: string): string {
  let s = String(raw ?? '')
    .trim()
    .replace(/\s+/g, '');
  if (s.startsWith('+251')) s = '0' + s.slice(4);
  else if (/^251\d{9}$/.test(s)) s = '0' + s.slice(3);
  return s;
}

/**
 * Parse CSV text into rows (supports quoted fields with commas and doubled quotes).
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let i = 0;
  let inQuotes = false;

  const pushCell = () => {
    row.push(cell);
    cell = '';
  };
  const pushRow = () => {
    pushCell();
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      rows.push(row);
    }
    row = [];
  };

  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      cell += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      pushCell();
      i += 1;
      continue;
    }
    if (c === '\r' && text[i + 1] === '\n') {
      pushRow();
      i += 2;
      continue;
    }
    if (c === '\n' || c === '\r') {
      pushRow();
      i += 1;
      continue;
    }
    cell += c;
    i += 1;
  }
  pushRow();

  return rows;
}
