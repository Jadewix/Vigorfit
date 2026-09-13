"use client";

import { useMemo, useState } from "react";
import { SearchIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { UserCard, type AdminUser } from "./user-card";
import type { Role } from "@/lib/types";

type Filter = "all" | Role;

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "admin", label: "Admins" },
  { key: "coach", label: "Coaches" },
  { key: "client", label: "Clients" },
];

export function UsersManager({
  users,
  meId,
  initialFilter = "all",
}: {
  users: AdminUser[];
  meId: string;
  /**
   * Which filter to open on, taken from `?role=` by the page. The roster stays
   * fully interactive after that — this only decides the starting view, so an
   * Overview stat card can land on exactly the accounts it counted.
   */
  initialFilter?: Filter;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);

  const counts = useMemo(
    () => ({
      all: users.length,
      admin: users.filter((u) => u.role === "admin").length,
      coach: users.filter((u) => u.role === "coach").length,
      client: users.filter((u) => u.role === "client").length,
    }),
    [users],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (filter !== "all" && u.role !== filter) return false;
      if (!q) return true;
      return [u.full_name, u.username, u.phone]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [users, query, filter]);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-4 space-y-3">
        <div className="relative">
          <SearchIcon
            width={18}
            height={18}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username or phone…"
            className="h-11 w-full rounded-lg border border-line-light bg-paper-panel pl-10 pr-3 text-sm text-ink outline-none transition-colors focus:border-forest focus:ring-2 focus:ring-forest/20"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "border-forest bg-forest text-paper"
                    : "border-line-light bg-paper-panel text-ink-muted hover:border-ink-muted",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    active ? "bg-paper/25" : "bg-paper text-ink-muted",
                  )}
                >
                  {counts[f.key]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-light bg-paper-panel px-6 py-12 text-center">
          <p className="font-medium text-ink">No matching users</p>
          <p className="mt-1 text-sm text-ink-muted">
            Try a different search or filter.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((u) => (
            <UserCard key={u.id} user={u} isSelf={u.id === meId} />
          ))}
        </ul>
      )}
    </div>
  );
}
