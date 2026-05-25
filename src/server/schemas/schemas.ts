import { z } from "zod";
import {
  CASE_MEMBER_ROLES,
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
  REPORT_TYPES,
  TASK_STATUSES
} from "../../shared/domain.js";

export const uuidSchema = z.string().uuid();
const caseMemberRoleSchema = z.preprocess(
  (value) => (value === "member" ? "analyst" : value),
  z.enum(CASE_MEMBER_ROLES)
);
export const utcIsoDatetimeSchema = z
  .iso
  .datetime()
  .refine((value) => value.endsWith("Z"), "Timestamp must be UTC ISO with a Z suffix");

export const timeRangeQuerySchema = z
  .object({
    start: utcIsoDatetimeSchema.optional(),
    end: utcIsoDatetimeSchema.optional()
  })
  .superRefine((value, ctx) => {
    if (value.start && value.end && Date.parse(value.start) > Date.parse(value.end)) {
      ctx.addIssue({
        code: "custom",
        message: "Start time must be before or equal to end time.",
        path: ["end"]
      });
    }
  });

export const createCaseSchema = z.object({
  caseName: z.string().min(1),
  clientName: z.string().optional(),
  startDate: utcIsoDatetimeSchema.optional(),
  endDate: utcIsoDatetimeSchema.optional(),
  status: z.enum(CASE_STATUSES),
  summary: z.string().optional(),
  members: z
    .array(
      z.object({
        userId: uuidSchema,
        caseRole: caseMemberRoleSchema.optional().default("analyst")
      })
    )
    .optional()
    .default([])
    .superRefine((members, ctx) => {
      const seen = new Set<string>();
      for (const [index, member] of members.entries()) {
        if (seen.has(member.userId)) {
          ctx.addIssue({
            code: "custom",
            message: "Duplicate case member.",
            path: [index, "userId"]
          });
        }
        seen.add(member.userId);
      }
    })
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
  eventTime: utcIsoDatetimeSchema,
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
  firstSeenAt: utcIsoDatetimeSchema.optional(),
  lastSeenAt: utcIsoDatetimeSchema.optional()
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
  dueAt: utcIsoDatetimeSchema.optional()
});

export const updateTaskSchema = createTaskSchema.partial().refine((value) => Object.keys(value).length > 0);

export const createTaskLinkSchema = z.object({
  entityType: z.enum(TASK_LINK_ENTITY_TYPES),
  entityId: uuidSchema
});

export const taskNoteSchema = z.object({
  content: z.string().max(1024 * 1024)
});

export const createReportTemplateSchema = z.object({
  name: z.string().min(1).max(160),
  reportType: z.enum(REPORT_TYPES),
  content: z.string().min(1).max(1024 * 1024)
});

export const updateReportTemplateSchema = createReportTemplateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0);

export const duplicateReportTemplateSchema = z.object({
  name: z.string().min(1).max(160).optional()
});

export const reportContextQuerySchema = z.object({
  type: z.enum(REPORT_TYPES),
  date: z.iso.date().optional(),
  timezone: z.string().min(1).optional()
}).superRefine((value, ctx) => {
  if (value.type === "daily" && (!value.date || !value.timezone)) {
    ctx.addIssue({
      code: "custom",
      message: "Daily report context requires date and timezone.",
      path: ["date"]
    });
  }
});

export const generateReportSchema = z.object({
  templateId: uuidSchema,
  reportType: z.enum(REPORT_TYPES),
  date: z.iso.date().optional(),
  timezone: z.string().min(1).optional(),
  useLlm: z.boolean().optional().default(false)
}).superRefine((value, ctx) => {
  if (value.reportType === "daily" && (!value.date || !value.timezone)) {
    ctx.addIssue({
      code: "custom",
      message: "Daily report generation requires date and timezone.",
      path: ["date"]
    });
  }
});

export const createReportSchema = z.object({
  templateId: uuidSchema.optional(),
  title: z.string().min(1).max(220),
  reportType: z.enum(REPORT_TYPES),
  reportDate: z.iso.date().nullable().optional(),
  timezone: z.string().min(1).nullable().optional(),
  markdown: z.string().min(1).max(2 * 1024 * 1024),
  generationMode: z.enum(["deterministic", "llm"]),
  generatedContext: z.record(z.string(), z.unknown()),
  unresolvedPlaceholders: z.array(z.string()).optional()
});

export const updateReportSchema = z.object({
  title: z.string().min(1).max(220).optional(),
  markdown: z.string().min(1).max(2 * 1024 * 1024).optional()
}).refine((value) => Object.keys(value).length > 0);

const customHeadersSchema = z
  .array(z.object({
    name: z.string().trim().min(1).max(120),
    value: z.string().max(4096)
  }))
  .max(24)
  .optional()
  .default([]);

export const upsertLlmSettingsSchema = z.object({
  provider: z.string().min(1).max(80),
  baseUrl: z.url().optional().or(z.literal("")),
  model: z.string().min(1).max(120),
  systemPrompt: z.string().max(32 * 1024).optional().default(""),
  apiKey: z.string().max(4096).optional().default(""),
  customHeaders: customHeadersSchema
});

export const createPdfTemplateSchema = z.object({
  name: z.string().min(1).max(160),
  description: z.string().max(500).optional().or(z.literal("")),
  scope: z.enum(["global", "incident"]).optional().default("global"),
  incidentId: uuidSchema.nullable().optional(),
  htmlTemplate: z.string().min(1).max(1024 * 1024),
  css: z.string().max(512 * 1024).optional().default(""),
  isDefault: z.boolean().optional().default(false)
});

export const updatePdfTemplateSchema = createPdfTemplateSchema.partial().refine((value) => Object.keys(value).length > 0);

export const duplicatePdfTemplateSchema = z.object({
  name: z.string().min(1).max(160).optional()
});

export const previewPdfTemplateSchema = z.object({
  pdfTemplateId: uuidSchema.optional(),
  htmlTemplate: z.string().max(1024 * 1024).optional(),
  css: z.string().max(512 * 1024).optional(),
  sampleMarkdown: z.string().max(2 * 1024 * 1024).optional()
});

export const exportReportPdfSchema = z.object({
  pdfTemplateId: uuidSchema.optional()
}).optional().default({});

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
  caseRole: caseMemberRoleSchema.optional().default("analyst")
});

export const updateCaseMemberSchema = z.object({
  caseRole: caseMemberRoleSchema
});

export const addIncidentMemberSchema = z.object({
  userId: uuidSchema,
  incidentRole: z.string().min(1)
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1)
});

export const resetPasswordSchema = z.object({
  newPassword: z.string().min(1),
  confirmPassword: z.string().min(1)
});
