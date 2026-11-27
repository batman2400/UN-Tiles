/**
 * Minimal client-side CSV export helper — no external dependency required.
 * Neutralizes spreadsheet formula injection (=, +, -, @, tab, CR) and
 * escapes values per RFC 4180 (quotes doubled, wrapped when containing
 * commas/quotes/newlines) before triggering a browser download.
 */
const FORMULA_PREFIX_RE = /^[=+\-@\t\r]/;

export function escapeCsvValue(value: unknown): string {
  let str = value === null || value === undefined ? "" : String(value);
  if (FORMULA_PREFIX_RE.test(str)) {
    str = `'${str}`;
  }
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvValue).join(","));
  const csvContent = lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
