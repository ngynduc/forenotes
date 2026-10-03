import { Badge } from "@/components/ui/Badge";
import { X } from "lucide-react";

interface Tag {
  id: string;
  name: string;
  color?: string;
  attackId?: string;
}

interface TagManagementProps {
  disabled?: boolean;
  customTags?: Tag[];
  attackTags?: Tag[];
  onRemoveCustomTag?: (tagId: string) => void;
  onRemoveAttackTag?: (tagId: string) => void;
}

export function TagManagement({ disabled, customTags, attackTags, onRemoveCustomTag, onRemoveAttackTag }: TagManagementProps) {
  const custom = customTags ?? [];
  const attack = attackTags ?? [];

  if (custom.length === 0 && attack.length === 0) {
    return <span className="text-sm text-[var(--color-text-muted)]">No tags</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {custom.map((tag) => (
        <Badge
          key={tag.id}
          variant="secondary"
          className="gap-1"
          style={tag.color ? { backgroundColor: tag.color, color: "#fff" } : undefined}
        >
          {tag.name}
          {onRemoveCustomTag && (
            <button type="button" disabled={disabled} aria-label={`Remove ${tag.name}`} onClick={() => onRemoveCustomTag(tag.id)} className="ml-1 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      {attack.map((tag) => (
        <Badge key={tag.id} variant="outline" className="gap-1">
          {tag.attackId ? `${tag.attackId} · ${tag.name}` : tag.name}
          {onRemoveAttackTag && (
            <button type="button" disabled={disabled} aria-label={`Remove ${tag.attackId ?? tag.name}`} onClick={() => onRemoveAttackTag(tag.id)} className="ml-1 hover:opacity-70">
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}
