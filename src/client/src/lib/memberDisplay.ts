import type { MemberItem } from "@/lib/api";

export type MemberNameMap = Record<string, string>;

export function buildMemberNameMap(members: MemberItem[] = []): MemberNameMap {
  return Object.fromEntries(
    members.map((member) => [member.userId, member.displayName || member.email || "Unknown member"])
  );
}

export function getMemberDisplayName(memberNames: MemberNameMap, userId: unknown) {
  const id = String(userId ?? "");
  if (!id) {
    return "Unassigned";
  }

  return memberNames[id] ?? "Unknown member";
}

export function withMemberDisplayNames<T extends object>(
  rows: T[],
  memberNames: MemberNameMap
) {
  return rows.map((row) => ({
    ...row,
    ownerDisplayName: getMemberDisplayName(memberNames, (row as Record<string, unknown>).ownerUserId),
    assigneeDisplayName: getMemberDisplayName(memberNames, (row as Record<string, unknown>).assigneeUserId),
  }));
}
