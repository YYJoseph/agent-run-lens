import type { TraceEvent } from "@agent-run-lens/core";

export function FailurePanel({ firstFailure }: { firstFailure: TraceEvent | null }) {
  return (
    <section className="detail-section">
      <div className="pane-heading">
        <h2>First Failure</h2>
        <span>{firstFailure?.status ?? "none"}</span>
      </div>
      {firstFailure ? (
        <pre className="json-block">{JSON.stringify(firstFailure, null, 2)}</pre>
      ) : (
        <p>No failures recorded.</p>
      )}
    </section>
  );
}
