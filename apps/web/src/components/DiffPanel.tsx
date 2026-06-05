import type { TraceEvent } from "@traceforge/core";

function patchText(event: TraceEvent): string {
  const output = event.output;

  if (typeof output === "object" && output !== null && "patch" in output) {
    const patch = (output as { patch?: unknown }).patch;
    return typeof patch === "string" && patch.trim() !== "" ? patch : "No patch text recorded.";
  }

  return "No patch text recorded.";
}

export function DiffPanel({ patches }: { patches: TraceEvent[] }) {
  return (
    <section className="detail-section">
      <div className="pane-heading">
        <h2>File Patches</h2>
        <span>{patches.length}</span>
      </div>
      {patches.length === 0 ? (
        <p>No file patches recorded.</p>
      ) : (
        patches.map((event) => (
          <article className="patch-block" key={event.id}>
            <h3>{event.summary ?? event.id}</h3>
            <pre className="diff-block">{patchText(event)}</pre>
          </article>
        ))
      )}
    </section>
  );
}
