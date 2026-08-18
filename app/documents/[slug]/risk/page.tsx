import Link from "next/link";
import { notFound } from "next/navigation";
import { documents } from "../../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../../_components/ReviewHeader";
import { RiskPill } from "../../_components/RiskPill";
import { criticalDates, timelineYears, renewalNoticeCallout, riskFlags, queueItems } from "../../_lib/review-data";

export default async function CriticalDatesAndRisk(props: PageProps<"/documents/[slug]/risk">) {
  const { slug } = await props.params;
  const doc = documents.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <div className="shell">
      <ReviewTopbar doc={doc} />
      <ReviewTabbar slug={slug} active="risk" queueCount={queueItems.length} />

      <main className="content">
        <div className="panel-card">
          <div className="section-title">Critical Dates</div>
          <div className="timeline">
            <div className="timeline-years">
              {timelineYears.map((year) => (
                <span key={year}>{year}</span>
              ))}
            </div>
            <div className="timeline-track">
              {criticalDates.map((date) => {
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
              <div className="timeline-callout" style={{ left: `${renewalNoticeCallout.position}%` }}>
                <div className="timeline-callout-title">
                  <span>✕</span> {renewalNoticeCallout.title}
                </div>
                <div className="timeline-callout-body">{renewalNoticeCallout.body}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-card">
          <div className="section-title-row">
            <div className="section-title">Risk Flags</div>
            <div className="section-note">
              Owner / asset-manager view
              <br />— see README
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Flag</th>
                <th>Detail</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {riskFlags.map((flag) => (
                <tr key={flag.label}>
                  <td>
                    <RiskPill label={flag.label} severity={flag.severity} />
                  </td>
                  <td>{flag.detail}</td>
                  <td className="queue-open">
                    {flag.source ? (
                      <Link href={`/documents/${slug}`} className="row-link link-source">
                        {flag.source} →
                      </Link>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
