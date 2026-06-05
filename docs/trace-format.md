# Trace Format

TraceForge stores traces as newline-delimited JSON. Each line is one complete
JSON object representing a single event in an artificial intelligence agent run.
Readers can process a trace incrementally by parsing one line at a time.

## Required Fields

- `id`: Unique event identifier within the run.
- `runId`: Identifier shared by all events in a run.
- `timestamp`: ISO 8601 timestamp for when the event was recorded.
- `type`: Event type, such as `user_prompt`, `shell_command`, `file_patch`,
  `retry`, or `run_completed`.

## Optional Fields

- `status`: Event status. Supported values are `started`, `success`, `error`,
  and `skipped`.
- `durationMs`: Event duration in milliseconds.
- `summary`: Short human-readable event summary.
- `input`: Structured input payload for the event.
- `output`: Structured output payload for the event.
- `metadata`: Additional structured metadata.

## Example

```json
{"id":"event_0001","runId":"run_1","timestamp":"2026-06-05T00:00:00.000Z","type":"run_started","status":"started","summary":"offline-normalize-email-demo"}
{"id":"event_0002","runId":"run_1","timestamp":"2026-06-05T00:00:01.000Z","type":"shell_command","status":"error","durationMs":42,"summary":"Run npm test before the fix"}
```
