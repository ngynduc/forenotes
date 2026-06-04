import type { GraphEdgeType, GraphMode, GraphNodeType } from "../../shared/domain.js";

export interface CreateEntityLinkInput {
  incidentId: string;
  sourceType: GraphNodeType;
  sourceId: string;
  targetType: GraphNodeType;
  targetId: string;
  linkType: GraphEdgeType;
}

export interface GraphQueryInput {
  mode?: GraphMode;
  entityTypes?: GraphNodeType[];
  linkTypes?: GraphEdgeType[];
  includeDerived: boolean;
  includeManual: boolean;
  depth?: "1" | "2" | "3" | "all";
  q?: string;
}

export interface MitreMatrixQueryInput {
  includeSubtechniques: boolean;
  minEvidence?: number;
  q?: string;
  tactic?: string;
  entityType?: "finding" | "timeline_event" | "query" | "task";
}

export interface IncidentGraphNode {
  id: string;
  type: GraphNodeType;
  entityId: string;
  label: string;
  subtitle?: string;
  status?: string;
  severity?: string;
  owner?: string;
  mitreId?: string;
  tactic?: string;
  counts?: {
    findings?: number;
    timelineEvents?: number;
    tasks?: number;
    linkedItems?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface IncidentGraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  label: string;
  derived: boolean;
  confidence?: "low" | "medium" | "high";
  sourceDescription?: string;
  metadata?: Record<string, unknown>;
}

export interface IncidentGraphResponse {
  incidentId: string;
  mode: GraphMode;
  nodes: IncidentGraphNode[];
  edges: IncidentGraphEdge[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    findings: number;
    timelineEvents: number;
    tasks: number;
    mitreTechniques: number;
    mitreTactics: number;
    systems: number;
    accounts: number;
    iocs: number;
    manualLinks: number;
    derivedLinks: number;
  };
}

export interface MitreMatrixResponse {
  incidentId: string;
  tactics: Array<{
    id: string;
    mitreId: string;
    name: string;
    order: number;
  }>;
  techniques: Array<{
    id: string;
    mitreId: string;
    name: string;
    tacticId: string;
    parentTechniqueId?: string;
    counts: {
      findings: number;
      timelineEvents: number;
      queries: number;
      tasks: number;
      total: number;
    };
    evidence: Array<{
      entityType: "finding" | "timeline_event" | "query" | "task";
      entityId: string;
      title: string;
    }>;
    firstSeen?: string;
    lastSeen?: string;
  }>;
}
