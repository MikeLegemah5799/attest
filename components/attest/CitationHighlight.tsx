/**
 * The PDF-viewer overlay that highlights a field's source span
 * (ui-context.md's Component Library) — purely presentational, positioned
 * by the caller. `rect` is already in on-screen pixels within the viewer's
 * positioned container; PdfViewer owns converting PDF-point BoundingBoxes
 * (lib/pdf's coordinate space) to that pixel rect at the current render
 * scale, so this component stays free of PDF-specific math.
 */
export function CitationHighlight({
  rect,
}: {
  rect: { x: number; y: number; width: number; height: number };
}) {
  return (
    <div
      className="pointer-events-none absolute rounded-[3px] border bg-(--bg-warning) border-(--border-warning)"
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.width,
        height: rect.height,
        opacity: 0.55,
      }}
    />
  );
}
