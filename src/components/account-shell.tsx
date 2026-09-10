"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/context/auth-context";
import { SidebarNavLinks, type NavItem } from "@/components/sidebar-nav-links";
import { Text } from "@/components/ui";
import { AccountMobileNav } from "@/app/account/account-mobile-nav";
import { AccountSignOut } from "@/app/account/account-sign-out";

const ACCOUNT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/account", exact: true },
  { label: "Characters", href: "/account/characters" },
  { label: "Settings", href: "/account/settings" },
];

export function AccountShell({ children }: { children: ReactNode }) {
  const { isAdmin } = useAuth();
  const items: NavItem[] = isAdmin
    ? [...ACCOUNT_NAV, { label: "Admin", href: "/admin" }]
    : ACCOUNT_NAV;

  return (
    <div className="mx-auto box-content grid max-w-[1200px] grid-cols-[300px_minmax(0,1fr)] px-8 pt-[100px] max-[1200px]:grid-cols-[200px_minmax(0,1fr)] max-[769px]:block max-[769px]:p-0">
      <div className="max-[769px]:hidden">
        <div className="fixed w-[300px] max-[1200px]:w-[200px]">
          <div className="mb-6">
            <Text
              as="span"
              className="font-heading text-[2rem] font-normal tracking-[0.2em] text-white uppercase"
            >
              My Account
            </Text>
          </div>
          <SidebarNavLinks items={items} />
          <AccountSignOut />
        </div>
      </div>

      <div className="fixed inset-x-0 top-[64px] z-40 min-[769px]:hidden">
        <AccountMobileNav items={items} />
      </div>

      <div className="pb-[100px] max-[769px]:pt-[80px] max-[769px]:pb-20">{children}</div>
    </div>
  );
}
