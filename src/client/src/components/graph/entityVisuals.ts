import {
  Briefcase,
  AlertTriangle,
  Clock,
  CheckSquare,
  Code2,
  Monitor,
  User,
  UserRoundCheck,
  Shield,
  Network,
  Search,
} from "lucide-react";

export const ENTITY_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  case: Briefcase,
  incident: AlertTriangle,
  finding: Search,
  timeline_event: Clock,
  task: CheckSquare,
  query: Code2,
  indicator: Network,
  system: Monitor,
  account: User,
  user: UserRoundCheck,
  mitre_technique: Shield,
  mitre_tactic: Shield,
};

export const DEFAULT_ENTITY_ICON = Network;
