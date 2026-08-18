import { AlertTriangle, Upload } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { documents } from "./lib/documents";

function VerifiedDots({ filled, total, percent }: { filled: number; total: number; percent: number }) {
  return (
    <span className="verify-badge">
      <span className="dots">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className={i < filled ? "dot dot-filled" : "dot dot-empty"} />
        ))}
      </span>
      <span className="mono">{percent}%</span>
    </span>
  );
}

function FlagCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className="muted">—</span>;
  }
  return (
    <span className="flag-count">
      <AlertTriangle className="icon" />
      {count}
    </span>
  );
}

export default function Home() {
  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar-left">
          <span className="wordmark">ATTEST</span>
        </div>
      </header>

      <main className="content">
        <div className="page-header">
          <h1 className="page-title">Documents</h1>
          <Button type="button" variant="secondary">
            <Upload /> Import
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Document
                </TableHead>
                <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Type
                </TableHead>
                <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Verified
                </TableHead>
                <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Flags
                </TableHead>
                <TableHead className="h-auto bg-muted py-2.5 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Expires
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.slug}>
                  <TableCell className="py-4 text-[13px]">
                    <Link href={`/documents/${doc.slug}`} className="row-link">
                      {doc.name}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 text-[13px]">{doc.type}</TableCell>
                  <TableCell className="py-4 text-[13px]">
                    <VerifiedDots
                      filled={doc.verifiedFilled}
                      total={doc.verifiedTotal}
                      percent={doc.verifiedPercent}
                    />
                  </TableCell>
                  <TableCell className="py-4 text-[13px]">
                    <FlagCount count={doc.flags} />
                  </TableCell>
                  <TableCell className="py-4 text-[13px] text-muted-foreground">{doc.expires}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
