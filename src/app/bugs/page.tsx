"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import Button from "@/components/button";
import { Alert, Badge, Card, Eyebrow, Flow, FormLabel, Heading, Input, Text } from "@/components/ui";

const API = "https://api.unyhagame.com/ueserv";

type Status = "open" | "in_progress" | "resolved" | "wont_fix";

interface Bug {
  id: number;
  title: string;
  description: string;
  status: Status;
  hidden: boolean;
  created_at: string;
  reporter: string;
  reporter_id: number;
  vote_count: number;
  i_voted: boolean;
}

const STATUS_LABEL: Record<Status, string> = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved",
  wont_fix: "Won't Fix",
};

const STATUS_CLASS: Record<Status, string> = {
  open: "border-red-500/30 bg-red-500/10 text-red-300",
  in_progress: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  resolved: "border-teal-500/30 bg-teal-500/10 text-teal-300",
  wont_fix: "border-white/10 bg-white/5 text-white/40",
};

function BugsContent() {
  const { session, isAdmin, ready } = useAuth();
  const router = useRouter();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const fetchBugs = useCallback(() => {
    if (!session) return;
    fetch(`${API}/bugs-list-w.php`, {
      headers: { Authorization: `Bearer ${session.sessionkey}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.status !== "OK") throw new Error(data.status);
        setBugs(data.bugs);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [session]);

  useEffect(() => {
    if (!ready) return;
    if (!session) { router.push("/login?redirect=/bugs"); return; }
    fetchBugs();
  }, [session, ready, router, fetchBugs]);

  const vote = async (bug: Bug) => {
    if (!session) return;
    // Optimistic update
    setBugs((prev) =>
      prev.map((b) =>
        b.id === bug.id
          ? { ...b, i_voted: !b.i_voted, vote_count: b.vote_count + (b.i_voted ? -1 : 1) }
          : b,
      ),
    );
    await fetch(`${API}/bug-vote-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id: bug.id }),
    });
  };

  const setStatus = async (bug_id: number, status: Status) => {
    if (!session) return;
    const res = await fetch(`${API}/admin-bug-status-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id, status }),
    });
    const data = await res.json();
    if (data.status === "OK") {
      setBugs((prev) => prev.map((b) => (b.id === bug_id ? { ...b, status } : b)));
    }
  };

  const toggleHidden = async (bug: Bug) => {
    if (!session) return;
    const res = await fetch(`${API}/admin-bug-hide-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id: bug.id, hidden: !bug.hidden }),
    });
    const data = await res.json();
    if (data.status === "OK") {
      setBugs((prev) => prev.map((b) => (b.id === bug.id ? { ...b, hidden: !bug.hidden } : b)));
    }
  };

  const submitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(`${API}/bug-submit-w.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
        body: JSON.stringify({ title, description }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      if (data.xp_awarded > 0) setXpAwarded(data.xp_awarded);
      setTitle("");
      setDescription("");
      setShowForm(false);
      fetchBugs();
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) return null;

  return (
    <Flow className="min-h-[90vh] px-6 pb-20">
      <Eyebrow>Community</Eyebrow>
      <Heading level="h1">Bug Reports</Heading>

      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Report a Bug"}
        </Button>
        {xpAwarded && (
          <Text as="span" variant="muted">
            +{xpAwarded} Spirit XP for your first report!
          </Text>
        )}
      </div>

      {showForm && (
        <Card>
          <form onSubmit={submitBug}>
            <Flow>
              <Heading level="h3">New Bug Report</Heading>
              <div>
                <FormLabel>Title</FormLabel>
                <Input
                  className="mt-1.5"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short summary of the bug"
                  required
                  maxLength={255}
                />
              </div>
              <div>
                <FormLabel>Description</FormLabel>
                <textarea
                  className="mt-1.5 block w-full rounded-[6px] border border-white/10 bg-black/40 px-3.5 py-2.5 text-base text-white/85 outline-none transition-colors placeholder:text-white/30 focus:border-white/25 focus:bg-white/[0.04] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Steps to reproduce, what you expected, what happened…"
                  required
                  rows={5}
                />
              </div>
              {submitError && <Alert>{submitError}</Alert>}
              <Button type="submit" disabled={submitting}>
                {submitting ? "Submitting…" : "Submit Bug"}
              </Button>
            </Flow>
          </form>
        </Card>
      )}

      {loading && <Text>Loading…</Text>}
      {error && <Alert>{error}</Alert>}

      {!loading && bugs.length === 0 && (
        <Text variant="muted">No bugs reported yet. You could be the first.</Text>
      )}

      {bugs.map((bug) => (
        <Card key={bug.id} className={bug.hidden ? "opacity-50" : ""}>
          <Flow>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Heading level="h4" as="span">{bug.title}</Heading>
                <Badge className={STATUS_CLASS[bug.status]}>{STATUS_LABEL[bug.status]}</Badge>
                {bug.hidden && (
                  <Badge className="border-white/10 bg-white/5 text-white/30">Hidden</Badge>
                )}
              </div>
              <button
                onClick={() => vote(bug)}
                className={`flex items-center gap-1.5 rounded border px-3 py-1 text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
                  bug.i_voted
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                }`}
              >
                ▲ {bug.vote_count}
              </button>
            </div>
            <Text variant="muted" className="text-sm whitespace-pre-wrap">{bug.description}</Text>
            <Text as="span" variant="muted" className="text-xs">
              Reported by {bug.reporter} · {new Date(bug.created_at).toLocaleDateString()}
            </Text>
            {isAdmin && (
              <div className="flex flex-wrap gap-2">
                {(["open", "in_progress", "resolved", "wont_fix"] as Status[]).map((s) => (
                  <Button
                    key={s}
                    variant={bug.status === s ? "primary" : "ghost"}
                    size="sm"
                    onClick={() => setStatus(bug.id, s)}
                    disabled={bug.status === s}
                  >
                    {STATUS_LABEL[s]}
                  </Button>
                ))}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleHidden(bug)}
                >
                  {bug.hidden ? "Unhide" : "Hide"}
                </Button>
              </div>
            )}
          </Flow>
        </Card>
      ))}
    </Flow>
  );
}

export default function BugsPage() {
  return (
    <Suspense>
      <BugsContent />
    </Suspense>
  );
}
