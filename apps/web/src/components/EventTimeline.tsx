import type { TraceEvent } from "@traceforge/core";

type EventTimelineProps = {
  events: TraceEvent[];
  selectedEventId: string | null;
  onSelect(eventId: string): void;
};

function eventStatus(event: TraceEvent): string {
  return event.status ?? "not recorded";
}

export function EventTimeline({ events, selectedEventId, onSelect }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <div className="pane-empty">
        <h2>Event Timeline</h2>
        <p>No trace events to display.</p>
      </div>
    );
  }

  return (
    <>
      <div className="pane-heading">
        <h2>Event Timeline</h2>
        <span>{events.length} events</span>
      </div>

      <ol className="event-list">
        {events.map((event, index) => (
          <li key={event.id}>
            <button
              type="button"
              className={event.id === selectedEventId ? "event-row event-row-selected" : "event-row"}
              onClick={() => onSelect(event.id)}
              aria-current={event.id === selectedEventId}
            >
              <span className="event-index">{index + 1}</span>
              <span className="event-main">
                <span className="event-type">{event.type}</span>
                <strong>{event.summary ?? event.id}</strong>
              </span>
              <span className={`status status-${event.status ?? "unknown"}`}>{eventStatus(event)}</span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}
