export type Entry = { id: string; party: string; ref: string; cents: number; note: string };
export type Group = { id: string; ids: string[]; cents: number };
export type Review = { id: string; ids: string[]; status: 'open' | 'approved' | 'declined'; note: string };
export type Owner = 'automation' | 'waiting' | 'human' | 'ready';
export type State = {
  entries: Entry[]; selected: string[]; groups: Group[]; reviews: Review[];
  approvals: string[]; owner: Owner; fault: string; log: string[]; error: string; notice: string;
};
export type Action =
  | { type: 'select'; id: string; actor: Owner }
  | { type: 'clear'; actor: Owner }
  | { type: 'match'; actor: Owner }
  | { type: 'request'; actor: Owner }
  | { type: 'undo'; id: string; actor: Owner }
  | { type: 'take' }
  | { type: 'resume' }
  | { type: 'restore' }
  | { type: 'resolve'; approved: boolean; note: string }
  | { type: 'fault'; value: string }
  | { type: 'reset'; variant: boolean };
const rows: Entry[] = [
  { id: 'L-101', party: 'Atlas Studio', ref: 'INV-1042', cents: 125000, note: 'Invoice settled by a single processor payment.' },
  { id: 'L-102', party: 'Harbor Supply', ref: 'PAY-881', cents: 48000, note: 'First installment. Combine with L-103.' },
  { id: 'L-103', party: 'Harbor Supply', ref: 'PAY-881', cents: 72000, note: 'Second installment. Both installments share one settlement.' },
  { id: 'L-104', party: 'Northstar Co.', ref: 'INV-1045', cents: 35000, note: 'Two identical processor amounts. Remittance confirmation is required.' },
  { id: 'L-105', party: 'Fieldwork Ltd.', ref: 'INV-1046', cents: 90000, note: 'Processor amount is short by $30.00. No balancing adjustment is authorized.' },
  { id: 'L-106', party: 'Olive Market', ref: 'INV-1047', cents: 62000, note: 'No processor payment received. This entry must remain unmatched.' },
  { id: 'P-201', party: 'Atlas Studio', ref: 'INV-1042', cents: 125000, note: 'Received in the morning settlement batch.' },
  { id: 'P-202', party: 'Harbor Supply', ref: 'PAY-881', cents: 120000, note: 'Combined settlement for two installments.' },
  { id: 'P-203', party: 'Northstar Co.', ref: 'UNCONFIRMED', cents: 35000, note: 'Remittance document is restricted to the review operator.' },
  { id: 'P-204', party: 'Northstar Co.', ref: 'UNCONFIRMED', cents: 35000, note: 'Equal amount does not establish the intended invoice.' },
  { id: 'P-205', party: 'Fieldwork Ltd.', ref: 'INV-1046', cents: 87000, note: 'Settlement received net of a $30.00 fee. Needs an external accounting decision.' },
  { id: 'P-206', party: 'Juniper Works', ref: 'INV-1048', cents: 21500, note: 'No internal entry exists in this batch.' },
];
export const money = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
export const keyOf = (ids: string[]) => [...ids].sort().join('|');
export const initial = (variant = false): State => ({
  entries: rows.map(r => ({ ...r, cents: variant ? r.cents * 2 : r.cents, note: variant ? r.note.replaceAll('$30.00', '$60.00') : r.note })),
  selected: [], groups: [], reviews: [], approvals: [], owner: 'automation', fault: 'none',
  log: ['Batch opened. Synthetic records loaded.'], error: '', notice: '',
});
export const used = (s: State, id: string) => s.groups.some(g => g.ids.includes(id));
export const totals = (s: State) => {
  const picked = s.entries.filter(r => s.selected.includes(r.id));
  const sum = (prefix: string) => picked.filter(r => r.id.startsWith(prefix)).reduce((n, r) => n + r.cents, 0);
  return { ledger: sum('L-'), processor: sum('P-'), picked };
};
export function selectionError(s: State): string {
  const { ledger, processor, picked } = totals(s);
  if (!picked.some(r => r.id.startsWith('L-')) || !picked.some(r => r.id.startsWith('P-'))) return 'Select at least one entry from each ledger.';
  if (picked.length !== s.selected.length || new Set(s.selected).size !== picked.length) return 'Selection contains missing or duplicate entries.';
  if (picked.some(r => used(s, r.id))) return 'An entry is already reconciled. Refresh the selection.';
  if (ledger !== processor) return `Amounts do not balance. Difference: ${money(ledger - processor)}.`;
  return '';
}
export function needsReview(s: State) {
  const refs = new Set(totals(s).picked.map(r => r.ref));
  return (refs.size !== 1 || refs.has('UNCONFIRMED')) && !s.approvals.includes(keyOf(s.selected));
}
function update(s: State, changes: Partial<State>, event: string): State {
  return { ...s, error: '', notice: '', ...changes, log: [...s.log, event] };
}
export function reducer(s: State, a: Action): State {
  const fail = (message: string) => ({ ...s, error: message, notice: '' });
  if (a.type === 'reset') return initial(a.variant);
  if (a.type === 'fault') return update(s, { fault: a.value }, `Scenario activated: ${a.value}.`);
  if (a.type === 'restore') return update(s, { fault: 'none' }, 'Session restored; selections preserved.');
  if (a.type === 'take') {
    if (s.owner !== 'waiting') return fail('No intervention is waiting.');
    return update(s, { owner: 'human', notice: 'Operator has control. Correct the selection, then resolve the review.' }, 'Control transferred to operator.');
  }
  if (a.type === 'resolve') {
    if (s.owner !== 'human' || s.fault !== 'none') return fail('An active operator session is required.');
    if (a.note.trim().length < 8) return fail('Add a review reason of at least 8 characters.');
    if (a.approved && selectionError(s)) return fail(selectionError(s));
    const review = s.reviews.findLast(r => r.status === 'open');
    if (!review) return fail('No open review found.');
    return update(s, {
      owner: 'ready', selected: a.approved ? s.selected : [],
      approvals: a.approved ? [...s.approvals, keyOf(s.selected)] : s.approvals,
      reviews: s.reviews.map(r => r.id === review.id ? { ...r, ids: [...s.selected], status: a.approved ? 'approved' : 'declined', note: a.note.trim() } : r),
      notice: a.approved ? 'Selection approved. Resume to revalidate before reconciliation.' : 'Review declined. No records were reconciled.',
    }, `Review ${review.id} ${a.approved ? 'approved' : 'declined'}; operator reason recorded separately.`);
  }
  if (a.type === 'resume') {
    if (s.owner !== 'ready' || s.fault !== 'none') return fail('Resolve the review and restore the session before resuming.');
    if (s.selected.length && (selectionError(s) || needsReview(s))) return fail('Resume checkpoint failed: selection changed or is not approved.');
    return update(s, { owner: 'automation', notice: 'Checkpoint verified. Automation may continue.' }, 'Resume checkpoint verified; control returned to automation.');
  }
  if (s.fault !== 'none') return fail('Application unavailable. Resolve the interruption first.');
  if (a.actor !== s.owner || !['automation', 'human'].includes(s.owner)) return fail('Action rejected: session control is paused or owned by another actor.');
  if (a.type === 'select') {
    if (!s.entries.some(r => r.id === a.id) || used(s, a.id)) return fail('Entry unavailable for selection.');
    return update(s, { selected: s.selected.includes(a.id) ? s.selected.filter(id => id !== a.id) : [...s.selected, a.id] }, `${a.actor}: toggled ${a.id}.`);
  }
  if (a.type === 'clear') return update(s, { selected: [] }, `${a.actor}: selection cleared.`);
  if (a.type === 'request') {
    if (s.owner !== 'automation' || !s.selected.length) return fail('Select entries before requesting review.');
    const id = `R-${s.reviews.length + 1}`;
    return update(s, { owner: 'waiting', reviews: [...s.reviews, { id, ids: [...s.selected], status: 'open', note: '' }] }, `${id}: review requested for ${s.selected.join(', ')}; automation paused.`);
  }
  if (a.type === 'match') {
    if (s.owner !== 'automation') return fail('Return control before reconciling.');
    const error = selectionError(s);
    if (error) return fail(error);
    if (needsReview(s)) return fail('References are ambiguous. Request operator review before reconciling.');
    const id = `M-${s.log.length}`;
    return update(s, { groups: [...s.groups, { id, ids: [...s.selected], cents: totals(s).ledger }], selected: [], notice: `${id} reconciled. Both ledger totals verified.` }, `${id}: reconciled ${s.selected.join(', ')}.`);
  }
  const group = s.groups.find(g => g.id === a.id);
  if (!group) return fail('Reconciliation group not found.');
  return update(s, { groups: s.groups.filter(g => g.id !== a.id), approvals: s.approvals.filter(k => k !== keyOf(group.ids)), notice: 'Reconciliation undone. Original entries restored.' }, `${a.actor}: undid ${a.id}.`);
}
