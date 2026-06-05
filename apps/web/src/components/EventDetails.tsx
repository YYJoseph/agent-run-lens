import type { TraceEvent } from "@traceforge/core";

export function EventDetails({ event }: { event: TraceEvent | null }) {
  return (
    <section className="detail-section">
      <div className="pane-heading">
        <h2>Event Details</h2>
        <span>{event?.id ?? "No selection"}</span>
      </div>
      {event ? <pre className="json-block">{JSON.stringify(event, null, 2)}</pre> : <p>Select an event to inspect its JSON.</p>}
    </section>
  );
}
