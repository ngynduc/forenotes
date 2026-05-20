import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { DataTable } from "@/components/data-table/DataTable";
import { EntityModal } from "@/components/entity-modal/EntityModal";
import { Button } from "@/components/ui/Button";
import { useCaseMembers, useCases } from "@/hooks/use-cases";
import { useIncidents } from "@/hooks/use-incidents";
import { useScopeStore } from "@/stores/scope-store";
import { TABLE_DEFINITIONS } from "@/config/table-definitions";
import { getEntityDefinitions } from "@/config/entity-definitions";

const tableDef = TABLE_DEFINITIONS.cases;
const incidentTableDef = TABLE_DEFINITIONS.incidents;
const CASE_TABS = [
  { key: "incidents", label: "Incidents" },
  { key: "details", label: "Case Details" },
  { key: "members", label: "Members" },
] as const;

type CaseTabKey = (typeof CASE_TABS)[number]["key"];

export default function CasesPage() {
  const { selectedCaseId, selectedIncidentId, selectCase, selectIncident } = useScopeStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading } = useCases();
  const incidentsQuery = useIncidents();
  const membersQuery = useCaseMembers(selectedCaseId || undefined);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [incidentModalOpen, setIncidentModalOpen] = useState(false);
  const [editCaseItem, setEditCaseItem] = useState<Record<string, unknown> | null>(null);
  const [editIncidentItem, setEditIncidentItem] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState<CaseTabKey>("incidents");
  const definitions = getEntityDefinitions(() => useScopeStore.getState());
  const cases = (data?.cases ?? []) as unknown as Record<string, unknown>[];
  const incidents = (incidentsQuery.data?.incidents ?? []) as unknown as Record<string, unknown>[];
  const members = (membersQuery.data?.members ?? []) as unknown as Record<string, unknown>[];
  const selectedCase = cases.find((entry) => String(entry.id ?? "") === selectedCaseId) ?? null;
  const caseTargetId = searchParams.get("caseId");
  const incidentTargetId = searchParams.get("incidentId");
  const openedCaseIdRef = useRef<string | null>(null);
  const openedIncidentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!caseTargetId) {
      openedCaseIdRef.current = null;
      return;
    }
    if (isLoading || openedCaseIdRef.current === caseTargetId) {
      return;
    }

    const targetCase = cases.find((entry) => String(entry.id ?? "") === caseTargetId);
    if (!targetCase) {
      return;
    }

    openedCaseIdRef.current = caseTargetId;
    selectCase(caseTargetId);
    setEditCaseItem(targetCase);
    setCaseModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("caseId");
    setSearchParams(nextParams, { replace: true });
  }, [caseTargetId, cases, isLoading, searchParams, selectCase, setSearchParams]);

  useEffect(() => {
    if (!incidentTargetId) {
      openedIncidentIdRef.current = null;
      return;
    }
    if (incidentsQuery.isLoading || openedIncidentIdRef.current === incidentTargetId) {
      return;
    }

    const targetIncident = incidents.find((entry) => String(entry.id ?? "") === incidentTargetId);
    if (!targetIncident) {
      return;
    }

    openedIncidentIdRef.current = incidentTargetId;
    const targetCaseId = String(targetIncident.caseId ?? "");
    if (targetCaseId) {
      selectCase(targetCaseId);
    }
    selectIncident(incidentTargetId);
    setActiveTab("incidents");
    setEditIncidentItem(targetIncident);
    setIncidentModalOpen(true);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("incidentId");
    setSearchParams(nextParams, { replace: true });
  }, [incidentTargetId, incidents, incidentsQuery.isLoading, searchParams, selectCase, selectIncident, setSearchParams]);

  function openIncidentCreate(caseId: string) {
    selectCase(caseId);
    setActiveTab("incidents");
    setEditIncidentItem(null);
    setIncidentModalOpen(true);
  }

  function handleSelectCase(caseId: string) {
    selectCase(caseId);
    setActiveTab("incidents");
  }

  return (
    <div className="space-y-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{tableDef.title}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{tableDef.subtitle}</p>
        </div>
        {tableDef.createLabel && (
          <Button onClick={() => { setEditCaseItem(null); setCaseModalOpen(true); }}>
            {tableDef.createLabel}
          </Button>
        )}
      </div>
      {isLoading ? (
        <p className="text-sm text-[var(--color-text-muted)]">Loading...</p>
      ) : (
        <DataTable
          columns={tableDef.columns}
          data={cases}
          emptyLabel={tableDef.emptyLabel}
          onRowClick={(row) => handleSelectCase(String(row.id ?? ""))}
          selectedRowId={selectedCaseId || null}
          renderRowActions={(row) => {
            const caseId = String(row.id ?? "");
            const isSelected = caseId === selectedCaseId;
            return (
              <>
                <Button
                  size="sm"
                  variant={isSelected ? "secondary" : "default"}
                  onClick={() => handleSelectCase(caseId)}
                  disabled={isSelected}
                >
                  {isSelected ? "Selected" : "Open Case"}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditCaseItem(row);
                    setCaseModalOpen(true);
                  }}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => openIncidentCreate(caseId)}
                >
                  Create Incident
                </Button>
              </>
            );
          }}
        />
      )}

      {selectedCase ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="border-b border-[var(--color-border)] px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">Selected Case</p>
                <h3 className="text-xl font-semibold text-[var(--color-text)]">
                  {String(selectedCase.caseName ?? selectedCase.id)}
                </h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {String(selectedCase.summary ?? "Use this case workspace to review incidents, members, and case metadata.")}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
                <DetailChip label="Status" value={String(selectedCase.status ?? "unknown")} />
                <DetailChip label="Client" value={String(selectedCase.clientName ?? "internal")} />
                <DetailChip
                  label="Active Incidents"
                  value={String(selectedCase.activeIncidents ?? incidents.length)}
                />
                <DetailChip label="Role" value={String(selectedCase.userCaseRole ?? "member")} />
              </div>
            </div>
          </div>

          <div className="px-5 pt-4">
            <div className="flex gap-1 border-b border-[var(--color-border)]">
              {CASE_TABS.map((tab) => (
                <button
                  key={tab.key}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    tab.key === activeTab
                      ? "border-b-2 border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            {activeTab === "incidents" ? (
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-semibold">{incidentTableDef.title}</h4>
                    <p className="text-sm text-[var(--color-text-muted)]">{incidentTableDef.subtitle}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setEditIncidentItem(null);
                      setIncidentModalOpen(true);
                    }}
                  >
                    {incidentTableDef.createLabel}
                  </Button>
                </div>
                {incidentsQuery.isLoading ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Loading incidents...</p>
                ) : (
                  <DataTable
                    columns={incidentTableDef.columns}
                    data={incidents}
                    emptyLabel={incidentTableDef.emptyLabel}
                    onRowClick={(row) => {
                      selectIncident(String(row.id ?? ""));
                      navigate("/findings");
                    }}
                    selectedRowId={selectedIncidentId || null}
                    renderRowActions={(row) => {
                      const incidentId = String(row.id ?? "");
                      const isSelected = incidentId === selectedIncidentId;
                      return (
                        <>
                          <Button
                            size="sm"
                            variant={isSelected ? "secondary" : "default"}
                            onClick={() => {
                              selectIncident(incidentId);
                              navigate("/findings");
                            }}
                            disabled={isSelected}
                          >
                            {isSelected ? "Selected" : "Open Incident"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditIncidentItem(row);
                              setIncidentModalOpen(true);
                            }}
                          >
                            Edit
                          </Button>
                        </>
                      );
                    }}
                  />
                )}
              </div>
            ) : null}

            {activeTab === "details" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <DetailPanel label="Case Name" value={String(selectedCase.caseName ?? "")} />
                <DetailPanel label="Client" value={String(selectedCase.clientName ?? "Internal")} />
                <DetailPanel label="Status" value={String(selectedCase.status ?? "unknown")} />
                <DetailPanel label="Role" value={String(selectedCase.userCaseRole ?? "member")} />
                <DetailPanel label="Start Date" value={String(selectedCase.startDate ?? "Not set")} />
                <DetailPanel label="End Date" value={String(selectedCase.endDate ?? "Not set")} />
                <div className="md:col-span-2">
                  <DetailPanel
                    label="Summary"
                    value={String(selectedCase.summary ?? "No case summary has been added yet.")}
                    multiline
                  />
                </div>
              </div>
            ) : null}

            {activeTab === "members" ? (
              <div>
                <div className="mb-4">
                  <h4 className="text-lg font-semibold">Case Members</h4>
                  <p className="text-sm text-[var(--color-text-muted)]">Users currently assigned to this case.</p>
                </div>
                {membersQuery.isLoading ? (
                  <p className="text-sm text-[var(--color-text-muted)]">Loading members...</p>
                ) : members.length ? (
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {members.map((member) => (
                      <div
                        key={String(member.userId ?? member.id)}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4"
                      >
                        <div className="font-medium text-[var(--color-text)]">
                          {String(member.displayName ?? member.email ?? member.userId)}
                        </div>
                        <div className="mt-1 text-sm text-[var(--color-text-muted)]">{String(member.email ?? "No email")}</div>
                        <div className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
                          {String(member.caseRole ?? "member")}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--color-text-muted)]">No case members found.</p>
                )}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      <EntityModal
        open={caseModalOpen}
        onOpenChange={setCaseModalOpen}
        definition={definitions.case}
        item={editCaseItem}
        mode={editCaseItem ? "edit" : "create"}
        onSuccess={(savedCase) => {
          const caseId = String(savedCase?.id ?? "");
          if (!caseId || editCaseItem) {
            return;
          }
          selectCase(caseId);
          setIncidentModalOpen(true);
        }}
      />
      <EntityModal
        open={incidentModalOpen}
        onOpenChange={setIncidentModalOpen}
        definition={definitions.incident}
        item={editIncidentItem}
        mode={editIncidentItem ? "edit" : "create"}
        onSuccess={(incident) => {
          const incidentId = String(incident?.id ?? "");
          if (!incidentId) {
            return;
          }
          selectIncident(incidentId);
          setActiveTab("incidents");
          navigate("/findings");
        }}
      />
    </div>
  );
}

function DetailChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-3 py-1.5">
      <span className="mr-2 uppercase tracking-[0.14em] text-[10px]">{label}</span>
      <span className="font-medium text-[var(--color-text)]">{value}</span>
    </div>
  );
}

function DetailPanel({
  label,
  value,
  multiline = false,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">{label}</div>
      <div className={`mt-2 text-sm text-[var(--color-text)] ${multiline ? "whitespace-pre-wrap" : ""}`}>{value}</div>
    </div>
  );
}
