import test from 'node:test';
import assert from 'node:assert/strict';
import { initial, reducer, totals, used } from '../app/model.ts';
const act = (s, type, extra = {}) => reducer(s, { type, actor: s.owner, ...extra });
const pick = (s, ...ids) => ids.reduce((state, id) => act(state, 'select', { id }), s);
const request = s => act(s, 'request');
const take = s => reducer(s, { type: 'take' });
const resolve = (s, approved = true) => reducer(s, { type: 'resolve', approved, note: 'Checked remittance evidence.' });
const resume = s => reducer(s, { type: 'resume' });
test('exact match consumes each entry once; undo restores originals', () => {
  const original = initial();
  const matched = act(pick(original, 'L-101', 'P-201'), 'match');
  assert.equal(matched.groups.length, 1);
  assert.equal(matched.groups[0].cents, 125000);
  assert.equal(used(matched, 'L-101'), true);
  assert.match(act(matched, 'select', { id: 'L-101' }).error, /unavailable/);
  const undone = act(matched, 'undo', { id: matched.groups[0].id });
  assert.equal(undone.groups.length, 0);
  assert.deepEqual(undone.entries, original.entries);
});
test('one settlement can reconcile two ledger installments', () => {
  const s = act(pick(initial(), 'L-102', 'L-103', 'P-202'), 'match');
  assert.equal(s.groups[0].cents, 120000);
  assert.equal(s.groups[0].ids.length, 3);
});
test('shortage cannot be reconciled or approved as an adjustment', () => {
  const s = pick(initial(), 'L-105', 'P-205');
  assert.match(act(s, 'match').error, /Amounts do not balance/);
  assert.equal(resolve(take(request(s))).owner, 'human');
  assert.equal(resolve(take(request(s))).groups.length, 0);
});
test('missing counterpart is not success', () => {
  const s = act(pick(initial(), 'L-106'), 'match');
  assert.equal(s.groups.length, 0);
  assert.match(s.error, /each ledger/);
});
test('equal amounts with unconfirmed references require intervention', () => {
  const s = act(pick(initial(), 'L-104', 'P-204'), 'match');
  assert.match(s.error, /ambiguous/);
  assert.equal(s.groups.length, 0);
});
test('handoff blocks automation, accepts correction, and validates resume', () => {
  let s = request(pick(initial(), 'L-104', 'P-204'));
  assert.equal(s.owner, 'waiting');
  assert.match(act(s, 'clear').error, /paused/);
  s = take(s);
  const rejected = reducer(s, { type: 'select', id: 'P-203', actor: 'automation' });
  assert.deepEqual(rejected.selected, s.selected);
  s = pick(s, 'P-204', 'P-203');
  assert.match(reducer(s, { type: 'resolve', approved: true, note: '' }).error, /reason/);
  assert.match(act(s, 'match').error, /Return control/);
  s = resolve(s);
  assert.equal(s.owner, 'ready');
  assert.equal(s.groups.length, 0);
  s = act(resume(s), 'match');
  assert.deepEqual(s.groups[0].ids, ['L-104', 'P-203']);
  assert.equal(s.reviews[0].status, 'approved');
  assert.ok(s.log.some(e => e.includes('checkpoint verified')));
});
test('decline is an explicit completed review, without fabricated match', () => {
  const s = resume(resolve(take(request(pick(initial(), 'L-106'))), false));
  assert.equal(s.owner, 'automation');
  assert.deepEqual(s.selected, []);
  assert.equal(s.reviews[0].status, 'declined');
  assert.equal(s.groups.length, 0);
});
test('approval applies only to exact entries and is revoked by undo', () => {
  const approved = resume(resolve(take(request(pick(initial(), 'L-104', 'P-203')))));
  const changed = pick(approved, 'P-203', 'P-204');
  assert.match(act(changed, 'match').error, /ambiguous/);
  const matched = act(approved, 'match');
  const undone = act(matched, 'undo', { id: matched.groups[0].id });
  assert.deepEqual(undone.approvals, []);
});
test('fault restoration preserves state and does not bypass a handoff', () => {
  let s = request(pick(initial(), 'L-104', 'P-203'));
  s = reducer(s, { type: 'fault', value: 'expired' });
  assert.equal(act(s, 'match').groups.length, 0);
  const restored = reducer(s, { type: 'restore' });
  assert.equal(restored.owner, 'waiting');
  assert.deepEqual(restored.selected, s.selected);
  assert.equal(resume(restored).owner, 'waiting');
});
test('resume refuses a stale or altered approved checkpoint', () => {
  const s = resolve(take(request(pick(initial(), 'L-104', 'P-203'))));
  assert.match(resume({ ...s, selected: ['L-104', 'P-204'] }).error, /checkpoint failed/);
  assert.match(resume({ ...s, fault: 'expired' }).error, /restore/);
});
test('alternate batch changes amounts and keeps grouping rules', () => {
  const s = pick(initial(true), 'L-102', 'L-103', 'P-202');
  assert.equal(totals(s).ledger, 240000);
  assert.equal(act(s, 'match').groups[0].cents, 240000);
  assert.ok(s.entries.find(e => e.id === 'L-105').note.includes('$60.00'));
});
test('duplicate or nonexistent input selections cannot create a group', () => {
  const s = initial();
  for (const selected of [['L-101', 'P-201', 'P-201'], ['L-101', 'P-201', 'X-1']]) {
    assert.equal(act({ ...s, selected }, 'match').groups.length, 0);
  }
});
