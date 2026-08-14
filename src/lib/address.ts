export type AddressSnapshot = {
  id?: string;
  label?: string | null;
  line1?: string | null;
  line2?: string | null;
  country?: string | null;
};

export function formatAddressSnapshot(addr: AddressSnapshot | null | undefined): string {
  if (!addr) return "";
  return [addr.label, addr.line1, addr.line2, addr.country]
    .map((part) => (typeof part === "string" ? part.trim() : ""))
    .filter(Boolean)
    .join(", ");
}
