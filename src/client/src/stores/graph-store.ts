import { create } from "zustand";

interface GraphState {
  selectedNodeId: string | null;
  mode: string;
  entityTypes: string[];
  linkTypes: string[];
  includeDerived: boolean;
  includeManual: boolean;
  depth: string;
  q: string;
  setSelectedNode: (id: string | null) => void;
  setMode: (mode: string) => void;
  setEntityTypes: (types: string[]) => void;
  setLinkTypes: (types: string[]) => void;
  setIncludeDerived: (v: boolean) => void;
  setIncludeManual: (v: boolean) => void;
  setDepth: (d: string) => void;
  setQ: (q: string) => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  selectedNodeId: null,
  mode: "overview",
  entityTypes: [],
  linkTypes: [],
  includeDerived: true,
  includeManual: true,
  depth: "all",
  q: "",
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  setMode: (mode) => set({ mode }),
  setEntityTypes: (types) => set({ entityTypes: types }),
  setLinkTypes: (types) => set({ linkTypes: types }),
  setIncludeDerived: (v) => set({ includeDerived: v }),
  setIncludeManual: (v) => set({ includeManual: v }),
  setDepth: (d) => set({ depth: d }),
  setQ: (q) => set({ q }),
}));
