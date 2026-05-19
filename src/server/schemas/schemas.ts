import { z } from "zod";
import {
  CASE_STATUSES,
  CONFIDENCE_LEVELS,
  EVIDENCE_TYPES,
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  GRAPH_EDGE_TYPES,
  GRAPH_MODES,
  GRAPH_NODE_TYPES,
  INCIDENT_SEVERITIES,
  INCIDENT_STATUSES,
  INDICATOR_TYPES,
  TASK_LINK_ENTITY_TYPES,
  TASK_PRIORITIES,
  TASK_STATUSES
} from "../../shared/domain.js";

export const uuidSchema = z.string().uuid();

export const createCaseSchema = z.object({
  caseName: z.string().min(1),
  clientName: z.string().optional(),
  startDate: z.iso.datetime().optional(),
  endDate: z.iso.datetime().optional(),
  status: z.enum(CASE_STATUSES),
  summary: z.string().optional()
});

export const updateCaseSchema = createCaseSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createIncidentSchema = z.object({
  caseId: uuidSchema,
  name: z.string().min(1),
  summary: z.string().optional(),
  severity: z.enum(INCIDENT_SEVERITIES).optional(),
  status: z.enum(INCIDENT_STATUSES)
});

export const updateIncidentSchema = createIncidentSchema.omit({ caseId: true }).partial().refine((value) => Object.keys(value).length > 0);

export const createFindingSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(FINDING_SEVERITIES).optional(),
  status: z.enum(FINDING_STATUSES),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
  impact: z.string().optional(),
  recommendation: z.string().optional(),
  ownerUserId: uuidSchema.optional()
});

export const updateFindingSchema = createFindingSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createTimelineEventSchema = z.object({
  eventTime: z.iso.datetime(),
  title: z.string().min(1),
  description: z.string().optional(),
  source: z.string().optional(),
  rawEvidenceRef: z.string().optional(),
  systemId: uuidSchema.optional(),
  accountId: uuidSchema.optional(),
  ownerUserId: uuidSchema.optional()
});

export const updateTimelineEventSchema = createTimelineEventSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createIndicatorSchema = z.object({
  indicatorType: z.enum(INDICATOR_TYPES),
  value: z.string().min(1),
  description: z.string().optional(),
  confidence: z.enum(CONFIDENCE_LEVELS).optional(),
  source: z.string().optional(),
  firstSeenAt: z.iso.datetime().optional(),
  lastSeenAt: z.iso.datetime().optional()
});

export const updateIndicatorSchema = createIndicatorSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createEvidenceLinkSchema = z.object({
  evidenceType: z.enum(EVIDENCE_TYPES),
  evidenceId: uuidSchema
});

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  ownerUserId: uuidSchema.optional(),
  assigneeUserId: uuidSchema.optional(),
  dueAt: z.iso.datetime().optional()
});

export const updateTaskSchema = createTaskSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createTaskLinkSchema = z.object({
  entityType: z.enum(TASK_LINK_ENTITY_TYPES),
  entityId: uuidSchema
});

export const createQuerySchema = z.object({
  name: z.string().min(1),
  language: z.string().min(1),
  description: z.string().optional(),
  queryBody: z.string().min(1),
  ownerUserId: uuidSchema.optional()
});

export const updateQuerySchema = createQuerySchema.partial().refine((value) => Object.keys(value).length > 0);

export const createSystemSchema = z.object({
  hostname: z.string().min(1),
  ipAddress: z.string().optional(),
  os: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional()
});

export const updateSystemSchema = createSystemSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createAccountSchema = z.object({
  username: z.string().min(1),
  domain: z.string().optional(),
  status: z.string().optional(),
  owner: z.string().optional(),
  notes: z.string().optional()
});

export const updateAccountSchema = createAccountSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createCustomTagSchema = z.object({
  name: z.string().min(1),
  color: z.string().min(1).optional()
});

export const updateCustomTagSchema = createCustomTagSchema.partial().refine((value) => Object.keys(value).length > 0);

export const attachAttackTagSchema = z.object({
  attackTagId: uuidSchema
});

export const attachCustomTagSchema = z.object({
  customTagId: uuidSchema
});
export const createEntityLinkSchema = z.object({
  sourceType: z.enum(GRAPH_NODE_TYPES),
  sourceId: uuidSchema,
  targetType: z.enum(GRAPH_NODE_TYPES),
  targetId: uuidSchema,
  linkType: z.enum(GRAPH_EDGE_TYPES)
});

export const graphQuerySchema = z.object({
  mode: z.enum(GRAPH_MODES).optional(),
  entityTypes: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").map((item) => item.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.enum(GRAPH_NODE_TYPES)).optional()),
  linkTypes: z
    .string()
    .optional()
    .transform((value) => (value ? value.split(",").map((item) => item.trim()).filter(Boolean) : undefined))
    .pipe(z.array(z.enum(GRAPH_EDGE_TYPES)).optional()),
  includeDerived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
  includeManual: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
  depth: z.enum(["1", "2", "3", "all"]).optional(),
  q: z.string().optional()
});

export const mitreMatrixQuerySchema = z.object({
  includeSubtechniques: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value !== "false"),
  minEvidence: z.coerce.number().int().min(1).optional(),
  q: z.string().optional(),
  tactic: z.string().optional(),
  entityType: z.enum(["finding", "timeline_event", "query", "task"]).optional()
});

export const addCaseMemberSchema = z.object({
  userId: uuidSchema,
  caseRole: z.string().min(1)
});

export const addIncidentMemberSchema = z.object({
  userId: uuidSchema,
  incidentRole: z.string().min(1)
});
