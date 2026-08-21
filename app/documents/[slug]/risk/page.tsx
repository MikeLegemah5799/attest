import { ArrowRight, FileX } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfidenceBadge } from "@/components/attest/ConfidenceBadge";
import { getDocumentDetail } from "../../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../../_components/ReviewHeader";
import { toRiskFlagViews, toTimeline } from "../../_lib/review-data";

export default async function CriticalDatesAndRisk(props: PageProps<"/documents/[slug]/risk">) {
  const { slug } = await props.params;
  const detail = await getDocumentDetail(slug);
  if (!detail) notFound();

  const timeline = toTimeline(detail.result.criticalDates);
  const riskFlags = toRiskFlagViews(detail.result.riskFlags);

  return (
    <div className="shell">
      <ReviewTopbar doc={detail.summary} />
      <ReviewTabbar slug={slug} active="risk" queueCount={detail.result.queueItems.length} />

      <main className="content">
        <div className="panel-card">
          <div className="section-title">Critical Dates</div>
          {timeline.markers.length === 0 ? (
            <p className="muted">No critical dates computed yet for this document.</p>
          ) : (
            <div className="timeline">
              <div className="timeline-years">
                {timeline.years.map((year) => (
                  <span key={year}>{year}</span>
                ))}
              </div>
              <div className="timeline-track">
                {timeline.markers.map((date) => {
                  const align = date.position <= 5 ? "start" : date.position >= 95 ? "end" : "center";
                  return (
                    <div
                      key={date.label}
                      className={`timeline-marker timeline-marker--${align}`}
                      style={{ left: `${date.position}%` }}
                    >
                      <span className="timeline-dot" />
                      <div className="timeline-marker-label">
                        <strong>{date.date}</strong>
                        <span>{date.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {timeline.blocked.length > 0 && (
            <div className="blocked-dates">
              {timeline.blocked.map((date) => (
                <div className="blocked-date-callout" key={date.label}>
                  <div className="timeline-callout-title">
                    <FileX className="size-3.5" /> {date.label}
                  </div>
                  <div className="timeline-callout-body">Blocked — {date.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel-card">
          <div className="section-title-row">
            <div className="section-title">Risk Flags</div>
            <div className="section-note">
              Owner / asset-manager view
              <br />— see README
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Flag
                  </TableHead>
                  <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Detail
                  </TableHead>
                  <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                    Source
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {riskFlags.map((flag) => (
                  <TableRow key={flag.label}>
                    <TableCell className="py-4 text-[13px]">
                      <ConfidenceBadge status={flag.severity} label={flag.label} />
                    </TableCell>
                    <TableCell className="py-4 text-[13px]">{flag.detail}</TableCell>
                    <TableCell className="py-4 text-right text-[13px]">
                      {flag.source ? (
                        <Link
                          href={`/documents/${slug}`}
                          className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground"
                        >
                          {flag.source} <ArrowRight className="size-3.5" />
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
}
