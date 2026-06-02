"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface TabsCtx {
  active: string;
  setActive: (value: string) => void;
}

const TabsContext = createContext<TabsCtx | null>(null);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error("Tabs sub-component used outside <Tabs>");
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [active, setActive] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ active, setActive }}>
      <div className={cn(className)}>{children}</div>
    </TabsContext.Provider>
  );
}

Tabs.flowSpacing = "mt-6" as const;

interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div role="tablist" className={cn("flex gap-2 border-b border-border", className)}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsTrigger({ value, children, className }: TabsTriggerProps) {
  const { active, setActive } = useTabsContext();
  const isActive = active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => setActive(value)}
      className={cn(
        "-mb-px border-b-2 py-2 font-heading text-sm uppercase tracking-[0.1em] transition-colors duration-150",
        isActive
          ? "border-white text-white"
          : "border-transparent text-white/40 hover:text-white/70",
        className,
      )}
    >
      {children}
    </button>
  );
}

interface TabsPanelProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsPanel({ value, children, className }: TabsPanelProps) {
  const { active } = useTabsContext();
  if (active !== value) return null;
  return (
    <div role="tabpanel" className={cn("pt-5", className)}>
      {children}
    </div>
  );
}
