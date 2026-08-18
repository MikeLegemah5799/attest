"use client";

import { useState } from "react";
import Link from "next/link";
import { StatusPill } from "../../_components/StatusPill";
import type { QueueItem } from "../../_lib/review-data";

type Filter = "all" | "review" | "blocked";

export function QueueTable({ slug, items }: { slug: string; items: QueueItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const reviewCount = items.filter((item) => item.status === "review").length;
  const blockedCount = items.filter((item) => item.status === "blocked").length;
  const visible = items.filter((item) => filter === "all" || item.status === filter);

  return (
    <>
      <div className="filter-row">
        <span className="filter-label">Filter:</span>
        <button
          type="button"
          className={`filter-chip${filter === "all" ? " filter-chip--active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All flagged
        </button>
        <button
          type="button"
          className={`filter-chip${filter === "review" ? " filter-chip--active" : ""}`}
          onClick={() => setFilter("review")}
        >
          Needs review ({reviewCount})
        </button>
        <button
          type="button"
          className={`filter-chip${filter === "blocked" ? " filter-chip--active" : ""}`}
          onClick={() => setFilter("blocked")}
        >
          Blocked ({blockedCount})
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Group</th>
            <th>State</th>
            <th>Page</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {visible.map((item) => (
            <tr key={item.field}>
              <td>{item.field}</td>
              <td className="muted">{item.group}</td>
              <td>
                <StatusPill status={item.status} />
              </td>
              <td className="mono muted">{item.page}</td>
              <td className="queue-open">
                <Link href={`/documents/${slug}`} className="row-link">
                  Open →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
