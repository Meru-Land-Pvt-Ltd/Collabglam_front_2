"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ActionBase = {
  key: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
};

export type InfluencerTopbarAction =
  | (ActionBase & { href: string })
  | (ActionBase & { onClick: () => void })
  | (ActionBase & { static: true });

type Ctx = {
  actions: InfluencerTopbarAction[];
  setActions: (actions: InfluencerTopbarAction[]) => void;
  clearActions: () => void;
};

const InfluencerTopbarCtx = createContext<Ctx | null>(null);

export function InfluencerTopbarProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [actions, setActionsState] = useState<InfluencerTopbarAction[]>([]);

  const setActions = useCallback(
    (nextActions: InfluencerTopbarAction[]) => setActionsState(nextActions),
    []
  );

  const clearActions = useCallback(() => setActionsState([]), []);

  const value = useMemo(
    () => ({
      actions,
      setActions,
      clearActions,
    }),
    [actions, setActions, clearActions]
  );

  return (
    <InfluencerTopbarCtx.Provider value={value}>
      {children}
    </InfluencerTopbarCtx.Provider>
  );
}

export function useInfluencerTopbar() {
  const ctx = useContext(InfluencerTopbarCtx);

  if (!ctx) {
    throw new Error(
      "useInfluencerTopbar must be used inside InfluencerTopbarProvider"
    );
  }

  return ctx;
}