"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import {
  Badge,
  Card,
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
  verified: boolean;
  approved: boolean;
  is_admin: boolean;
  spirit_xp: Record<string, number> | null;
  banned: boolean;
}

type Filter = "all" | "approved" | "unapproved" | "steam" | "banned";

function AdminContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [pending, setPending] = useState<Set<number>>(new Set());
  const [pipelineStatus, setPipelineStatus] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(false);
  const [pipelineConfirmOpen, setPipelineConfirmOpen] = useState(false);

  const fetchUsers = useCallback(() => {
    if (!session) return;
    fetch(`${API}/admin-users-w.php`, {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setUsers(data.users);
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

  const setApproved = async (userId: number, approved: boolean) => {
    if (!session) return;
    setPending((p) => new Set(p).add(userId));
    try {
      const res = await fetch(`${API}/admin-set-approved-w.php`, {
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
      const res = await fetch(`${API}/admin-ban-w.php`, {
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
      const res = await fetch(`${API}/admin-unsync-steam-w.php`, {
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
      const res = await fetch(`${API}/admin-run-pipeline-w.php`, {
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

  if (!session) return null;

  const q = search.trim().toLowerCase();
  const visible = users.filter((u) => {
    if (filter === "approved" && !u.approved) return false;
    if (filter === "unapproved" && u.approved) return false;
    if (filter === "steam" && !u.steam_id) return false;
    if (filter === "banned" && !u.banned) return false;
    if (q && !u.username.toLowerCase().includes(q)) return false;
    return true;
  });

  const counts = {
    all: users.length,
    approved: users.filter((u) => u.approved).length,
    unapproved: users.filter((u) => !u.approved).length,
    steam: users.filter((u) => !!u.steam_id).length,
    banned: users.filter((u) => u.banned).length,
  };

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "approved", label: `Called (${counts.approved})` },
    { key: "unapproved", label: `Waiting (${counts.unapproved})` },
    { key: "steam", label: `Steam Synced (${counts.steam})` },
    { key: "banned", label: `Banned (${counts.banned})` },
  ];

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      <Eyebrow>Admin</Eyebrow>
      <Heading level="h1">Players</Heading>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPipelineConfirmOpen(true)}
          disabled={pipelineLoading}
        >
          {pipelineLoading ? "Triggering…" : "Run Pipeline"}
        </Button>
        {pipelineStatus && (
          <Text as="span" variant="muted">
            {pipelineStatus}
          </Text>
        )}
      </div>

      {pipelineConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setPipelineConfirmOpen(false)}
        >
          <div
            className="bg-surface flex w-full max-w-md flex-col gap-6 rounded-lg p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Flow>
              <Heading level="h3">Run Build Pipeline?</Heading>
              <Text>
                This will kill the game server, rebuild the shipping client, upload to Steam,
                rebuild the dev server, and restart it. Players currently in-game will be
                disconnected.
              </Text>
            </Flow>
            <div className="flex gap-3">
              <Button
                variant="primary"
                onClick={() => {
                  setPipelineConfirmOpen(false);
                  runPipeline();
                }}
                disabled={pipelineLoading}
              >
                Yes, run it
              </Button>
              <Button variant="ghost" onClick={() => setPipelineConfirmOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <Text className="text-ember">Error: {error}</Text>}

      <input
        type="search"
        placeholder="Search username…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30"
      />

      <div className="flex flex-wrap gap-2">
        {filterLabels.map(({ key, label }) => (
          <Button
            key={key}
            variant={filter === key ? "primary" : "ghost"}
            size="sm"
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
      </div>

      {loading && <Text>Loading…</Text>}

      {!loading && visible.length === 0 && (
        <Text className="text-white/35">No users match this filter.</Text>
      )}

      {visible.map((u) => (
        <Card key={u.id} className="flex items-center justify-between gap-4">
          <Flow className="min-w-0 flex-1">
            <div className="flex items-baseline gap-3">
              <Heading level="h4" as="span">
                {u.username}
              </Heading>
              {u.is_admin && <Badge>Admin</Badge>}
              {u.approved && <Badge>Called</Badge>}
              {!u.verified && <Badge>Unverified</Badge>}
              {u.banned && <Badge>Banned</Badge>}
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <Td variant="heading">Email</Td>
                  <Td>{u.email}</Td>
                </TableRow>
                <TableRow>
                  <Td variant="heading">Steam</Td>
                  <Td>
                    {u.steam_id ? (
                      <span className="flex items-center gap-3">
                        {u.steam_id}
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
                  <Td variant="heading">Spirit XP</Td>
                  <Td>{u.spirit_xp ? Object.values(u.spirit_xp).reduce((a, b) => a + b, 0) : 0}</Td>
                </TableRow>
              </TableBody>
            </Table>
          </Flow>
          <div className="flex shrink-0 flex-col gap-2">
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
