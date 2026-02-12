import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SessionFilters {
  search: string;
  status: string;
  sortBy: string;
  dateFrom?: Date;
  dateTo?: Date;
}

interface SessionStore {
  // Filters
  filters: SessionFilters;
  setFilters: (filters: Partial<SessionFilters>) => void;
  clearFilters: () => void;

  // Active session
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;
}

const defaultFilters: SessionFilters = {
  search: "",
  status: "all",
  sortBy: "newest",
  dateFrom: undefined,
  dateTo: undefined,
};

export const useSessionStore = create<SessionStore>()(
  persist(
    (set) => ({
      // Filters
      filters: defaultFilters,
      setFilters: (newFilters) =>
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
        })),
      clearFilters: () =>
        set({
          filters: {
            ...defaultFilters,
            search: "", // Keep search separate so it's always cleared
          },
        }),

      // Active session
      activeSessionId: null,
      setActiveSession: (id) => set({ activeSessionId: id }),
    }),
    {
      name: "session-storage",
      partialize: (state) => ({
        // Only persist filters, not activeSessionId
        filters: state.filters,
      }),
    }
  )
);
