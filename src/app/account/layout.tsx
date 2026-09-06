import { SidebarNavLinks, type NavItem } from "@/components/sidebar-nav-links";
import { AccountMobileNav } from "./account-mobile-nav";

export const ACCOUNT_NAV: NavItem[] = [
  { label: "Dashboard", href: "/account", exact: true },
  { label: "Characters", href: "/account/characters" },
  { label: "Settings", href: "/account/settings" },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto box-content grid max-w-[1200px] grid-cols-[300px_1fr] px-8 pt-[100px] max-[1200px]:grid-cols-[200px_1fr] max-[768px]:block max-[768px]:p-0">
      {/* Sidebar — desktop only */}
      <div className="max-[768px]:hidden">
        <div className="fixed w-[300px] max-[1200px]:w-[200px]">
          <div className="mb-6">
            <span className="font-heading text-[2rem] font-normal tracking-[0.2em] text-white uppercase">
              My Account
            </span>
          </div>
          <SidebarNavLinks items={ACCOUNT_NAV} />
        </div>
      </div>

      {/* Mobile dropdown — fixed below nav bar, same pattern as wiki */}
      <div className="fixed inset-x-0 top-[64px] z-40 min-[768px]:hidden">
        <AccountMobileNav items={ACCOUNT_NAV} />
      </div>

      {/* Content */}
      <div className="pb-[100px] max-[768px]:pt-[80px] max-[768px]:pb-20">
        {children}
      </div>
    </div>
  );
}
