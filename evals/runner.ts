import { listDocuments } from "@/lib/db/queries/documents";
import { listLatestDerivedDates } from "@/lib/db/queries/derivedDates";
import { finishEvalRun, startEvalRun } from "@/lib/db/queries/evalRuns";
import { listLatestExtractions } from "@/lib/db/queries/extractions";
import { listGoldLabelsForDocument } from "@/lib/db/queries/goldLabels";
import { CRITICAL_DATE_TYPES } from "@/lib/dates/criticalDates";
import { FIELD_SPECS } from "@/lib/pipeline/fields";
import type { DateAccuracyScorecard, EvalRun, FieldAccuracyScorecard, FieldGroup } from "@/lib/types";

import { fieldsMatch } from "./comparator";

const EXTRACTION_FIELD_GROUPS = new Map(FIELD_SPECS.map((spec) => [spec.fieldKey, spec.fieldGroup]));
const DATE_TYPES: ReadonlySet<string> = new Set(CRITICAL_DATE_TYPES);

type FieldTally = { total: number; correct: number };

/**
 * Scores the pipeline's latest run for every document that has gold labels
 * against fixtures/gold/*, via lib/db — never a parallel data path
 * (architecture.md: evals/ "reads the same lib/db layer as the app; never
 * duplicates pipeline logic"). Reports field-level accuracy and a separate
 * derived-date accuracy tier, and records the run in eval_runs so two runs
 * with different promptVersions can be diffed later.
 *
 * A gold label's `fieldKey` must be one of the 18 extraction field keys
 * (lib/pipeline/fields.ts) or one of the 4 derived date types
 * (lib/dates/criticalDates.ts) — anything else fails loudly (code-standards.md)
 * rather than silently narrowing the denominator, since that would make a
 * labeling typo look like better accuracy instead of a bug.
 */
export async function runEval(promptVersion: string): Promise<EvalRun> {
  const runId = crypto.randomUUID();
  const evalRun = startEvalRun(runId, promptVersion);

  let totalFields = 0;
  let correctFields = 0;
  let totalDates = 0;
  let correctDates = 0;
  const byFieldGroup = new Map<FieldGroup, FieldTally>();

  for (const doc of listDocuments()) {
    const goldLabels = listGoldLabelsForDocument(doc.id);
    if (goldLabels.length === 0) continue;

    const extractedValues = new Map(listLatestExtractions(doc.id).map((f) => [f.fieldKey, f.value]));
    const derivedValues = new Map(
      listLatestDerivedDates(doc.id).map((d) => [d.dateType, d.value] as const),
    );

    for (const gold of goldLabels) {
      const fieldGroup = EXTRACTION_FIELD_GROUPS.get(gold.fieldKey);
      if (fieldGroup) {
        const predicted = extractedValues.get(gold.fieldKey);
        const correct = predicted !== undefined && fieldsMatch(gold.expectedValue, predicted);

        totalFields += 1;
        if (correct) correctFields += 1;

        const tally = byFieldGroup.get(fieldGroup) ?? { total: 0, correct: 0 };
        tally.total += 1;
        if (correct) tally.correct += 1;
        byFieldGroup.set(fieldGroup, tally);
        continue;
      }

      if (DATE_TYPES.has(gold.fieldKey)) {
        const predicted = derivedValues.get(gold.fieldKey);
        const correct = predicted != null && fieldsMatch(gold.expectedValue, predicted);
        totalDates += 1;
        if (correct) correctDates += 1;
        continue;
      }

      throw new Error(
        `gold label for document "${doc.slug}" has unrecognized fieldKey "${gold.fieldKey}" — ` +
          "not one of the 18 extraction fields or 4 derived date types",
      );
    }
  }

  const fieldAccuracy: FieldAccuracyScorecard = {
    totalFields,
    correctFields,
    accuracy: totalFields === 0 ? 0 : correctFields / totalFields,
    byFieldGroup: Object.fromEntries(byFieldGroup) as FieldAccuracyScorecard["byFieldGroup"],
  };
  const dateAccuracy: DateAccuracyScorecard = {
    totalDates,
    correctDates,
    accuracy: totalDates === 0 ? 0 : correctDates / totalDates,
  };

  return finishEvalRun(evalRun.id, { fieldAccuracy, dateAccuracy });
}

async function main() {
  const promptVersion = process.env.PROMPT_VERSION ?? "dev";
  const run = await runEval(promptVersion);
  console.log(JSON.stringify(run, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
