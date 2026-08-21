import { notFound } from "next/navigation";
import { getDocumentDetail } from "../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../_components/ReviewHeader";
import { ReviewWorkspace } from "./_components/ReviewWorkspace";
import { toFieldSections, toTrackerCategories } from "../_lib/review-data";

export default async function DocumentReview(props: PageProps<"/documents/[slug]">) {
  const { slug } = await props.params;
  const detail = await getDocumentDetail(slug);
  if (!detail) notFound();

  const fieldSections = toFieldSections(detail.result.fieldSections);
  const trackerCategories = toTrackerCategories(detail.result.trackerCategories);

  return (
    <div className="shell">
      <ReviewTopbar doc={detail.summary} />
      <ReviewTabbar slug={slug} active="review" queueCount={detail.result.queueItems.length} />

      <main className="content">
        <ReviewWorkspace
          pdfUrl={`/api/documents/${slug}/pdf`}
          pageCount={detail.pageCount}
          fieldSections={fieldSections}
          trackerCategories={trackerCategories}
        />
      </main>
    </div>
  );
}
