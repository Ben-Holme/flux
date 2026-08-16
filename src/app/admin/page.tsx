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
  spirit_xp: number;
}

type Filter = "all" | "approved" | "unapproved" | "steam";

function AdminContent() {
  const { session, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [pending, setPending] = useState<Set<number>>(new Set());

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
    if (!session) { router.push("/login?redirect=/admin"); return; }
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
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, approved } : u)),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setPending((p) => { const next = new Set(p); next.delete(userId); return next; });
    }
  };

  if (!session) return null;

  const visible = users.filter((u) => {
    if (filter === "approved") return u.approved;
    if (filter === "unapproved") return !u.approved;
    if (filter === "steam") return !!u.steam_id;
    return true;
  });

  const counts = {
    all: users.length,
    approved: users.filter((u) => u.approved).length,
    unapproved: users.filter((u) => !u.approved).length,
    steam: users.filter((u) => !!u.steam_id).length,
  };

  const filterLabels: { key: Filter; label: string }[] = [
    { key: "all", label: `All (${counts.all})` },
    { key: "approved", label: `Called (${counts.approved})` },
    { key: "unapproved", label: `Waiting (${counts.unapproved})` },
    { key: "steam", label: `Steam Synced (${counts.steam})` },
  ];

  return (
    <Flow className="mx-auto min-h-[90vh] max-w-[900px] px-6 pt-[120px] pb-20">
      <Eyebrow>Admin</Eyebrow>
      <Heading level="h1">Players</Heading>

      {error && <Text className="text-ember">Error: {error}</Text>}

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
              <Heading level="h4" as="span">{u.username}</Heading>
              {u.is_admin && <Badge>Admin</Badge>}
              {u.approved && <Badge>Called</Badge>}
              {!u.verified && <Badge>Unverified</Badge>}
            </div>
            <Table>
              <TableBody>
                <TableRow>
                  <Td variant="heading">Email</Td>
                  <Td>{u.email}</Td>
                </TableRow>
                <TableRow>
                  <Td variant="heading">Steam</Td>
                  <Td>{u.steam_id ?? <Text as="span" variant="muted">Not linked</Text>}</Td>
                </TableRow>
                <TableRow>
                  <Td variant="heading">Spirit XP</Td>
                  <Td>{u.spirit_xp}</Td>
                </TableRow>
              </TableBody>
            </Table>
          </Flow>
          <div className="shrink-0">
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
