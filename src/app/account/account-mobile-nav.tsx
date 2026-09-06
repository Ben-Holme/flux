"use client";

import { useState, useEffect } from "react";
import { SidebarNavLinks, type NavItem } from "@/components/sidebar-nav-links";
import { AccountSignOut } from "./account-sign-out";

export function AccountMobileNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: Event) =>
      setOpen((e as CustomEvent<{ open: boolean }>).detail.open);
    window.addEventListener("account-nav-open", handler);
    return () => window.removeEventListener("account-nav-open", handler);
  }, []);

  function close() {
    setOpen(false);
    window.dispatchEvent(new CustomEvent("account-nav-open", { detail: { open: false } }));
  }

  if (!open) return null;

  return (
    <div
      className="mx-4 mt-6 overflow-hidden rounded-2xl border border-white/10 bg-black/80 backdrop-blur-md min-[768px]:hidden"
      style={{ animation: "wiki-nav-in 0.18s ease-out both" }}
    >
      <div className="p-3">
        <SidebarNavLinks items={items} onNavigate={close} />
        <div className="px-4 pb-2">
          <AccountSignOut />
        </div>
      </div>
    </div>
  );
}
