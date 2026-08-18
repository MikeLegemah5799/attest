import { notFound } from "next/navigation";
import { getDocumentDetail } from "../../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../../_components/ReviewHeader";
import { toQueueItems } from "../../_lib/review-data";
import { QueueTable } from "./QueueTable";

export default async function ReviewQueue(props: PageProps<"/documents/[slug]/queue">) {
  const { slug } = await props.params;
  const detail = await getDocumentDetail(slug);
  if (!detail) notFound();

  const items = toQueueItems(detail.result.queueItems);

  return (
    <div className="shell">
      <ReviewTopbar doc={detail.summary} />
      <ReviewTabbar slug={slug} active="queue" queueCount={items.length} />

      <main className="content">
        <QueueTable slug={slug} items={items} />
      </main>
    </div>
  );
}
