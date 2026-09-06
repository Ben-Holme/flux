"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import { PlayerTypeModal } from "@/components/player-type-modal";
import {
  Alert,
  Badge,
  Checkbox,
  Flow,
  FormLabel,
  Heading,
  Input,
  Table,
  TableBody,
  TableRow,
  Td,
  Text,
} from "@/components/ui";
import type { AccountData } from "../account-types";

// ── Modals ────────────────────────────────────────────────────────────────────

function ChangePasswordModal({
  sessionkey,
  onClose,
}: {
  sessionkey: string;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) { setError("New passwords do not match."); return; }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/changePassword-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionkey}` },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-6 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Heading level="h3">Change Password</Heading>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <FormLabel>Current Password</FormLabel>
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" required className="mt-1.5" autoFocus />
          </div>
          <div>
            <FormLabel>New Password</FormLabel>
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} autoComplete="new-password" required className="mt-1.5" />
          </div>
          <div>
            <FormLabel>Confirm New Password</FormLabel>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required className="mt-1.5" />
          </div>
          {error && <Alert>{error}</Alert>}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save Password"}</Button>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteAccountModal({
  sessionkey,
  onClose,
}: {
  sessionkey: string;
  onClose: () => void;
}) {
  const { logout } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/delete-account-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${sessionkey}` },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      logout();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-surface flex w-full max-w-md flex-col gap-5 rounded-lg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <Flow>
          <Heading level="h3">Delete Account</Heading>
          <Text>This permanently deletes your account and all associated data. This cannot be undone.</Text>
        </Flow>
        <form onSubmit={handleDelete} className="flex flex-col gap-4">
          <div>
            <FormLabel>Confirm your password</FormLabel>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1.5" autoFocus />
          </div>
          <Checkbox
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            label="I understand this is permanent and cannot be undone"
          />
          {error && <Alert>{error}</Alert>}
          <div className="flex gap-3">
            <Button type="submit" variant="ghost" disabled={loading || !confirmed || !password}>
              {loading ? "Deleting…" : "Delete my account"}
            </Button>
            <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Settings page ─────────────────────────────────────────────────────────────

function SettingsContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const steamParam = searchParams.get("steam");
  const steamReason = searchParams.get("reason");

  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [playstyleOpen, setPlaystyleOpen] = useState(false);
  const [playstylePending, setPlaystylePending] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/login?redirect=/account/settings");
      return;
    }
    fetch("https://api.unyhagame.com/ueserv/getMyAccount-w.php", {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setAccount(data);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session, ready, router]);

  const setPlaystyle = async (value: 1 | 2) => {
    if (!session || !account) return;
    setPlaystylePending(true);
    try {
      const res = await fetch("https://api.unyhagame.com/ueserv/set-playstyle-w.php", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
        body: JSON.stringify({ playstyle: value }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setAccount((prev) =>
        prev ? {
          ...prev,
          playstyle: value,
          achievements: data.achievements ?? prev.achievements,
          spirit_xp: data.spirit_xp ?? prev.spirit_xp,
        } : prev,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setPlaystylePending(false);
    }
  };

  if (!session) return null;

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      {steamParam === "linked" && (
        <Alert variant="success">Steam account linked successfully.</Alert>
      )}
      {steamParam === "error" && (
        <Alert>
          {steamReason === "steam_already_linked"
            ? "That Steam account is already linked to a different Unyha account."
            : steamReason === "steam_verification_failed"
              ? "Steam couldn't verify your identity. Please try again."
              : steamReason === "invalid_session" || steamReason === "missing_session"
                ? "Your session expired. Please sign in again and retry."
                : "Steam linking failed. Please try again."}
        </Alert>
      )}

      {loading && <Text>Loading…</Text>}
      {error && <Alert>Error: {error}</Alert>}

      {account && (
        <>
          <Table>
            <TableBody>
              <TableRow>
                <Td variant="heading">Email</Td>
                <Td className="text-right">{account.email}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Password</Td>
                <Td className="text-right">
                  <Button variant="secondary" size="sm" onClick={() => setPasswordOpen(true)}>
                    Change
                  </Button>
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">House</Td>
                <Td className="text-right">{account.house || "—"}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Steam</Td>
                <Td className="text-right">
                  {account.steam_id ? (
                    <Badge variant="success">Linked</Badge>
                  ) : (
                    <Button
                      href={`https://api.unyhagame.com/ueserv/steam-link-start.php?sk=${session.sessionkey}`}
                      external
                      variant="secondary"
                      size="sm"
                    >
                      Connect Steam
                    </Button>
                  )}
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Player style</Td>
                <Td className="text-right">
                  <div className="flex items-center justify-end gap-3">
                    {account.playstyle === 1 ? (
                      <Badge variant="success">Active</Badge>
                    ) : account.playstyle === 2 ? (
                      <Badge variant="warning">Idle</Badge>
                    ) : (
                      <Text as="span" variant="muted">Unset</Text>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => setPlaystyleOpen(true)}>
                      Edit
                    </Button>
                  </div>
                </Td>
              </TableRow>
            </TableBody>
          </Table>

          <div className="border-t border-white/[0.06] pt-6">
            <Button variant="ghost" size="sm" onClick={() => setDeleteOpen(true)}>
              Delete Account
            </Button>
          </div>
        </>
      )}

      {passwordOpen && session && (
        <ChangePasswordModal sessionkey={session.sessionkey} onClose={() => setPasswordOpen(false)} />
      )}
      {playstyleOpen && (
        <PlayerTypeModal
          value={account?.playstyle ?? null}
          pending={playstylePending}
          onSelect={(v) => { setPlaystyle(v); setPlaystyleOpen(false); }}
          onClose={() => setPlaystyleOpen(false)}
        />
      )}
      {deleteOpen && session && (
        <DeleteAccountModal sessionkey={session.sessionkey} onClose={() => setDeleteOpen(false)} />
      )}
    </Flow>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <SettingsContent />
    </Suspense>
  );
}
