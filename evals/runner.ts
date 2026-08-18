import type { EvalRun } from "@/lib/types";

/**
 * Scores the pipeline's latest run for every document that has gold labels
 * against fixtures/gold/*, via lib/db — never a parallel data path
 * (architecture.md: evals/ "reads the same lib/db layer as the app; never
 * duplicates pipeline logic"). Reports field-level accuracy and a separate
 * derived-date accuracy tier, and records the run in eval_runs so two runs
 * with different promptVersions can be diffed later.
 *
 * Do not start wiring this up before the extraction pipeline it scores is
 * stable against a fixture (ai-workflow-rules.md Scoping Rules) —
 * progress-tracker.md Next Up #9.
 */
export async function runEval(_promptVersion: string): Promise<EvalRun> {
  throw new Error("not implemented");
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
