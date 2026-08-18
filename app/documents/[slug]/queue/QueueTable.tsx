"use client";

import { ArrowRight } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfidenceBadge } from "@/components/attest/ConfidenceBadge";
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
        <Button
          type="button"
          variant={filter === "all" ? "default" : "secondary"}
          onClick={() => setFilter("all")}
        >
          All flagged
        </Button>
        <Button
          type="button"
          variant={filter === "review" ? "default" : "secondary"}
          onClick={() => setFilter("review")}
        >
          Needs review ({reviewCount})
        </Button>
        <Button
          type="button"
          variant={filter === "blocked" ? "default" : "secondary"}
          onClick={() => setFilter("blocked")}
        >
          Blocked ({blockedCount})
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Field
              </TableHead>
              <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Group
              </TableHead>
              <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                State
              </TableHead>
              <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                Page
              </TableHead>
              <TableHead className="h-auto bg-muted py-2.5"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.map((item) => (
              <TableRow key={item.field}>
                <TableCell className="py-4 text-[13px]">{item.field}</TableCell>
                <TableCell className="py-4 text-[13px] text-muted-foreground">{item.group}</TableCell>
                <TableCell className="py-4 text-[13px]">
                  <ConfidenceBadge status={item.status} />
                </TableCell>
                <TableCell className="py-4 font-mono text-[13px] text-muted-foreground">{item.page}</TableCell>
                <TableCell className="py-4 text-right text-[13px]">
                  <Link
                    href={`/documents/${slug}`}
                    className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                  >
                    Open <ArrowRight className="size-3.5" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
