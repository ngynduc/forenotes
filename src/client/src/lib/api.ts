import { useScopeStore } from "@/stores/scope-store";

const BASE = "/api";

export interface CurrentUser {
  id: string;
  email: string;
  displayName: string;
  globalRole: string;
  status: string;
}

export interface UserItem {
  id: string;
  email: string;
  displayName: string;
  globalRole: string;
  status: string;
}

export interface CreateUserInput {
  email: string;
  displayName: string;
  globalRole: string;
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

interface RawCurrentUser {
  id: string;
  email: string;
  displayName?: string;
  display_name?: string;
  globalRole?: string;
  global_role?: string;
  status: string;
}

interface RawUserItem {
  id: string;
  email: string;
  display_name?: string;
  global_role?: string;
  status: string;
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

interface RawNotificationItem {
  id: string;
  title: string;
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

function normalizeCurrentUser(user: RawCurrentUser): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName ?? user.display_name ?? user.email,
    globalRole: user.globalRole ?? user.global_role ?? "analyst",
    status: user.status,
  };
}

function normalizeUser(user: RawUserItem): UserItem {
  return {
    id: user.id,
    email: user.email,
    displayName: user.display_name ?? user.email,
    globalRole: user.global_role ?? "analyst",
    status: user.status,
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

class ApiClient {
  private headers(): Record<string, string> {
    const h: Record<string, string> = {};
    const userId = useScopeStore.getState().activeUserId;
    if (userId) {
      h["x-user-id"] = userId;
    }
    return h;
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

  removeCaseMember = (caseId: string, userId: string) =>
    this.request(`/cases/${caseId}/members/${userId}`, "DELETE");

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

  listFindings = async (incidentId: string) => {
    const payload = await this.request<{ findings: RawFindingItem[] }>(`/incidents/${incidentId}/findings`);
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

  listTimelineEvents = async (incidentId: string) => {
    const payload = await this.request<{ timelineEvents: RawTimelineEventItem[] }>(`/incidents/${incidentId}/timeline-events`);
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

  createCustomTag = (caseId: string, data: { name: string; color?: string }) =>
    this.request(`/cases/${caseId}/custom-tags`, "POST", data);

  updateCustomTag = (caseId: string, id: string, data: { name?: string; color?: string }) =>
    this.request(`/cases/${caseId}/custom-tags/${id}`, "PATCH", data);

  deleteCustomTag = (caseId: string, id: string) =>
    this.request(`/cases/${caseId}/custom-tags/${id}`, "DELETE");

  listEntityLinks = async (incidentId: string) => {
    const payload = await this.request<{ links: RawEntityLinkItem[] }>(`/incidents/${incidentId}/entity-links`);
    return { links: payload.links.map(normalizeEntityLink) };
  };

  createEntityLink = (incidentId: string, data: CreateEntityLinkInput) =>
    this.request(`/incidents/${incidentId}/entity-links`, "POST", data);

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

  listNotifications = async () => {
    const payload = await this.request<{ notifications: RawNotificationItem[] }>("/notifications");
    return { notifications: payload.notifications.map(normalizeNotification) };
  };

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
}

export const api = new ApiClient();
