"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { fetchAccount, useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import {
  Badge,
  Card,
  Dialog,
  Eyebrow,
  Flow,
  Heading,
  Table,
  TableBody,
  TableRow,
  Td,
  Text,
} from "@/components/ui";

const API = "https://api.unyhagame.com/ueserv";

interface User {
  id: number;
  username: string;
  email: string;
  steam_id: string | null;
  steam_key: string | null;
  verified: boolean;
  approved: boolean;
  is_admin: boolean;
  spirit_xp: number;
  achievements: Record<string, number>;
  banned: boolean;
}

type Filter = "all" | "banned";
type KeyFilter = "any" | "has-key" | "no-key";
type SteamFilter = "any" | "synced" | "not-synced";
type CalledFilter = "any" | "called" | "not-called";

type OnlinePlayer = { name: string; house: string | null };

function parseOnlinePlayers(raw: unknown): OnlinePlayer[] {
  if (Array.isArray(raw)) return raw as OnlinePlayer[];
  if (typeof raw === "string") {
    return (raw.match(/"([^"]+)"/g) ?? []).map((entry) => {
      const s = entry.replace(/"/g, "");
      const slash = s.indexOf("/");
      return slash === -1 ? { name: s, house: null } : { name: s.slice(0, slash), house: s.slice(slash + 1) };
    });
  }
  return [];
}

function toggleFilter(current: Set<Filter>, filter: Filter): Set<Filter> {
  if (filter === "all") return new Set();
  const next = new Set(current);
  if (next.has(filter)) next.delete(filter);
  else next.add(filter);
  return next;
}

function AdminContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<Filter>>(new Set());
  const [keyFilter, setKeyFilter] = useState<KeyFilter>("any");
  const [steamFilter, setSteamFilter] = useState<SteamFilter>("any");
  const [calledFilter, setCalledFilter] = useState<CalledFilter>("any");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [freeKeys, setFreeKeys] = useState<number | null>(null);
  const [keyMessages, setKeyMessages] = useState<Record<number, string>>({});
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineConfirmOpen, setPipelineConfirmOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState<string | null>(null);
  const [serverLoading, setServerLoading] = useState(false);
  const [serverConfirm, setServerConfirm] = useState<"start" | "kill" | null>(null);
  const [onlinePlayers, setOnlinePlayers] = useState<OnlinePlayer[]>([]);
  const [onlineDebug, setOnlineDebug] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    if (!session) return;
    fetchAccount(`${API}/admin-users-w.php`, {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setUsers(data.users);
        setFreeKeys(data.free_keys ?? null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/login?redirect=/admin");
      return;
    }
    fetchUsers();
  }, [session, ready, router, fetchUsers]);

  useEffect(() => {
    if (!session) return;
    const fetchOnline = () => {
      fetchAccount(`${API}/admin-online-players-w.php`, {
        headers: { Authorization: `Bearer ${session.sessionkey}` },
      })
        .then((r) => r.json())
        .then((data) => {
          setOnlineDebug(JSON.stringify(data));
          if (data.status === "OK") setOnlinePlayers(parseOnlinePlayers(data.players));
        })
        .catch((e) => setOnlineDebug(`ERR: ${e}`));
    };
    fetchOnline();
    const interval = setInterval(fetchOnline, 60_000);
    return () => clearInterval(interval);
  }, [session]);

  const setApproved = async (userId: number, approved: boolean) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    try {
      const res = await fetchAccount(`${API}/admin-set-approved-w.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ user_id: userId, approved }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, approved } : u)));
      if (data.email_warn) setError(data.email_warn);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(userId);
        return next;
      });
    }
  };

  const setBanned = async (userId: number, banned: boolean) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    try {
      const res = await fetchAccount(`${API}/admin-ban-w.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ user_id: userId, banned }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, banned } : u)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(userId);
        return next;
      });
    }
  };

  const unsyncSteam = async (userId: number) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    try {
      const res = await fetchAccount(`${API}/admin-unsync-steam-w.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, steam_id: null } : u)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending((p) => {
        const next = new Set(p);
        next.delete(userId);
        return next;
      });
    }
  };

  const runPipeline = async () => {
    if (!session) return;
    setPipelineLoading(true);
    setPipelineStatus(null);
    try {
      const res = await fetchAccount(`${API}/admin-run-pipeline-w.php`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.sessionkey}` },
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setPipelineStatus("Pipeline triggered");
    } catch (e: unknown) {
      setPipelineStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setPipelineLoading(false);
    }
  };

  const controlServer = async (action: "start" | "kill") => {
    if (!session) return;
    setServerLoading(true);
    setServerStatus(null);
    const endpoint = action === "start" ? "admin-start-server-w.php" : "admin-kill-server-w.php";
    try {
      const res = await fetchAccount(`${API}/${endpoint}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.sessionkey}` },
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setServerStatus(action === "start" ? "Server started" : "Server killed");
    } catch (e: unknown) {
      setServerStatus(e instanceof Error ? e.message : "Failed");
    } finally {
      setServerLoading(false);
    }
  };

  const assignKey = async (userId: number) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    setKeyMessages((m) => ({ ...m, [userId]: "" }));
    try {
      const res = await fetch(`${API}/admin-assign-key-w.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, steam_key: data.steam_key } : u)),
      );
      setFreeKeys((n) => (n !== null ? n - 1 : null));
      setKeyMessages((m) => ({
        ...m,
        [userId]: data.email_warn ?? "Key assigned and email sent.",
      }));
    } catch (e: unknown) {
      setKeyMessages((m) => ({ ...m, [userId]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(userId);
        return n;
      });
    }
  };

  const resendKeyEmail = async (userId: number) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    setKeyMessages((m) => ({ ...m, [userId]: "" }));
    try {
      const res = await fetch(`${API}/admin-resend-key-email-w.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.sessionkey}`,
        },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      setKeyMessages((m) => ({ ...m, [userId]: "Email resent." }));
    } catch (e: unknown) {
      setKeyMessages((m) => ({ ...m, [userId]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(userId);
        return n;
      });
    }
  };

  if (!session) return null;

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => {
    if (calledFilter === "called" && !u.approved) return false;
    if (calledFilter === "not-called" && u.approved) return false;
    if (steamFilter === "synced" && !u.steam_id) return false;
    if (steamFilter === "not-synced" && u.steam_id) return false;
    if (keyFilter === "has-key" && !u.steam_key) return false;
    if (keyFilter === "no-key" && u.steam_key) return false;
    if (filters.has("banned") && !u.banned) return false;
    if (q && !u.username.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = {
    all: users.length,
    banned: users.filter((u) => u.banned).length,
  };

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "banned", label: `Banned (${counts.banned})` },
  ];

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      <Eyebrow>Admin</Eyebrow>
      <Heading level="h1">Players</Heading>

      {freeKeys !== null && (
        <Text variant="muted">
          <Text
            as="span"
            className={freeKeys === 0 ? "text-ember font-semibold" : "text-gold font-semibold"}
          >
            {freeKeys}
          </Text>{" "}
          Steam {freeKeys === 1 ? "key" : "keys"} remaining
        </Text>
      )}

      <div>
        <Text variant="muted" className="mb-3">
          <Text as="span" className={onlinePlayers.length > 0 ? "text-gold font-semibold" : "font-semibold"}>
            {onlinePlayers.length}
          </Text>{" "}
          online
        </Text>
        {onlineDebug && (
          <Text variant="muted" className="break-all text-xs">{onlineDebug}</Text>
        )}
        {onlinePlayers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {onlinePlayers.map((p) => (
              <div
                key={p.name}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2"
              >
                <Text as="span" className="font-semibold leading-tight">{p.name}</Text>
                {p.house && (
                  <Text as="span" variant="muted" className="ml-2 text-xs">
                    House {p.house}
                  </Text>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setServerConfirm("start")}
          disabled={serverLoading}
        >
          Start Server
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setServerConfirm("kill")}
          disabled={serverLoading}
        >
          Kill Server
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setPipelineConfirmOpen(true)}
          disabled={pipelineLoading}
        >
          {pipelineLoading ? "Triggering…" : "Run Pipeline"}
        </Button>
        {(pipelineStatus || serverStatus) && (
          <Text as="span" variant="muted">
            {serverStatus ?? pipelineStatus}
          </Text>
        )}

        {serverConfirm && (
          <Dialog
            title={serverConfirm === "start" ? "Start Server?" : "Kill Server?"}
            onClose={() => setServerConfirm(null)}
            busy={serverLoading}
          >
            <Flow>
              <Text>
                {serverConfirm === "start"
                  ? "This will launch a new game server process."
                  : "This will forcefully kill the game server. All players will be disconnected immediately."}
              </Text>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setServerConfirm(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    const action = serverConfirm;
                    setServerConfirm(null);
                    controlServer(action);
                  }}
                  disabled={serverLoading}
                >
                  {serverConfirm === "start" ? "Yes, start it" : "Yes, kill it"}
                </Button>
              </div>
            </Flow>
          </Dialog>
        )}

        {pipelineConfirmOpen && (
          <Dialog
            title="Run Build Pipeline?"
            onClose={() => setPipelineConfirmOpen(false)}
            busy={pipelineLoading}
          >
            <Flow>
              <Text>
                This will kill the game server, rebuild the shipping client, upload to Steam,
                rebuild the dev server, and restart it. Players currently in-game will be
                disconnected.
              </Text>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setPipelineConfirmOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => {
                    setPipelineConfirmOpen(false);
                    runPipeline();
                  }}
                  disabled={pipelineLoading}
                >
                  Yes, run it
                </Button>
              </div>
            </Flow>
          </Dialog>
        )}
      </div>

      {error && <Text className="text-ember">Error: {error}</Text>}

      <input
        type="search"
        placeholder="Search username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-base text-white placeholder-white/30 outline-none focus:border-white/30"
      />

      <div className="flex flex-wrap items-center gap-2">
        {filterLabels.map(({ key, label }) => {
          const active = key === "all" ? filters.size === 0 : filters.has(key);
          return (
            <Button
              key={key}
              variant={active ? "primary" : "ghost"}
              size="sm"
              aria-pressed={active}
              onClick={() => setFilters((current) => toggleFilter(current, key))}
            >
              {label}
            </Button>
          );
        })}
        <select
          value={calledFilter}
          onChange={(e) => setCalledFilter(e.target.value as CalledFilter)}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
        >
          <option value="any">Called: Any</option>
          <option value="called">Called</option>
          <option value="not-called">Not called</option>
        </select>
        <select
          value={steamFilter}
          onChange={(e) => setSteamFilter(e.target.value as SteamFilter)}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
        >
          <option value="any">Steam: Any</option>
          <option value="synced">Synced</option>
          <option value="not-synced">Not synced</option>
        </select>
        <select
          value={keyFilter}
          onChange={(e) => setKeyFilter(e.target.value as KeyFilter)}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white outline-none focus:border-white/30"
        >
          <option value="any">Key: Any</option>
          <option value="has-key">Has key</option>
          <option value="no-key">No key</option>
        </select>
      </div>

      {loading && <Text>Loading…</Text>}

      {!loading && (
        <Text variant="muted">
          Showing {visible.length} {visible.length === 1 ? "account" : "accounts"}
        </Text>
      )}

      {!loading && visible.length === 0 && (
        <Text className="text-white/35">No users match this filter.</Text>
      )}

      {visible.map((u) => (
        <Card key={u.id} className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-wrap items-baseline gap-2">
              <Heading level="h4" as="span">
                {u.username}
              </Heading>
              {u.is_admin && <Badge variant="accent">Admin</Badge>}
              {u.approved && <Badge>Called</Badge>}
              {!u.verified && <Badge>Unverified</Badge>}
              {u.banned && <Badge>Banned</Badge>}
            </div>
            <div className="flex shrink-0 gap-2">
              {u.approved ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setApproved(u.id, false)}
                  disabled={pending.has(u.id)}
                >
                  Revoke
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setApproved(u.id, true)}
                  disabled={pending.has(u.id)}
                >
                  Call
                </Button>
              )}
              {u.banned ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBanned(u.id, false)}
                  disabled={pending.has(u.id)}
                >
                  Unban
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBanned(u.id, true)}
                  disabled={pending.has(u.id) || u.is_admin}
                >
                  Ban
                </Button>
              )}
            </div>
          </div>
          <Table>
            <TableBody>
              <TableRow>
                <Td variant="heading">Email</Td>
                <Td className="break-all">{u.email}</Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Steam</Td>
                <Td>
                  {u.steam_id ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm break-all">{u.steam_id}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => unsyncSteam(u.id)}
                        disabled={pending.has(u.id)}
                      >
                        Unsync
                      </Button>
                    </span>
                  ) : (
                    <Text as="span" variant="muted">
                      Not linked
                    </Text>
                  )}
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Steam Key</Td>
                <Td>
                  {u.steam_key ? (
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm break-all text-teal-300">
                        {u.steam_key}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resendKeyEmail(u.id)}
                        disabled={pending.has(u.id)}
                      >
                        Resend email
                      </Button>
                    </span>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => assignKey(u.id)}
                      disabled={pending.has(u.id) || freeKeys === 0}
                    >
                      {pending.has(u.id) ? "Assigning…" : "Assign Key"}
                    </Button>
                  )}
                  {keyMessages[u.id] && (
                    <Text as="span" variant="muted" className="ml-2 text-xs">
                      {keyMessages[u.id]}
                    </Text>
                  )}
                </Td>
              </TableRow>
              <TableRow>
                <Td variant="heading">Spirit XP</Td>
                <Td>
                  {u.spirit_xp}
                  {Object.keys(u.achievements).length > 0 && (
                    <Text as="span" variant="muted" className="ml-2 text-xs">
                      ({Object.keys(u.achievements).join(", ")})
                    </Text>
                  )}
                </Td>
              </TableRow>
            </TableBody>
          </Table>
        </Card>
      ))}
    </Flow>
  );
}

export default function AdminPage() {
  return (
    <Suspense>
      <AdminContent />
    </Suspense>
  );
}
