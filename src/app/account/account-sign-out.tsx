"use client";

import { useAuth } from "@/context/auth-context";

export function AccountSignOut() {
  const { logout } = useAuth();

  return (
    <button
      className="mt-6 text-left text-[0.8rem] tracking-[0.1em] text-white/35 uppercase transition-colors hover:text-white/60 cursor-pointer bg-transparent border-0 p-0"
      onClick={logout}
    >
      Sign Out
    </button>
  );
}
