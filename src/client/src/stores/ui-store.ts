import { create } from "zustand";

interface Flash {
  kind: "success" | "error" | "info";
  message: string;
}

interface UIState {
  sidebarExpanded: boolean;
  taskView: "board" | "table";
  entityTab: string;
  graphView: "relationship" | "mitre";
  flash: Flash | null;
  toggleSidebar: () => void;
  setTaskView: (view: "board" | "table") => void;
  setEntityTab: (tab: string) => void;
  setGraphView: (view: "relationship" | "mitre") => void;
  setFlash: (flash: Flash | null) => void;
}

let flashTimer: ReturnType<typeof setTimeout> | null = null;

export const useUIStore = create<UIState>((set) => ({
  sidebarExpanded: true,
  taskView: "board",
  entityTab: "indicators",
  graphView: "relationship",
  flash: null,
  toggleSidebar: () => set((s) => ({ sidebarExpanded: !s.sidebarExpanded })),
  setTaskView: (view) => set({ taskView: view }),
  setEntityTab: (tab) => set({ entityTab: tab }),
  setGraphView: (view) => set({ graphView: view }),
  setFlash: (flash) => {
    if (flashTimer) clearTimeout(flashTimer);
    flashTimer = null;
    set({ flash });
    if (flash?.kind === "success") {
      flashTimer = setTimeout(() => {
        set({ flash: null });
        flashTimer = null;
      }, 4000);
    }
  },
}));
