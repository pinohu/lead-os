// ── Safe JSON-LD serialization ──────────────────────────────────────
// JSON.stringify does NOT escape `</script>`, `<!--`, or `<script` — any
// of those sequences appearing inside a stringified value (e.g. a
// user-supplied business description, review text, or author name) can
// prematurely close the surrounding <script> element or inject a new
// one, turning structured-data markup into a stored-XSS vector.
//
// The safest fix is to replace every `<` with its `\u003c` JSON escape
// in the emitted string. JSON parsers decode `\u003c` back to `<`, so
// semantic meaning is preserved; the HTML parser, however, never sees a
// literal `<` inside the script body and cannot be tricked into
// breaking out of the element.
//
// Wrap every `dangerouslySetInnerHTML={{ __html: JSON.stringify(x) }}`
// with `dangerouslySetInnerHTML={{ __html: safeJsonLd(x) }}`.

export function safeJsonLd(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, "\\u003c");
}
