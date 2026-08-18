import { notFound } from "next/navigation";
import { documents } from "../../../lib/documents";
import { ReviewTopbar, ReviewTabbar } from "../../_components/ReviewHeader";
import { queueItems } from "../../_lib/review-data";
import { QueueTable } from "./QueueTable";

export default async function ReviewQueue(props: PageProps<"/documents/[slug]/queue">) {
  const { slug } = await props.params;
  const doc = documents.find((d) => d.slug === slug);
  if (!doc) notFound();

  return (
    <div className="shell">
      <ReviewTopbar doc={doc} />
      <ReviewTabbar slug={slug} active="queue" queueCount={queueItems.length} />

      <main className="content">
        <QueueTable slug={slug} items={queueItems} />
      </main>
    </div>
  );
}
