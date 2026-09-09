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
}: {
  users: AdminUser[];
  meId: string;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

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
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, username or phone…"
            className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 outline-none transition-colors focus:border-crimson focus:ring-2 focus:ring-crimson/20"
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
                    ? "border-crimson bg-crimson text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:border-slate-400",
                )}
              >
                {f.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 text-xs",
                    active ? "bg-white/20" : "bg-slate-100 text-slate-500",
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
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium text-slate-900">No matching users</p>
          <p className="mt-1 text-sm text-slate-500">
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
