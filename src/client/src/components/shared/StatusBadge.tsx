import { Badge } from "@/components/ui/Badge";

const STATUS_MAP: Record<string, "success" | "warning" | "danger" | "secondary" | "default"> = {
  open: "success",
  active: "success",
  online: "success",
  confirmed: "success",
  done: "success",
  resolved: "success",
  in_progress: "warning",
  medium: "warning",
  contained: "warning",
  draft: "secondary",
  low: "secondary",
  todo: "secondary",
  critical: "danger",
  high: "danger",
  closed: "danger",
  compromised: "danger",
  locked: "danger",
  blocked: "danger",
  false_positive: "secondary",
};

export function StatusBadge({ value }: { value: string }) {
  const variant = STATUS_MAP[value.toLowerCase()] ?? "secondary";
  return <Badge variant={variant}>{value}</Badge>;
}
