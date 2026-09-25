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
  tags: string[];
  created_at: string;
  reporter: string;
  reporter_id: number;
  vote_count: number;
  i_voted: boolean;
}

// Tag definitions — groups mirror the PHP allowlist in bug-tags-shared.php
const TAG_GROUPS: { label: string; tags: { value: string; label: string }[] }[] = [
  {
    label: "Website",
    tags: [
      { value: "website:account", label: "Account Management" },
      { value: "website:other",   label: "Other" },
    ],
  },
  {
    label: "Game",
    tags: [
      { value: "game:ui",           label: "UI" },
      { value: "game:level-design", label: "Level Design" },
      { value: "game:battle",       label: "Battle" },
      { value: "game:crafting",     label: "Crafting" },
      { value: "game:ai",           label: "Autochronicle AI" },
      { value: "game:items",        label: "Items" },
      { value: "game:other",        label: "Other" },
    ],
  },
];

const TAG_LABEL: Record<string, string> = Object.fromEntries(
  TAG_GROUPS.flatMap((g) => g.tags.map((t) => [t.value, `${g.label}: ${t.label}`])),
);

const STATUS_LABEL: Record<Status, string> = {
  open:        "Open",
  in_progress: "In Progress",
  resolved:    "Resolved",
  wont_fix:    "Won't Fix",
};

const STATUS_CLASS: Record<Status, string> = {
  open:        "border-red-500/30 bg-red-500/10 text-red-300",
  in_progress: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
  resolved:    "border-teal-500/30 bg-teal-500/10 text-teal-300",
  wont_fix:    "border-white/10 bg-white/5 text-white/40",
};

// Compact tag badge — inherits the dimmed-parchment palette used throughout
function TagBadge({ tag }: { tag: string }) {
  const label = TAG_LABEL[tag] ?? tag;
  return (
    <Badge className="border-white/10 bg-white/5 text-white/50 text-[11px] py-0.5 px-2">
      {label}
    </Badge>
  );
}

// Grouped checkbox picker used in both the submit form and admin tag editor
function TagPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const toggle = (value: string) => {
    onChange(
      selected.includes(value)
        ? selected.filter((t) => t !== value)
        : [...selected, value],
    );
  };
  return (
    <div className="flex flex-col gap-3">
      {TAG_GROUPS.map((group) => (
        <div key={group.label}>
          <Text as="span" variant="muted" className="text-xs uppercase tracking-widest mb-1.5 block">
            {group.label}
          </Text>
          <div className="flex flex-wrap gap-2">
            {group.tags.map((tag) => {
              const checked = selected.includes(tag.value);
              return (
                <label
                  key={tag.value}
                  className={`flex cursor-pointer items-center gap-1.5 rounded border px-2.5 py-1 text-xs transition-colors select-none ${
                    checked
                      ? "border-gold/40 bg-gold/10 text-gold"
                      : "border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white/70"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={checked}
                    onChange={() => toggle(tag.value)}
                  />
                  {tag.label}
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function BugsContent() {
  const { session, isAdmin, ready } = useAuth();
  const router = useRouter();
  const [bugs, setBugs]               = useState<Bug[]>([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState<string | null>(null);

  // Submit form
  const [showForm, setShowForm]       = useState(false);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [formTags, setFormTags]       = useState<string[]>([]);
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [xpAwarded, setXpAwarded]     = useState<number | null>(null);

  // Tag filter — all-match
  const [filterTags, setFilterTags]   = useState<string[]>([]);
  const [showFilter, setShowFilter]   = useState(false);

  // Admin tag editor state: bug id → draft tags
  const [editingTags, setEditingTags]     = useState<Record<number, string[] | undefined>>({});
  // Admin delete confirm: set of bug ids currently showing the confirm button
  const [confirmDelete, setConfirmDelete] = useState<Set<number>>(new Set());

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

  // All-match filter: a bug must carry every selected filter tag
  const visibleBugs =
    filterTags.length === 0
      ? bugs
      : bugs.filter((b) => filterTags.every((t) => b.tags.includes(t)));

  const vote = async (bug: Bug) => {
    if (!session) return;
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
    const res  = await fetch(`${API}/admin-bug-status-w.php`, {
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
    const res  = await fetch(`${API}/admin-bug-hide-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id: bug.id, hidden: !bug.hidden }),
    });
    const data = await res.json();
    if (data.status === "OK") {
      setBugs((prev) => prev.map((b) => (b.id === bug.id ? { ...b, hidden: !bug.hidden } : b)));
    }
  };

  const deleteBug = async (bug_id: number) => {
    if (!session) return;
    const res  = await fetch(`${API}/admin-bug-delete-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id }),
    });
    const data = await res.json();
    if (data.status === "OK") {
      setBugs((prev) => prev.filter((b) => b.id !== bug_id));
      setConfirmDelete((prev) => { const n = new Set(prev); n.delete(bug_id); return n; });
    }
  };

  const saveTags = async (bug_id: number) => {
    if (!session) return;
    const tags = editingTags[bug_id] ?? [];
    const res  = await fetch(`${API}/admin-bug-tags-w.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
      body: JSON.stringify({ bug_id, tags }),
    });
    const data = await res.json();
    if (data.status === "OK") {
      setBugs((prev) => prev.map((b) => (b.id === bug_id ? { ...b, tags } : b)));
      setEditingTags((prev) => { const n = { ...prev }; delete n[bug_id]; return n; });
    }
  };

  const submitBug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res  = await fetch(`${API}/bug-submit-w.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.sessionkey}` },
        body: JSON.stringify({ title, description, tags: formTags }),
      });
      const data = await res.json();
      if (data.status !== "OK") throw new Error(data.status);
      if (data.xp_awarded > 0) setXpAwarded(data.xp_awarded);
      setTitle("");
      setDescription("");
      setFormTags([]);
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

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "Report a Bug"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowFilter((v) => !v)}>
          {showFilter ? "Hide Filter" : "Filter by Tag"}
          {filterTags.length > 0 && (
            <Badge className="ml-1.5 border-gold/40 bg-gold/10 text-gold py-0 px-1.5 text-[10px]">
              {filterTags.length}
            </Badge>
          )}
        </Button>
        {filterTags.length > 0 && (
          <button
            onClick={() => setFilterTags([])}
            className="text-xs text-white/40 hover:text-white/60 underline underline-offset-2 cursor-pointer"
          >
            Clear
          </button>
        )}
        {xpAwarded !== null && (
          <Text as="span" variant="muted">
            +{xpAwarded} Spirit XP for your first report!
          </Text>
        )}
      </div>

      {/* Tag filter panel */}
      {showFilter && (
        <Card>
          <Flow>
            <Heading level="h4">Filter Tags</Heading>
            <Text variant="muted" className="text-sm">
              Showing bugs that match <em>all</em> selected tags.
            </Text>
            <TagPicker selected={filterTags} onChange={setFilterTags} />
          </Flow>
        </Card>
      )}

      {/* Submit form */}
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
              <div>
                <FormLabel>Tags <Text as="span" variant="muted" className="text-xs">(optional)</Text></FormLabel>
                <div className="mt-2">
                  <TagPicker selected={formTags} onChange={setFormTags} />
                </div>
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

      {!loading && filterTags.length > 0 && visibleBugs.length === 0 && (
        <Text variant="muted">No bugs match all of the selected tags.</Text>
      )}

      {visibleBugs.map((bug) => {
        const draftTags    = editingTags[bug.id];
        const isEditingTag = draftTags !== undefined;

        return (
          <Card key={bug.id} className={bug.hidden ? "opacity-50" : ""}>
            <Flow>
              {/* Header row */}
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

              {/* Tags row */}
              {bug.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {bug.tags.map((t) => <TagBadge key={t} tag={t} />)}
                </div>
              )}

              <Text variant="muted" className="text-sm whitespace-pre-wrap">{bug.description}</Text>
              <Text as="span" variant="muted" className="text-xs">
                Reported by {bug.reporter} · {new Date(bug.created_at).toLocaleDateString()}
              </Text>

              {/* Admin controls */}
              {isAdmin && (
                <>
                  {/* Status buttons */}
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
                    <Button variant="ghost" size="sm" onClick={() => toggleHidden(bug)}>
                      {bug.hidden ? "Unhide" : "Hide"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (isEditingTag) {
                          setEditingTags((prev) => { const n = { ...prev }; delete n[bug.id]; return n; });
                        } else {
                          setEditingTags((prev) => ({ ...prev, [bug.id]: [...bug.tags] }));
                        }
                      }}
                    >
                      {isEditingTag ? "Cancel Tags" : "Edit Tags"}
                    </Button>
                    {confirmDelete.has(bug.id) ? (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => deleteBug(bug.id)}
                          className="border-red-500/50 bg-red-500/20 text-red-300 hover:bg-red-500/30"
                        >
                          Confirm Delete
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setConfirmDelete((prev) => { const n = new Set(prev); n.delete(bug.id); return n; })}
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDelete((prev) => new Set(prev).add(bug.id))}
                        className="text-red-400/70 hover:text-red-300"
                      >
                        Delete
                      </Button>
                    )}
                  </div>

                  {/* Inline tag editor */}
                  {isEditingTag && (
                    <div className="rounded border border-white/10 bg-white/[0.03] p-4">
                      <TagPicker
                        selected={draftTags}
                        onChange={(next) => setEditingTags((prev) => ({ ...prev, [bug.id]: next }))}
                      />
                      <div className="mt-3 flex gap-2">
                        <Button size="sm" onClick={() => saveTags(bug.id)}>Save Tags</Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setEditingTags((prev) => { const n = { ...prev }; delete n[bug.id]; return n; })
                          }
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Flow>
          </Card>
        );
      })}
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
