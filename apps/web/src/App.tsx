import { useEffect, useMemo, useState } from "react";
import type { TraceEvent } from "@traceforge/core";
import { DiffPanel } from "./components/DiffPanel.js";
import { EventDetails } from "./components/EventDetails.js";
import { EventTimeline } from "./components/EventTimeline.js";
import { FailurePanel } from "./components/FailurePanel.js";
import { parseTraceText } from "./trace-model.js";

const sampleTrace = [
  {
    id: "event_1",
    runId: "run_sample",
    timestamp: "2026-06-05T00:00:00.000Z",
    type: "run_started",
    status: "started",
    summary: "Sample trace inspection started"
  },
  {
    id: "event_2",
    runId: "run_sample",
    timestamp: "2026-06-05T00:00:01.000Z",
    type: "user_prompt",
    summary: "Fix the failing normalizeEmail test",
    input: { prompt: "Please fix the failing normalizeEmail test." }
  },
  {
    id: "event_3",
    runId: "run_sample",
    timestamp: "2026-06-05T00:00:02.000Z",
    type: "shell_command",
    status: "error",
    durationMs: 430,
    summary: "Run npm test before the fix",
    input: { command: "npm test" },
    output: { exitCode: 1, stderr: "Expected normalized email to trim whitespace." }
  },
  {
    id: "event_4",
    runId: "run_sample",
    timestamp: "2026-06-05T00:00:03.000Z",
    type: "file_patch",
    status: "success",
    summary: "Trim whitespace before lowercasing",
    output: {
      patch: [
        "--- a/normalize-email.mjs",
        "+++ b/normalize-email.mjs",
        "@@",
        "-  return email.toLowerCase();",
        "+  return email.trim().toLowerCase();"
      ].join("\n")
    }
  },
  {
    id: "event_5",
    runId: "run_sample",
    timestamp: "2026-06-05T00:00:04.000Z",
    type: "run_completed",
    status: "success",
    summary: "Run completed with status success"
  }
].map((event) => JSON.stringify(event)).join("\n");

function formatStatus(value: string | null | undefined): string {
  return value ?? "not recorded";
}

export function App() {
  const [traceText, setTraceText] = useState(sampleTrace);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const parsed = useMemo(() => {
    try {
      return { model: parseTraceText(traceText), parseError: null };
    } catch (error) {
      return {
        model: null,
        parseError: error instanceof Error ? error.message : String(error)
      };
    }
  }, [traceText]);

  const events = parsed.model?.events ?? [];
  const selectedEvent = events.find((event) => event.id === selectedEventId) ?? events[0] ?? null;

  useEffect(() => {
    let ignore = false;

    fetch("/trace")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No trace was served at /trace. Showing the editable sample trace.");
        }

        return response.text();
      })
      .then((text) => {
        if (!ignore) {
          setTraceText(text);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setLoadError(error instanceof Error ? error.message : String(error));
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (events.length === 0) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !events.some((event) => event.id === selectedEventId)) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  return (
    <main className="viewer-shell">
      <aside className="trace-sidebar" aria-label="Trace source and summary">
        <div className="app-title">
          <h1>TraceForge</h1>
          <span>Local Trace Viewer</span>
        </div>

        <dl className="summary-grid" aria-label="Trace summary">
          <div>
            <dt>Run</dt>
            <dd>{parsed.model?.summary.runId ?? "No run"}</dd>
          </div>
          <div>
            <dt>Events</dt>
            <dd>{parsed.model?.summary.eventCount ?? 0}</dd>
          </div>
          <div>
            <dt>Failures</dt>
            <dd>{parsed.model?.summary.failureCount ?? 0}</dd>
          </div>
          <div>
            <dt>Final status</dt>
            <dd>{formatStatus(parsed.model?.summary.finalStatus)}</dd>
          </div>
        </dl>

        {loadError ? <p className="notice">{loadError}</p> : null}
        {parsed.parseError ? <p className="notice notice-error">{parsed.parseError}</p> : null}

        <label className="trace-editor-label" htmlFor="trace-editor">
          Trace text
        </label>
        <textarea
          id="trace-editor"
          spellCheck={false}
          value={traceText}
          onChange={(event) => setTraceText(event.target.value)}
        />
      </aside>

      <section className="timeline-pane" aria-label="Event timeline">
        <EventTimeline events={events} selectedEventId={selectedEvent?.id ?? null} onSelect={setSelectedEventId} />
      </section>

      <section className="details-pane" aria-label="Trace details">
        <EventDetails event={selectedEvent} />
        <FailurePanel firstFailure={parsed.model?.firstFailure ?? null} />
        <DiffPanel patches={parsed.model?.filePatches ?? []} />
      </section>
    </main>
  );
}
