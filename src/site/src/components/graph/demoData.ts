import type { GraphNode, GraphEdge } from "./demoTypes";

export const DEMO_NODES: GraphNode[] = [
  { id: "case-1", type: "case", entityId: "c1", label: "APT29 Investigation" },
  { id: "inc-1", type: "incident", entityId: "i1", label: "Initial Breach", severity: "critical" },
  { id: "inc-2", type: "incident", entityId: "i2", label: "Lateral Movement", severity: "high" },
  { id: "find-1", type: "finding", entityId: "f1", label: "Phishing email received", severity: "high", status: "Confirmed" },
  { id: "find-2", type: "finding", entityId: "f2", label: "Credential dumping via Mimikatz", severity: "critical", status: "Confirmed" },
  { id: "find-3", type: "finding", entityId: "f3", label: "RDP lateral movement", severity: "high", status: "Confirmed" },
  { id: "ind-1", type: "indicator", entityId: "io1", label: "C2 domain: update-svc.net" },
  { id: "sys-1", type: "system", entityId: "s1", label: "WS-DEV-01" },
  { id: "acc-1", type: "account", entityId: "a1", label: "svc-backup", subtitle: "Service account" },
  { id: "mitre-1", type: "mitre_technique", entityId: "m1", label: "T1566.001", subtitle: "Spearphishing" },
  { id: "mitre-2", type: "mitre_technique", entityId: "m2", label: "T1003.001", subtitle: "LSASS Memory" },
  { id: "tl-1", type: "timeline_event", entityId: "t1", label: "Phishing delivered", subtitle: "09:12 UTC" },
  { id: "tl-2", type: "timeline_event", entityId: "t2", label: "Malware executed", subtitle: "09:18 UTC" },
];

export const DEMO_EDGES: GraphEdge[] = [
  { id: "e1", source: "case-1", target: "inc-1", type: "related_to", label: "contains", derived: false },
  { id: "e2", source: "case-1", target: "inc-2", type: "related_to", label: "contains", derived: false },
  { id: "e3", source: "inc-1", target: "find-1", type: "evidence_for", label: "evidence", derived: false },
  { id: "e4", source: "inc-1", target: "find-2", type: "evidence_for", label: "evidence", derived: false },
  { id: "e5", source: "inc-2", target: "find-3", type: "evidence_for", label: "evidence", derived: false },
  { id: "e6", source: "find-1", target: "ind-1", type: "contains_ioc", label: "IOC", derived: false },
  { id: "e7", source: "find-2", target: "sys-1", type: "observed_on", label: "observed on", derived: false },
  { id: "e8", source: "find-2", target: "acc-1", type: "used_account", label: "used account", derived: false },
  { id: "e9", source: "find-1", target: "mitre-1", type: "maps_to", label: "maps to", derived: true },
  { id: "e10", source: "find-2", target: "mitre-2", type: "maps_to", label: "maps to", derived: true },
  { id: "e11", source: "inc-1", target: "tl-1", type: "followed_by", label: "timeline", derived: false },
  { id: "e12", source: "inc-1", target: "tl-2", type: "followed_by", label: "timeline", derived: false },
  { id: "e13", source: "find-2", target: "find-3", type: "related_to", label: "related", derived: true },
];
