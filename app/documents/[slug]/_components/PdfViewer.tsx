"use client";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy } from "pdfjs-dist";

import { CitationHighlight } from "@/components/attest/CitationHighlight";
import type { BoundingBox } from "@/lib/types";

export type PdfHighlight = { pageNumber: number; box: BoundingBox };

// The bundler-recognized `new URL(..., import.meta.url)` pattern (pdfjs-dist's
// own recommended approach for bundled apps) emits the worker as a static
// asset instead of requiring a manual copy into public/.
const WORKER_SRC = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

/**
 * Client-side PDF rendering (code-standards.md: "Only the PDF viewer, field-
 * click highlighting, and review-queue interactions need 'use client'").
 * Renders the requested page to canvas via pdfjs-dist's browser build — a
 * different module surface than lib/pdf/'s Node ("legacy") build, which has
 * no canvas/worker APIs, so this talks to pdfjs-dist directly rather than
 * through that wrapper. `highlight`'s BoundingBox is in PDF points at scale
 * 1 (lib/types.ts) — converted to on-screen pixels here by multiplying by
 * the page's current render scale, then handed to CitationHighlight as a
 * plain pixel rect.
 */
export function PdfViewer({
  pdfUrl,
  pageNumber,
  highlight,
}: {
  pdfUrl: string;
  pageNumber: number;
  highlight: PdfHighlight | null;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [render, setRender] = useState<{ width: number; height: number; scale: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    import("pdfjs-dist").then(async (pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = WORKER_SRC;
      try {
        const loaded = await pdfjsLib.getDocument({ url: pdfUrl }).promise;
        if (cancelled) return;
        setDoc(loaded);
      } catch {
        if (!cancelled) setError("Couldn't load this document's PDF.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pdfUrl]);

  useEffect(() => {
    if (!doc || !canvasRef.current || !containerRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    const containerWidth = containerRef.current.clientWidth;

    (async () => {
      const clampedPage = Math.min(Math.max(pageNumber, 1), doc.numPages);
      const page = await doc.getPage(clampedPage);
      const unscaled = page.getViewport({ scale: 1 });
      const scale = containerWidth / unscaled.width;
      const viewport = page.getViewport({ scale });
      if (cancelled) return;

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvas, viewport }).promise;
      if (!cancelled) setRender({ width: viewport.width, height: viewport.height, scale });
    })().catch(() => {
      if (!cancelled) setError("Couldn't render this page.");
    });

    return () => {
      cancelled = true;
    };
  }, [doc, pageNumber]);

  if (error) {
    return (
      <div className="doc-viewer">
        <p className="doc-paragraph muted">{error}</p>
      </div>
    );
  }

  const activeHighlight = render && highlight?.pageNumber === pageNumber ? highlight.box : null;

  return (
    <div className="doc-viewer doc-viewer--pdf">
      <div className="doc-viewer-inner" ref={containerRef}>
        <canvas ref={canvasRef} />
        {activeHighlight && render && (
          <CitationHighlight
            rect={{
              x: activeHighlight.x * render.scale,
              y: activeHighlight.y * render.scale,
              width: activeHighlight.width * render.scale,
              height: activeHighlight.height * render.scale,
            }}
          />
        )}
      </div>
      {!render && !error && <p className="doc-paragraph muted">Loading page {pageNumber}…</p>}
    </div>
  );
}
