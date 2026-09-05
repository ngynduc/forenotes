import type { TimeFilterRequest } from "@/lib/timeFilters";
import type { IncidentReport, LlmSettingsStatus, PdfTemplate, ReportContext, ReportTemplate } from "@shared/reportTypes";

const BASE = "/api";

export interface CurrentUser {
  id: string;
  username: string;
  email: string;
  displayName: string;
  globalRole: string;
  status: string;
  mustChangePassword: boolean;
  isBootstrapAdmin: boolean;
}

export interface UserItem {
  id: string;
  username: string;
  email: string;
  displayName: string;
  globalRole: string;
  status: string;
  mustChangePassword?: boolean;
  isBootstrapAdmin?: boolean;
  lastLoginAt?: string;
}

export interface CreateUserInput {
  username?: string;
  email: string;
  displayName: string;
  globalRole: string;
  password?: string;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface MemberItem {
  userId: string;
  displayName: string;
  email: string;
  caseRole?: string;
  incidentRole?: string;
}

export interface CaseItem {
  id: string;
  caseName: string;
  clientName?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  summary?: string;
  userCaseRole?: string;
  activeIncidents?: number;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreateCaseInput {
  caseName: string;
  clientName?: string;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  summary?: string;
  members?: Array<{ userId: string; caseRole: string }>;
}

export interface IncidentItem {
  id: string;
  caseId: string;
  name: string;
  summary?: string;
  severity: string;
  status: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface CreateIncidentInput {
  name: string;
  summary?: string;
  severity?: string;
  status: string;
}

export interface TagItem {
  id: string;
  name: string;
  color?: string;
}

export interface AttackTagItem {
  id: string;
  attackId: string;
  name: string;
  type: string;
  tactic?: string;
}

export interface FindingItem {
  id: string;
  title: string;
  description?: string;
  severity?: string;
  status: string;
  confidence?: string;
  impact?: string;
  recommendation?: string;
  ownerUserId?: string;
  customTags?: TagItem[];
  attackTags?: AttackTagItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFindingInput {
  title: string;
  description?: string;
  severity?: string;
  status: string;
  confidence?: string;
  impact?: string;
  recommendation?: string;
  ownerUserId?: string;
}

export interface TimelineEventItem {
  id: string;
  eventTime: string;
  title: string;
  description?: string;
  source?: string;
  rawEvidenceRef?: string;
  systemId?: string;
  accountId?: string;
  ownerUserId?: string;
  customTags?: TagItem[];
  attackTags?: AttackTagItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateTimelineEventInput {
  title: string;
  eventTime: string;
  description?: string;
  source?: string;
  rawEvidenceRef?: string;
  systemId?: string;
  accountId?: string;
  ownerUserId?: string;
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  ownerUserId?: string;
  assigneeUserId?: string;
  dueAt?: string;
  updatedAt?: string;
}

export interface TaskNote {
  content: string;
  updatedAt?: string;
}

export interface UploadedTaskNoteImage {
  id: string;
  url: string;
  filename: string;
}

export interface UploadedReportImage {
  id: string;
  url: string;
  filename: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status: string;
  priority: string;
  ownerUserId?: string;
  assigneeUserId?: string;
  dueAt?: string | null;
}

export interface QueryItem {
  id: string;
  name: string;
  language: string;
  description?: string;
  queryBody: string;
  ownerUserId?: string;
  updatedAt?: string;
}

export interface CreateQueryInput {
  name: string;
  language: string;
  description?: string;
  queryBody: string;
  ownerUserId?: string;
}

export interface IndicatorItem {
  id: string;
  indicatorType: string;
  value: string;
  description?: string;
  confidence?: string;
  source?: string;
  firstSeenAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
}

export interface CreateIndicatorInput {
  indicatorType: string;
  value: string;
  description?: string;
  confidence?: string;
  source?: string;
  firstSeenAt?: string | null;
  lastSeenAt?: string | null;
}

export interface SystemItem {
  id: string;
  hostname: string;
  ipAddress?: string;
  os?: string;
  status?: string;
  owner?: string;
  notes?: string;
  updatedAt?: string;
}

export interface CreateSystemInput {
  hostname: string;
  ipAddress?: string;
  os?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

export interface AccountItem {
  id: string;
  username: string;
  domain?: string;
  status?: string;
  owner?: string;
  notes?: string;
  updatedAt?: string;
}

export interface CreateAccountInput {
  username: string;
  domain?: string;
  status?: string;
  owner?: string;
  notes?: string;
}

export interface CustomTagItem {
  id: string;
  name: string;
  color?: string;
  updatedAt?: string;
}

export interface EntityLinkItem {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
}

export interface CreateEntityLinkInput {
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  linkType: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  eventType: string;
  entityType: string;
  entityId: string;
  unseen: boolean;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  afterJson?: unknown;
  source?: string;
  createdAt: string;
}

export interface SearchResultItem {
  entityType: string;
  entityId: string;
  title: string;
  caseName: string;
  incidentName: string;
  snippet?: string;
}

export interface SearchResponse {
  results: SearchResultItem[];
}

export interface CreateReportTemplateInput {
  name: string;
  reportType: "daily" | "incident";
  content: string;
}

export interface GenerateReportInput {
  templateId: string;
  reportType: "daily" | "incident";
  date?: string;
  timezone?: string;
  useLlm?: boolean;
}

export interface CreateReportInput {
  templateId?: string;
  title: string;
  reportType: "daily" | "incident";
  reportDate?: string | null;
  timezone?: string | null;
  markdown: string;
  generationMode: "deterministic" | "llm";
  generatedContext: ReportContext;
  unresolvedPlaceholders?: string[];
}

export interface SaveLlmSettingsInput {
  provider: string;
  baseUrl?: string;
  model: string;
  systemPrompt?: string;
  apiKey?: string;
  customHeaders?: Array<{ name: string; value: string }>;
}

export interface CreatePdfTemplateInput {
  name: string;
  description?: string;
  scope: "global" | "incident";
  incidentId?: string | null;
  htmlTemplate: string;
  css?: string;
  isDefault?: boolean;
}

interface RawCurrentUser {
  id: string;
  username?: string;
  email: string;
  displayName?: string;
  display_name?: string;
  globalRole?: string;
  global_role?: string;
  status: string;
  mustChangePassword?: boolean;
  must_change_password?: boolean;
  isBootstrapAdmin?: boolean;
  is_bootstrap_admin?: boolean;
}

interface RawUserItem {
  id: string;
  username?: string;
  email: string;
  display_name?: string;
  global_role?: string;
  status: string;
  must_change_password?: boolean;
  is_bootstrap_admin?: boolean;
  last_login_at?: string;
}

interface RawMemberItem {
  user_id: string;
  display_name?: string;
  email: string;
  case_role?: string;
  incident_role?: string;
}

interface RawCaseItem {
  id: string;
  case_name: string;
  client_name?: string;
  start_date?: string;
  end_date?: string;
  status: string;
  summary?: string;
  user_case_role?: string;
  active_incidents?: number;
  updated_at?: string;
  created_at?: string;
}

interface RawIncidentItem {
  id: string;
  case_id: string;
  name: string;
  summary?: string;
  severity: string;
  status: string;
  updated_at?: string;
  created_at?: string;
}

interface RawTagItem {
  id: string;
  name: string;
  color?: string;
}

interface RawAttackTagItem {
  id: string;
  attack_id: string;
  name: string;
  type: string;
  tactic?: string;
}

interface RawFindingItem {
  id: string;
  title: string;
  description?: string;
  severity?: string;
  status: string;
  confidence?: string;
  impact?: string;
  recommendation?: string;
  owner_user_id?: string;
  custom_tags?: RawTagItem[];
  attack_tags?: RawAttackTagItem[];
  created_at?: string;
  updated_at?: string;
}

interface RawTimelineEventItem {
  id: string;
  event_time: string;
  title: string;
  description?: string;
  source?: string;
  raw_evidence_ref?: string;
  system_id?: string;
  account_id?: string;
  owner_user_id?: string;
  custom_tags?: RawTagItem[];
  attack_tags?: RawAttackTagItem[];
  created_at?: string;
  updated_at?: string;
}

interface RawTaskItem {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  owner_user_id?: string;
  assignee_user_id?: string;
  due_at?: string;
  updated_at?: string;
}

interface RawQueryItem {
  id: string;
  name: string;
  language: string;
  description?: string;
  query_body: string;
  owner_user_id?: string;
  updated_at?: string;
}

interface RawIndicatorItem {
  id: string;
  indicator_type: string;
  value: string;
  description?: string;
  confidence?: string;
  source?: string;
  first_seen_at?: string;
  last_seen_at?: string;
  updated_at?: string;
}

interface RawSystemItem {
  id: string;
  hostname: string;
  ip_address?: string;
  os?: string;
  status?: string;
  owner?: string;
  notes?: string;
  updated_at?: string;
}

interface RawAccountItem {
  id: string;
  username: string;
  domain?: string;
  status?: string;
  owner?: string;
  notes?: string;
  updated_at?: string;
}

interface RawCustomTagItem {
  id: string;
  name: string;
  color?: string;
  updated_at?: string;
}

interface RawEntityLinkItem {
  id: string;
  source_type: string;
  source_id: string;
  target_type: string;
  target_id: string;
  link_type: string;
}

interface RawEntityLinksResponse {
  entityLinks?: RawEntityLinkItem[];
  links?: RawEntityLinkItem[];
}

interface RawNotificationItem {
  id: string;
  title: string;
  body?: string | null;
  event_type: string;
  entity_type: string;
  entity_id: string;
  unseen: boolean;
  created_at: string;
}

interface RawAuditLogItem {
  id: string;
  actor_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  after_json?: unknown;
  source?: string;
  created_at: string;
}

interface RawSearchResultItem {
  entity_type: string;
  entity_id: string;
  title: string;
  case_name: string;
  incident_name: string;
  snippet?: string;
}

interface RawReportTemplate {
  id: string;
  incident_id: string;
  name: string;
  report_type: "daily" | "incident";
  content: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

interface RawIncidentReport {
  id: string;
  incident_id: string;
  template_id?: string | null;
  title: string;
  report_type: "daily" | "incident";
  report_date?: string | null;
  timezone?: string | null;
  markdown: string;
  generation_mode: "deterministic" | "llm";
  generated_context: ReportContext;
  unresolved_placeholders?: string[];
  created_by_user_id: string;
  updated_by_user_id?: string | null;
  created_at: string;
  updated_at: string;
}

interface RawPdfTemplate {
  id: string;
  name: string;
  description?: string | null;
  scope: "global" | "incident";
  incidentId?: string | null;
  incident_id?: string | null;
  htmlTemplate?: string;
  html_template?: string;
  css: string;
  isDefault?: boolean;
  is_default?: boolean;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

function normalizeCurrentUser(user: RawCurrentUser): CurrentUser {
  return {
    id: user.id,
    username: user.username ?? user.email,
    email: user.email,
    displayName: user.displayName ?? user.display_name ?? user.email,
    globalRole: user.globalRole ?? user.global_role ?? "analyst",
    status: user.status,
    mustChangePassword: user.mustChangePassword ?? user.must_change_password ?? false,
    isBootstrapAdmin: user.isBootstrapAdmin ?? user.is_bootstrap_admin ?? false,
  };
}

function normalizeUser(user: RawUserItem): UserItem {
  return {
    id: user.id,
    username: user.username ?? user.email,
    email: user.email,
    displayName: user.display_name ?? user.email,
    globalRole: user.global_role ?? "analyst",
    status: user.status,
    mustChangePassword: user.must_change_password,
    isBootstrapAdmin: user.is_bootstrap_admin,
    lastLoginAt: user.last_login_at,
  };
}

function normalizeMember(member: RawMemberItem): MemberItem {
  return {
    userId: member.user_id,
    displayName: member.display_name ?? member.email,
    email: member.email,
    caseRole: member.case_role,
    incidentRole: member.incident_role,
  };
}

function normalizeCase(item: RawCaseItem): CaseItem {
  return {
    id: item.id,
    caseName: item.case_name,
    clientName: item.client_name,
    startDate: item.start_date,
    endDate: item.end_date,
    status: item.status,
    summary: item.summary,
    userCaseRole: item.user_case_role,
    activeIncidents: item.active_incidents,
    updatedAt: item.updated_at,
    createdAt: item.created_at,
  };
}

function normalizeIncident(item: RawIncidentItem): IncidentItem {
  return {
    id: item.id,
    caseId: item.case_id,
    name: item.name,
    summary: item.summary,
    severity: item.severity,
    status: item.status,
    updatedAt: item.updated_at,
    createdAt: item.created_at,
  };
}

function normalizeTag(item: RawTagItem): TagItem {
  return {
    id: item.id,
    name: item.name,
    color: item.color,
  };
}

function normalizeAttackTag(item: RawAttackTagItem): AttackTagItem {
  return {
    id: item.id,
    attackId: item.attack_id,
    name: item.name,
    type: item.type,
    tactic: item.tactic,
  };
}

function normalizeFinding(item: RawFindingItem): FindingItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    severity: item.severity,
    status: item.status,
    confidence: item.confidence,
    impact: item.impact,
    recommendation: item.recommendation,
    ownerUserId: item.owner_user_id,
    customTags: item.custom_tags?.map(normalizeTag),
    attackTags: item.attack_tags?.map(normalizeAttackTag),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizeTimelineEvent(item: RawTimelineEventItem): TimelineEventItem {
  return {
    id: item.id,
    eventTime: item.event_time,
    title: item.title,
    description: item.description,
    source: item.source,
    rawEvidenceRef: item.raw_evidence_ref,
    systemId: item.system_id,
    accountId: item.account_id,
    ownerUserId: item.owner_user_id,
    customTags: item.custom_tags?.map(normalizeTag),
    attackTags: item.attack_tags?.map(normalizeAttackTag),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizeTask(item: RawTaskItem): TaskItem {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    status: item.status,
    priority: item.priority,
    ownerUserId: item.owner_user_id,
    assigneeUserId: item.assignee_user_id,
    dueAt: item.due_at,
    updatedAt: item.updated_at,
  };
}

function normalizeQuery(item: RawQueryItem): QueryItem {
  return {
    id: item.id,
    name: item.name,
    language: item.language,
    description: item.description,
    queryBody: item.query_body,
    ownerUserId: item.owner_user_id,
    updatedAt: item.updated_at,
  };
}

function normalizeIndicator(item: RawIndicatorItem): IndicatorItem {
  return {
    id: item.id,
    indicatorType: item.indicator_type,
    value: item.value,
    description: item.description,
    confidence: item.confidence,
    source: item.source,
    firstSeenAt: item.first_seen_at,
    lastSeenAt: item.last_seen_at,
    updatedAt: item.updated_at,
  };
}

function normalizeSystem(item: RawSystemItem): SystemItem {
  return {
    id: item.id,
    hostname: item.hostname,
    ipAddress: item.ip_address,
    os: item.os,
    status: item.status,
    owner: item.owner,
    notes: item.notes,
    updatedAt: item.updated_at,
  };
}

function normalizeAccount(item: RawAccountItem): AccountItem {
  return {
    id: item.id,
    username: item.username,
    domain: item.domain,
    status: item.status,
    owner: item.owner,
    notes: item.notes,
    updatedAt: item.updated_at,
  };
}

function normalizeCustomTag(item: RawCustomTagItem): CustomTagItem {
  return {
    id: item.id,
    name: item.name,
    color: item.color,
    updatedAt: item.updated_at,
  };
}

function normalizeEntityLink(item: RawEntityLinkItem): EntityLinkItem {
  return {
    id: item.id,
    sourceType: item.source_type,
    sourceId: item.source_id,
    targetType: item.target_type,
    targetId: item.target_id,
    linkType: item.link_type,
  };
}

function normalizeNotification(item: RawNotificationItem): NotificationItem {
  return {
    id: item.id,
    title: item.title,
    body: item.body ?? undefined,
    eventType: item.event_type,
    entityType: item.entity_type,
    entityId: item.entity_id,
    unseen: item.unseen,
    createdAt: item.created_at,
  };
}

function normalizeAuditLog(item: RawAuditLogItem): AuditLogItem {
  return {
    id: item.id,
    actorUserId: item.actor_user_id,
    action: item.action,
    entityType: item.entity_type,
    entityId: item.entity_id,
    afterJson: item.after_json,
    source: item.source,
    createdAt: item.created_at,
  };
}

function normalizeSearchResult(item: RawSearchResultItem): SearchResultItem {
  return {
    entityType: item.entity_type,
    entityId: item.entity_id,
    title: item.title,
    caseName: item.case_name,
    incidentName: item.incident_name,
    snippet: item.snippet,
  };
}

function normalizeReportTemplate(item: RawReportTemplate): ReportTemplate {
  return {
    id: item.id,
    incidentId: item.incident_id,
    name: item.name,
    reportType: item.report_type,
    content: item.content,
    createdByUserId: item.created_by_user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizeReport(item: RawIncidentReport): IncidentReport {
  return {
    id: item.id,
    incidentId: item.incident_id,
    templateId: item.template_id,
    title: item.title,
    reportType: item.report_type,
    reportDate: item.report_date,
    timezone: item.timezone,
    markdown: item.markdown,
    generationMode: item.generation_mode,
    generatedContext: item.generated_context,
    unresolvedPlaceholders: item.unresolved_placeholders ?? [],
    createdByUserId: item.created_by_user_id,
    updatedByUserId: item.updated_by_user_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function normalizePdfTemplate(item: RawPdfTemplate): PdfTemplate {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    scope: item.scope,
    incidentId: item.incidentId ?? item.incident_id,
    htmlTemplate: item.htmlTemplate ?? item.html_template ?? "",
    css: item.css,
    isDefault: item.isDefault ?? item.is_default ?? false,
    createdBy: item.createdBy ?? item.created_by ?? "",
    createdAt: item.createdAt ?? item.created_at ?? "",
    updatedAt: item.updatedAt ?? item.updated_at ?? "",
  };
}

class ApiClient {
  private headers(): Record<string, string> {
    return {};
  }

  private withQueryParams(path: string, params?: Record<string, string | undefined>) {
    if (!params) {
      return path;
    }

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        query.set(key, value);
      }
    }

    const serialized = query.toString();
    return serialized ? `${path}?${serialized}` : path;
  }

  private async request<T>(url: string, method: string = "GET", body?: unknown): Promise<T> {
    const headers: Record<string, string> = { ...this.headers() };
    if (body) {
      headers["Content-Type"] = "application/json";
    }
    const res = await fetch(`${BASE}${url}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: "include",
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const msg = payload?.error ?? `${method} ${url} failed`;
      throw new Error(msg);
    }
    if (res.status === 204) return {} as T;
    return res.json();
  }

  getMe = async () => {
    const payload = await this.request<{ user: RawCurrentUser; permissions: string[] }>("/auth/me");
    return { user: normalizeCurrentUser(payload.user), permissions: payload.permissions };
  };

  login = async (data: LoginInput) => {
    const payload = await this.request<{ user: RawCurrentUser }>("/auth/login", "POST", data);
    return { user: normalizeCurrentUser(payload.user) };
  };

  logout = async () => {
    await this.request<void>("/auth/logout", "POST");
  };

  listUsers = async () => {
    const payload = await this.request<{ users: RawUserItem[] }>("/users");
    return { users: payload.users.map(normalizeUser) };
  };

  createUser = async (data: CreateUserInput) => {
    const payload = await this.request<{ user: RawUserItem }>("/users", "POST", data);
    return { user: normalizeUser(payload.user) };
  };

  listCases = async () => {
    const payload = await this.request<{ cases: RawCaseItem[] }>("/cases");
    return { cases: payload.cases.map(normalizeCase) };
  };

  createCase = async (data: CreateCaseInput) => {
    const payload = await this.request<{ case: RawCaseItem }>("/cases", "POST", data);
    return { case: normalizeCase(payload.case) };
  };

  updateCase = async (id: string, data: Partial<CreateCaseInput>) => {
    const payload = await this.request<{ case: RawCaseItem }>(`/cases/${id}`, "PATCH", data);
    return { case: normalizeCase(payload.case) };
  };

  getCaseMembers = async (caseId: string) => {
    const payload = await this.request<{ members: RawMemberItem[] }>(`/cases/${caseId}/members`);
    return { members: payload.members.map(normalizeMember) };
  };

  addCaseMember = (caseId: string, data: { userId: string; caseRole: string }) =>
    this.request(`/cases/${caseId}/members`, "POST", data);

  updateCaseMember = (caseId: string, userId: string, data: { caseRole: string }) =>
    this.request(`/cases/${caseId}/members/${userId}`, "PATCH", data);

  removeCaseMember = (caseId: string, userId: string) =>
    this.request(`/cases/${caseId}/members/${userId}`, "DELETE");

  changePassword = (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    this.request("/auth/change-password", "POST", data);

  resetUserPassword = (userId: string, data: { newPassword: string; confirmPassword: string }) =>
    this.request(`/users/${userId}/reset-password`, "POST", data);

  listIncidents = async (caseId: string) => {
    const payload = await this.request<{ incidents: RawIncidentItem[] }>(`/cases/${caseId}/incidents`);
    return { incidents: payload.incidents.map(normalizeIncident) };
  };

  createIncident = async (caseId: string, data: CreateIncidentInput) => {
    const payload = await this.request<{ incident: RawIncidentItem }>(`/cases/${caseId}/incidents`, "POST", data);
    return { incident: normalizeIncident(payload.incident) };
  };

  updateIncident = async (id: string, data: Partial<CreateIncidentInput>) => {
    const payload = await this.request<{ incident: RawIncidentItem }>(`/incidents/${id}`, "PATCH", data);
    return { incident: normalizeIncident(payload.incident) };
  };

  getIncidentMembers = async (incidentId: string) => {
    const payload = await this.request<{ members: RawMemberItem[] }>(`/incidents/${incidentId}/members`);
    return { members: payload.members.map(normalizeMember) };
  };

  addIncidentMember = (incidentId: string, data: { userId: string; incidentRole: string }) =>
    this.request(`/incidents/${incidentId}/members`, "POST", data);

  removeIncidentMember = (incidentId: string, userId: string) =>
    this.request(`/incidents/${incidentId}/members/${userId}`, "DELETE");

  listFindings = async (incidentId: string, filter?: TimeFilterRequest | null) => {
    const payload = await this.request<{ findings: RawFindingItem[] }>(
      this.withQueryParams(`/incidents/${incidentId}/findings`, {
        field: filter?.field,
        start: filter?.start,
        end: filter?.end,
      })
    );
    return { findings: payload.findings.map(normalizeFinding) };
  };

  createFinding = async (incidentId: string, data: CreateFindingInput) => {
    const payload = await this.request<{ finding: RawFindingItem }>(`/incidents/${incidentId}/findings`, "POST", data);
    return { finding: normalizeFinding(payload.finding) };
  };

  updateFinding = async (incidentId: string, id: string, data: Partial<CreateFindingInput>) => {
    const payload = await this.request<{ finding: RawFindingItem }>(`/incidents/${incidentId}/findings/${id}`, "PATCH", data);
    return { finding: normalizeFinding(payload.finding) };
  };

  deleteFinding = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/findings/${id}`, "DELETE");

  listTimelineEvents = async (incidentId: string, filter?: TimeFilterRequest | null) => {
    const payload = await this.request<{ timelineEvents: RawTimelineEventItem[] }>(
      this.withQueryParams(`/incidents/${incidentId}/timeline-events`, {
        field: filter?.field,
        start: filter?.start,
        end: filter?.end,
      })
    );
    return { timelineEvents: payload.timelineEvents.map(normalizeTimelineEvent) };
  };

  createTimelineEvent = async (incidentId: string, data: CreateTimelineEventInput) => {
    const payload = await this.request<{ timelineEvent: RawTimelineEventItem }>(`/incidents/${incidentId}/timeline-events`, "POST", data);
    return { timelineEvent: normalizeTimelineEvent(payload.timelineEvent) };
  };

  updateTimelineEvent = async (incidentId: string, id: string, data: Partial<CreateTimelineEventInput>) => {
    const payload = await this.request<{ timelineEvent: RawTimelineEventItem }>(`/incidents/${incidentId}/timeline-events/${id}`, "PATCH", data);
    return { timelineEvent: normalizeTimelineEvent(payload.timelineEvent) };
  };

  deleteTimelineEvent = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/timeline-events/${id}`, "DELETE");

  listTasks = async (incidentId: string) => {
    const payload = await this.request<{ tasks: RawTaskItem[] }>(`/incidents/${incidentId}/tasks`);
    return { tasks: payload.tasks.map(normalizeTask) };
  };

  createTask = async (incidentId: string, data: CreateTaskInput) => {
    const payload = await this.request<{ task: RawTaskItem }>(`/incidents/${incidentId}/tasks`, "POST", data);
    return { task: normalizeTask(payload.task) };
  };

  updateTask = async (incidentId: string, id: string, data: Partial<CreateTaskInput>) => {
    const payload = await this.request<{ task: RawTaskItem }>(`/incidents/${incidentId}/tasks/${id}`, "PATCH", data);
    return { task: normalizeTask(payload.task) };
  };

  deleteTask = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/tasks/${id}`, "DELETE");

  getTaskNote = (incidentId: string, taskId: string) =>
    this.request<TaskNote>(`/incidents/${incidentId}/tasks/${taskId}/notes`);

  updateTaskNote = (incidentId: string, taskId: string, content: string) =>
    this.request<TaskNote>(`/incidents/${incidentId}/tasks/${taskId}/notes`, "PUT", { content });

  uploadTaskNoteImage = async (incidentId: string, taskId: string, file: File) => {
    const res = await fetch(`${BASE}/incidents/${incidentId}/tasks/${taskId}/notes/images`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...this.headers(),
        "Content-Type": file.type,
        "x-filename": file.name || "image",
      },
      body: file,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const msg = payload?.error ?? `POST /incidents/${incidentId}/tasks/${taskId}/notes/images failed`;
      throw new Error(msg);
    }
    return res.json() as Promise<UploadedTaskNoteImage>;
  };

  uploadReportImage = async (incidentId: string, file: File) => {
    const res = await fetch(`${BASE}/incidents/${incidentId}/report-images`, {
      method: "POST",
      credentials: "include",
      headers: {
        ...this.headers(),
        "Content-Type": file.type,
        "x-filename": file.name || "image",
      },
      body: file,
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      const msg = payload?.error ?? `POST /incidents/${incidentId}/report-images failed`;
      throw new Error(msg);
    }
    return res.json() as Promise<UploadedReportImage>;
  };

  listQueries = async (incidentId: string) => {
    const payload = await this.request<{ queries: RawQueryItem[] }>(`/incidents/${incidentId}/queries`);
    return { queries: payload.queries.map(normalizeQuery) };
  };

  createQuery = async (incidentId: string, data: CreateQueryInput) => {
    const payload = await this.request<{ query: RawQueryItem }>(`/incidents/${incidentId}/queries`, "POST", data);
    return { query: normalizeQuery(payload.query) };
  };

  updateQuery = async (incidentId: string, id: string, data: Partial<CreateQueryInput>) => {
    const payload = await this.request<{ query: RawQueryItem }>(`/incidents/${incidentId}/queries/${id}`, "PATCH", data);
    return { query: normalizeQuery(payload.query) };
  };

  deleteQuery = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/queries/${id}`, "DELETE");

  listIndicators = async (incidentId: string) => {
    const payload = await this.request<{ indicators: RawIndicatorItem[] }>(`/incidents/${incidentId}/indicators`);
    return { indicators: payload.indicators.map(normalizeIndicator) };
  };

  createIndicator = async (incidentId: string, data: CreateIndicatorInput) => {
    const payload = await this.request<{ indicator: RawIndicatorItem }>(`/incidents/${incidentId}/indicators`, "POST", data);
    return { indicator: normalizeIndicator(payload.indicator) };
  };

  updateIndicator = async (incidentId: string, id: string, data: Partial<CreateIndicatorInput>) => {
    const payload = await this.request<{ indicator: RawIndicatorItem }>(`/incidents/${incidentId}/indicators/${id}`, "PATCH", data);
    return { indicator: normalizeIndicator(payload.indicator) };
  };

  deleteIndicator = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/indicators/${id}`, "DELETE");

  listSystems = async (incidentId: string) => {
    const payload = await this.request<{ systems: RawSystemItem[] }>(`/incidents/${incidentId}/systems`);
    return { systems: payload.systems.map(normalizeSystem) };
  };

  createSystem = async (incidentId: string, data: CreateSystemInput) => {
    const payload = await this.request<{ system: RawSystemItem }>(`/incidents/${incidentId}/systems`, "POST", data);
    return { system: normalizeSystem(payload.system) };
  };

  updateSystem = async (incidentId: string, id: string, data: Partial<CreateSystemInput>) => {
    const payload = await this.request<{ system: RawSystemItem }>(`/incidents/${incidentId}/systems/${id}`, "PATCH", data);
    return { system: normalizeSystem(payload.system) };
  };

  deleteSystem = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/systems/${id}`, "DELETE");

  listAccounts = async (incidentId: string) => {
    const payload = await this.request<{ accounts: RawAccountItem[] }>(`/incidents/${incidentId}/accounts`);
    return { accounts: payload.accounts.map(normalizeAccount) };
  };

  createAccount = async (incidentId: string, data: CreateAccountInput) => {
    const payload = await this.request<{ account: RawAccountItem }>(`/incidents/${incidentId}/accounts`, "POST", data);
    return { account: normalizeAccount(payload.account) };
  };

  updateAccount = async (incidentId: string, id: string, data: Partial<CreateAccountInput>) => {
    const payload = await this.request<{ account: RawAccountItem }>(`/incidents/${incidentId}/accounts/${id}`, "PATCH", data);
    return { account: normalizeAccount(payload.account) };
  };

  deleteAccount = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/accounts/${id}`, "DELETE");

  listAttackTags = async () => {
    const payload = await this.request<{ attackTags: RawAttackTagItem[] }>("/attack-tags");
    return { attackTags: payload.attackTags.map(normalizeAttackTag) };
  };

  listCustomTags = async (caseId: string) => {
    const payload = await this.request<{ customTags: RawCustomTagItem[] }>(`/cases/${caseId}/custom-tags`);
    return { customTags: payload.customTags.map(normalizeCustomTag) };
  };

  listFindingTags = async (incidentId: string, findingId: string) => {
    const payload = await this.request<{ attackTags: RawAttackTagItem[]; customTags: RawTagItem[] }>(
      `/incidents/${incidentId}/findings/${findingId}/tags`
    );
    return {
      attackTags: payload.attackTags.map(normalizeAttackTag),
      customTags: payload.customTags.map(normalizeTag),
    };
  };

  attachAttackTagToFinding = (incidentId: string, findingId: string, attackTagId: string) =>
    this.request(`/incidents/${incidentId}/findings/${findingId}/attack-tags`, "POST", { attackTagId });

  attachCustomTagToFinding = (incidentId: string, findingId: string, customTagId: string) =>
    this.request(`/incidents/${incidentId}/findings/${findingId}/custom-tags`, "POST", { customTagId });

  listTimelineEventTags = async (incidentId: string, timelineEventId: string) => {
    const payload = await this.request<{ attackTags: RawAttackTagItem[]; customTags: RawTagItem[] }>(
      `/incidents/${incidentId}/timeline-events/${timelineEventId}/tags`
    );
    return {
      attackTags: payload.attackTags.map(normalizeAttackTag),
      customTags: payload.customTags.map(normalizeTag),
    };
  };

  attachAttackTagToTimelineEvent = (incidentId: string, timelineEventId: string, attackTagId: string) =>
    this.request(`/incidents/${incidentId}/timeline-events/${timelineEventId}/attack-tags`, "POST", { attackTagId });

  attachCustomTagToTimelineEvent = (incidentId: string, timelineEventId: string, customTagId: string) =>
    this.request(`/incidents/${incidentId}/timeline-events/${timelineEventId}/custom-tags`, "POST", { customTagId });

  createCustomTag = (caseId: string, data: { name: string; color?: string }) =>
    this.request(`/cases/${caseId}/custom-tags`, "POST", data);

  updateCustomTag = (caseId: string, id: string, data: { name?: string; color?: string }) =>
    this.request(`/cases/${caseId}/custom-tags/${id}`, "PATCH", data);

  deleteCustomTag = (caseId: string, id: string) =>
    this.request(`/cases/${caseId}/custom-tags/${id}`, "DELETE");

  listEntityLinks = async (incidentId: string) => {
    const payload = await this.request<RawEntityLinksResponse>(`/incidents/${incidentId}/entity-links`);
    const links = payload.entityLinks ?? payload.links ?? [];
    return { links: links.map(normalizeEntityLink) };
  };

  createEntityLink = async (incidentId: string, data: CreateEntityLinkInput) => {
    const payload = await this.request<{ entityLink: RawEntityLinkItem }>(`/incidents/${incidentId}/entity-links`, "POST", data);
    return { entityLink: normalizeEntityLink(payload.entityLink) };
  };

  deleteEntityLink = (incidentId: string, id: string) =>
    this.request(`/incidents/${incidentId}/entity-links/${id}`, "DELETE");

  getGraph = (incidentId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<import("@shared/graph-types").GraphResponse>(`/incidents/${incidentId}/graph${qs}`);
  };

  getMitreMatrix = (incidentId: string, params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<import("@shared/graph-types").MitreMatrixResponse>(`/incidents/${incidentId}/mitre-matrix${qs}`);
  };

  getDashboard = () =>
    this.request<import("@shared/graph-types").DashboardResponse>("/dashboard");

  getDashboardSummary = () =>
    this.request<{ summary: import("@shared/graph-types").DashboardSummary }>("/dashboard/summary");

  getDashboardCharts = () =>
    this.request<import("@shared/graph-types").DashboardCharts>("/dashboard/charts");

  getDashboardSla = () =>
    this.request<import("@shared/graph-types").DashboardSlaResponse>("/dashboard/sla");

  getDashboardActivity = () =>
    this.request<import("@shared/graph-types").DashboardActivityResponse>("/dashboard/activity");

  getDashboardWorkload = () =>
    this.request<import("@shared/graph-types").DashboardWorkloadResponse>("/dashboard/workload");

  getDashboardCases = () =>
    this.request<import("@shared/graph-types").DashboardCasesResponse>("/dashboard/cases");

  listNotifications = async () => {
    const payload = await this.request<{ notifications: RawNotificationItem[] }>("/notifications");
    return { notifications: payload.notifications.map(normalizeNotification) };
  };

  openNotificationStream = () =>
    new EventSource(`${BASE}/notifications/stream`);

  markNotificationRead = (id: string) =>
    this.request(`/notifications/${id}/read`, "POST");

  listAuditLogs = async (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    const payload = await this.request<{ logs: RawAuditLogItem[] }>(`/audit-logs${qs}`);
    return { logs: payload.logs.map(normalizeAuditLog) };
  };

  search = async (q: string, caseId?: string, incidentId?: string) => {
    const params = new URLSearchParams({ q });
    if (caseId) params.set("caseId", caseId);
    if (incidentId) params.set("incidentId", incidentId);
    const payload = await this.request<{ results: RawSearchResultItem[] }>(`/search/search?${params}`);
    return { results: payload.results.map(normalizeSearchResult) };
  };

  listReportTemplates = async (incidentId: string) => {
    const payload = await this.request<{ templates: RawReportTemplate[] }>(`/incidents/${incidentId}/report-templates`);
    return { templates: payload.templates.map(normalizeReportTemplate) };
  };

  createReportTemplate = async (incidentId: string, data: CreateReportTemplateInput) => {
    const payload = await this.request<{ template: RawReportTemplate }>(`/incidents/${incidentId}/report-templates`, "POST", data);
    return { template: normalizeReportTemplate(payload.template) };
  };

  updateReportTemplate = async (incidentId: string, templateId: string, data: Partial<CreateReportTemplateInput>) => {
    const payload = await this.request<{ template: RawReportTemplate }>(`/incidents/${incidentId}/report-templates/${templateId}`, "PATCH", data);
    return { template: normalizeReportTemplate(payload.template) };
  };

  duplicateReportTemplate = async (incidentId: string, templateId: string, name?: string) => {
    const payload = await this.request<{ template: RawReportTemplate }>(
      `/incidents/${incidentId}/report-templates/${templateId}/duplicate`,
      "POST",
      { name }
    );
    return { template: normalizeReportTemplate(payload.template) };
  };

  deleteReportTemplate = (incidentId: string, templateId: string) =>
    this.request(`/incidents/${incidentId}/report-templates/${templateId}`, "DELETE");

  generateReport = async (incidentId: string, data: GenerateReportInput) =>
    this.request<{ preview: CreateReportInput }>(`/incidents/${incidentId}/reports/generate`, "POST", data);

  listReports = async (incidentId: string) => {
    const payload = await this.request<{ reports: RawIncidentReport[] }>(`/incidents/${incidentId}/reports`);
    return { reports: payload.reports.map(normalizeReport) };
  };

  createReport = async (incidentId: string, data: CreateReportInput) => {
    const payload = await this.request<{ report: RawIncidentReport }>(`/incidents/${incidentId}/reports`, "POST", data);
    return { report: normalizeReport(payload.report) };
  };

  updateReport = async (incidentId: string, reportId: string, data: { title?: string; markdown?: string }) => {
    const payload = await this.request<{ report: RawIncidentReport }>(`/incidents/${incidentId}/reports/${reportId}`, "PATCH", data);
    return { report: normalizeReport(payload.report) };
  };

  deleteReport = (incidentId: string, reportId: string) =>
    this.request(`/incidents/${incidentId}/reports/${reportId}`, "DELETE");

  exportReportHtml = async (incidentId: string, reportId: string, data?: { pdfTemplateId?: string }) => {
    const res = await fetch(`${BASE}/incidents/${incidentId}/reports/${reportId}/export/html`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...this.headers() },
      credentials: "include",
      body: JSON.stringify(data ?? {}),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload?.error ?? "HTML export failed");
    }
    const blob = await res.blob();
    if (blob.size === 0) {
      throw new Error("HTML export returned an empty file.");
    }
    const disposition = res.headers.get("Content-Disposition") ?? "";
    const match = /filename="([^"]+)"/.exec(disposition);
    const fileName = match?.[1] ?? "incident-report.html";
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = fileName;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    return { fileName, size: blob.size };
  };

  listPdfTemplates = async (incidentId?: string | null) => {
    const qs = incidentId ? `?${new URLSearchParams({ incidentId }).toString()}` : "";
    const payload = await this.request<{ templates: RawPdfTemplate[] }>(`/pdf-templates${qs}`);
    return { templates: payload.templates.map(normalizePdfTemplate) };
  };

  createPdfTemplate = async (data: CreatePdfTemplateInput) => {
    const payload = await this.request<{ template: RawPdfTemplate }>("/pdf-templates", "POST", data);
    return { template: normalizePdfTemplate(payload.template) };
  };

  updatePdfTemplate = async (templateId: string, data: Partial<CreatePdfTemplateInput>) => {
    const payload = await this.request<{ template: RawPdfTemplate }>(`/pdf-templates/${templateId}`, "PATCH", data);
    return { template: normalizePdfTemplate(payload.template) };
  };

  duplicatePdfTemplate = async (templateId: string, name?: string) => {
    const payload = await this.request<{ template: RawPdfTemplate }>(`/pdf-templates/${templateId}/duplicate`, "POST", { name });
    return { template: normalizePdfTemplate(payload.template) };
  };

  deletePdfTemplate = (templateId: string) =>
    this.request(`/pdf-templates/${templateId}`, "DELETE");

  previewPdfTemplate = (data: { pdfTemplateId?: string; htmlTemplate?: string; css?: string; sampleMarkdown?: string }) =>
    this.request<{ html: string }>("/pdf-templates/preview", "POST", data);

  getLlmSettings = () =>
    this.request<LlmSettingsStatus>("/me/llm-settings");

  saveLlmSettings = (data: SaveLlmSettingsInput) =>
    this.request<LlmSettingsStatus>("/me/llm-settings", "PUT", data);

  deleteLlmSettings = () =>
    this.request("/me/llm-settings", "DELETE");

  testLlmSettings = () =>
    this.request<{ ok: boolean; model?: string; source?: "user" | "env"; error?: string }>("/me/llm-settings/test", "POST");

}

export const api = new ApiClient();
