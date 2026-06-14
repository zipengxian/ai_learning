import { create } from 'zustand';

interface LayoutState {
  sidebarCollapsed: boolean;
  aiPanelCollapsed: boolean;
  aiPanelWidth: number;
  toggleSidebar: () => void;
  toggleAIPanel: () => void;
  setAIPanelWidth: (width: number) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: false,
  aiPanelCollapsed: false,
  aiPanelWidth: 360,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleAIPanel: () => set((state) => ({ aiPanelCollapsed: !state.aiPanelCollapsed })),
  setAIPanelWidth: (width: number) => set({ aiPanelWidth: width }),
}));