import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ScopeState {
  activeUserId: string;
  selectedCaseId: string;
  selectedIncidentId: string;
  setActiveUser: (userId: string) => void;
  selectCase: (caseId: string) => void;
  selectIncident: (incidentId: string) => void;
  clearIncident: () => void;
}

export const useScopeStore = create<ScopeState>()(
  persist(
    (set) => ({
      activeUserId: "",
      selectedCaseId: "",
      selectedIncidentId: "",
      setActiveUser: (userId) => set({ activeUserId: userId }),
      selectCase: (caseId) => set({ selectedCaseId: caseId, selectedIncidentId: "" }),
      selectIncident: (incidentId) => set({ selectedIncidentId: incidentId }),
      clearIncident: () => set({ selectedIncidentId: "" }),
    }),
    {
      name: "forenotes-scope",
      partialize: (state) => ({
        activeUserId: state.activeUserId,
        selectedCaseId: state.selectedCaseId,
        selectedIncidentId: state.selectedIncidentId,
      }),
    }
  )
);
