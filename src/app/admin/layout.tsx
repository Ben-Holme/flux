import type { ReactNode } from "react";
import { AccountShell } from "@/components/account-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  // Native scrolling on admin: Lenis ignores wheel/touch events inside data-lenis-prevent.
  return (
    <div data-lenis-prevent>
      <AccountShell>{children}</AccountShell>
    </div>
  );
}
