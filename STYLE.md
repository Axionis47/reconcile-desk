# Visual and interaction requirements

The app should feel like a focused settlement desk: a dark forest-green navigation rail, pale neutral work surface, two white ledger panels, and restrained green accents. Typography and aligned figures carry the interface; decorative imagery is intentionally omitted.

- Keep the three workflows visible in navigation. Separate Scenario lab from business actions.
- Present both ledgers side by side on wide screens and stack them on narrow screens. Keep table content horizontally scrollable when needed.
- Align money to the right and use tabular numerals. Store money in integer cents. Always show currency consistently.
- Show identity and reference alongside each amount. A matching number is insufficient evidence.
- Use plain text status labels as well as color: Matched, Unmatched, Needs review, Automation paused, Operator in control.
- Keep selected rows visibly tinted and expose selection through accessible checkbox state.
- Use labeled controls and semantic tables. Give icon-only actions a descriptive accessible name. Preserve visible keyboard focus and native component keyboard behavior.
- Open details in a dismissible side sheet. Use modal dialogs for blocking interruptions and confirmation before clearing a batch.
- Keep the current selection, both totals, and difference together before the reconciliation action.
- Display an explicit reason when matching fails. Announce action results through a live status region.
- Operator handoff must be visible. Paused or human-owned sessions cannot reconcile; approving a review must not silently commit a group.
- Trace is read-only. Navigation must not silently submit, clear, or reconcile a selection.
- Distinguish business failure from infrastructure failure: missing counterpart is an outcome; expired session is an interruption.
- Do not label simulated controls as real authentication. Do not imply financial execution or production security.

Implementation uses the starter's accessible sidebar, buttons, inputs, checkboxes, tables, sheet and alert-dialog components. Shared colors and responsive rules are in the app stylesheet. Verification so far covers compilation and domain tests, not a browser accessibility audit.

The processor terminal deliberately uses a cream background, compact system typography, nested layout tables, ordinary cell headings, and repeated Select/Open buttons inside a scrollable iframe. Keep identity, reference, amount and status visible together. Preserve keyboard focus and activation even though semantic table metadata and unique control labels are intentionally absent. The modern internal ledger and parent action bar remain unchanged.
