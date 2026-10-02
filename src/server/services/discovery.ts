/** Match literal text so user input such as % or _ never becomes a wildcard. */
export function filterDiscoveryRows<T extends Record<string, unknown>>(
  rows: T[],
  query: string | undefined,
  fields: string[]
): T[] {
  const search = query?.trim().toLowerCase();
  if (!search) return rows;
  return rows.filter((row) => fields.some((field) =>
    typeof row[field] === "string" && row[field].toLowerCase().includes(search)
  ));
}

export const caseSearchFields = ["case_name", "client_name", "summary"];
export const incidentSearchFields = ["name", "summary"];
