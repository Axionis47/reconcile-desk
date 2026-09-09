'use client';
import { useEffect, useReducer, useState } from 'react';
import { ArrowLeftRight, ArrowUpRight, Check, ChevronRight, Layers3, Search, ShieldCheck, SlidersHorizontal, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sidebar, SidebarProvider, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { initial, reducer, money, totals, used, type Entry } from './model';
export default function Home() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initial());
  const [view, setView] = useState('Reconcile');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('Unmatched');
  const [reverse, setReverse] = useState(false);
  const [detail, setDetail] = useState<Entry | null>(null);
  const [note, setNote] = useState('');
  const [resetVariant, setResetVariant] = useState<boolean | null>(null);
  const [embedded, setEmbedded] = useState(false);
  const openReview = state.reviews.findLast(r => r.status === 'open');
  useEffect(() => {
    if (state.fault !== 'delayed') return;
    const timer = setTimeout(() => dispatch({ type: 'restore' }), 2500);
    return () => clearTimeout(timer);
  }, [state.fault]);
  function navigate(next: string) {
    setView(next); setQuery(''); setFilter(next === 'Trace payment' ? 'All' : 'Unmatched');
  }
  function exportEvidence() {
    const data = { groups: state.groups, reviews: state.reviews, owner: state.owner, events: state.log };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'reconciliation-evidence.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const sum = totals(state);
  const locked = !['automation', 'human'].includes(state.owner) || state.fault !== 'none';
  const matched = state.groups.reduce((n, g) => n + g.cents, 0);
  const outstanding = state.entries.filter(r => r.id.startsWith('L-') && !used(state, r.id));
  function ledger(prefix: string, title: string, subtitle: string) {
    const entries = state.entries.filter(r => r.id.startsWith(prefix) && (filter !== 'Unmatched' || !used(state, r.id)) && `${r.id} ${r.party} ${r.ref}`.toLowerCase().includes(query.toLowerCase()));
    if (reverse) entries.reverse();
    return <section className="ledger" aria-label={title}>
      <div className="ledger-heading">
      <div>
      <h2>{title}</h2>
      <p>{subtitle}</p>
      </div>
      <span className="count">{entries.length} entries</span>
      </div>
      <Table>
      <TableHeader>
      <TableRow>
      <TableHead className="check-col">
      <span className="sr-only">Select</span>
      </TableHead>
      <TableHead>Counterparty / reference</TableHead>
      <TableHead className="number">Amount</TableHead>
      <TableHead>
      <span className="sr-only">Details</span>
      </TableHead>
      </TableRow>
      </TableHeader>
        <TableBody>{entries.map(r => <TableRow key={r.id} className={state.selected.includes(r.id) ? 'selected-row' : ''}>
          <TableCell>
      <Checkbox aria-label={`Select ${r.id}`} checked={state.selected.includes(r.id)} disabled={locked || view === 'Trace payment' || used(state, r.id)} onCheckedChange={() => dispatch({ type: 'select', id: r.id, actor: state.owner })} />
      </TableCell>
          <TableCell>
      <strong>{r.party}</strong>
      <span className="reference">{r.id} <span>·</span> {r.ref}</span>
      </TableCell>
          <TableCell className="number">
      <strong>{money(r.cents)}</strong>
      <span className={`reference ${used(state, r.id) ? 'green' : ''}`}>{used(state, r.id) ? 'Matched' : r.ref === 'UNCONFIRMED' ? 'Needs review' : 'Unmatched'}</span>
      </TableCell>
          <TableCell>
      <Button variant="ghost" size="icon" aria-label={`Inspect ${r.id}`} onClick={() => setDetail(r)}>
      <ArrowUpRight size={16} />
      </Button>
      </TableCell>
        </TableRow>)}</TableBody>
      </Table>{!entries.length && <div className="empty">
      <Search />
      <h3>No matching entries</h3>
      <p>Try a different reference or show all entries.</p>
      </div>}
    </section>;
  }
  return <SidebarProvider style={{ '--sidebar-width': '218px' } as React.CSSProperties}>
      <Sidebar className="rail">
      <SidebarHeader>
      <div className="brand">
      <span>
      <ArrowLeftRight size={22} />
      </span>reconcile<span className="brand-dot">.</span>
      </div>
      <div className="workspace-label">NORTHLINE / OPERATIONS</div>
      </SidebarHeader>
    <SidebarContent>
      <SidebarMenu>{[['Reconcile', Layers3], ['Trace payment', Search], ['Exceptions', ShieldCheck]].map(([label, Icon]) => <SidebarMenuItem key={String(label)}>
      <SidebarMenuButton isActive={view === label} onClick={() => navigate(String(label))}>
      <Icon />
      <span>{String(label)}</span>{label === 'Exceptions' && <span className="nav-count">{state.reviews.filter(r => r.status === 'open').length}</span>}</SidebarMenuButton>
      </SidebarMenuItem>)}</SidebarMenu>
      </SidebarContent>
    <SidebarFooter>
      <SidebarMenuButton onClick={() => navigate('Scenario lab')} isActive={view === 'Scenario lab'}>
      <SlidersHorizontal />
      <span>Scenario lab</span>
      </SidebarMenuButton>
      <div className="user">
      <span className="avatar">SO</span>
      <div>Settlement operator<small>Local simulation</small>
      </div>
      </div>
      </SidebarFooter>
  </Sidebar>
      <main className="main">
      <header className="topbar">
      <div className="crumb">
      <SidebarTrigger />Operations <ChevronRight size={14} />
      <b>{view}</b>
      </div>
      <span className="environment">
      <span /> SANDBOX</span>
      </header>
    <div className="content">
      <div className="page-heading">
      <div>
      <p className="eyebrow">SETTLEMENT WORKSPACE</p>
      <h1>{view === 'Reconcile' ? 'Bring every payment into balance.' : view}</h1>
      <p>Batch 0842 <span className="dot">·</span> 08 September 2026 <span className="dot">·</span> USD</p>
      </div>
      <span className="session">
      <span className={state.owner === 'automation' ? 'live-dot' : 'wait-dot'} />{state.owner === 'automation' ? 'Session active' : state.owner === 'human' ? 'Operator in control' : 'Automation paused'}</span>
      </div>
    <section className="metrics">
      <div>
      <span>Ledger total</span>
      <strong>{money(state.entries.filter(r => r.id.startsWith('L-')).reduce((n, r) => n + r.cents, 0))}</strong>
      <small>6 internal entries</small>
      </div>
      <div>
      <span>Reconciled</span>
      <strong className="green">{money(matched)}</strong>
      <small>{state.groups.length} verified groups</small>
      </div>
      <div>
      <span>Remaining</span>
      <strong>{money(outstanding.reduce((n, r) => n + r.cents, 0))}</strong>
      <small>{outstanding.length} entries to resolve</small>
      </div>
      <div>
      <span>Human reviews</span>
      <strong>{state.reviews.filter(r => r.status === 'open').length.toString().padStart(2, '0')}</strong>
      <small>Exceptions needing a decision</small>
      </div>
      </section>
    {view !== 'Scenario lab' && <div className="toolbar">
      <div className="search">
      <Search size={17} />
      <Input aria-label="Find a payment" placeholder="Find a name, reference, or entry…" value={query} onChange={e => setQuery(e.target.value)} />
      </div>
      <Button variant="outline" onClick={() => setFilter(filter === 'Unmatched' ? 'All' : 'Unmatched')}>{filter} entries</Button>
      <Button variant="outline" onClick={() => setReverse(!reverse)}>Sort {reverse ? '↓' : '↑'}</Button>
      </div>}
    <div role="status" className={state.error || state.notice ? `message ${state.error ? 'error' : 'success'}` : 'sr-only'}>{state.error || state.notice}</div>
    {view === 'Trace payment' && <section className="instruction">
      <h2>Follow the evidence, not just the amount.</h2>
      <p>Search across both ledgers, then inspect an entry for its reference and supporting note. This view is read-only. Equal amounts alone do not establish a match.</p>
      <Button variant="outline" onClick={() => navigate('Reconcile')}>Go to reconciliation</Button>
      </section>}
    {view === 'Exceptions' && <section className="review-panel">
      <div className="section-heading">
      <h2>Operator handoff</h2>
      <span>{state.owner}</span>
      </div>
      {state.owner === 'automation' && <p>No session is waiting for intervention. Select entries in Reconcile and request review when the evidence is ambiguous or incomplete.</p>}
      {openReview && <p>{openReview.id} · Requested entries: {openReview.ids.join(' + ')}</p>}
      {state.owner === 'waiting' && <>
      <p>Automation is paused. The operator can correct the selection in this same session.</p>
      <Button onClick={() => dispatch({ type: 'take' })}>Take control as operator</Button>
      </>}
      {state.owner === 'human' && <>
        <div className="operator-note">
      <strong>Operator remittance record</strong>
      <p>P-203 settles Northstar invoice INV-1045. P-204 belongs to a prior batch and must remain unmatched here. Fieldwork's shortage has no authorized adjustment.</p>
      </div>
        <p>Use the ledgers below to correct the selection. Approval requires balanced totals. Decline if the requested match cannot be established.</p>
        <label htmlFor="review-reason">Review reason</label>
      <Textarea id="review-reason" value={note} onChange={e => setNote(e.target.value)} placeholder="Explain the evidence and your decision (synthetic data only)." />
        <div className="actions">
      <Button variant="outline" disabled={locked} onClick={() => dispatch({ type: 'resolve', approved: false, note })}>Decline match</Button>
      <Button disabled={locked} onClick={() => dispatch({ type: 'resolve', approved: true, note })}>Approve current selection</Button>
      </div>
      </>}
      {state.owner === 'ready' && <>
      <p>The review is resolved. Resume checks that the entries are still available, balanced, and approved before returning control.</p>
      <Button disabled={state.fault !== 'none'} onClick={() => dispatch({ type: 'resume' })}>Validate checkpoint and resume</Button>
      </>}
      {state.reviews.filter(r => r.status !== 'open').map(r => <div className="review-record" key={r.id}>
      <strong>{r.id} · {r.status}</strong>
      <p>{r.ids.join(' + ')}</p>
      <p>{r.note}</p>
      </div>)}
    </section>}
    {view === 'Scenario lab' && <section className="scenario-panel">
      <h2>Controlled complications</h2>
      <p>These controls are test fixtures. Keep them outside the automation's task permissions.</p>
      <div className="scenario-grid">{[
        ['delayed', 'Delayed response', 'Temporarily blocks actions for 2.5 seconds, then restores the same session.'],
        ['expired', 'Expired session', 'Requires an operator to restore the simulated session. No credentials are requested.'],
        ['unexpected', 'Unfamiliar interruption', 'Blocks the workflow until the operator acknowledges an unexpected system state.'],
      ].map(([value, title, description]) => <article key={value}>
      <h3>{title}</h3>
      <p>{description}</p>
      <Button variant="outline" onClick={() => dispatch({ type: 'fault', value })}>Trigger {title.toLowerCase()}</Button>
      </article>)}</div>
      <div className="operator-note">
      <h3>Embedded processor evidence</h3>
      <p>Enable a separately framed settlement notice. It exercises frame discovery without changing the reconciliation rules.</p>
      <Button variant="outline" onClick={() => setEmbedded(!embedded)}>{embedded ? 'Hide' : 'Show'} embedded notice</Button>
      </div>
      <div className="actions">
      <Button variant="outline" onClick={() => setResetVariant(false)}>Reset original batch</Button>
      <Button variant="outline" onClick={() => setResetVariant(true)}>Load alternate amounts</Button>
      <Button variant="outline" onClick={exportEvidence}>Export session evidence</Button>
      </div>
      <h3>Test cases in this batch</h3>
      <p>Atlas: exact match. Harbor: two ledger entries to one settlement. Northstar: ambiguous reference. Fieldwork: unresolvable shortage. Olive and Juniper: missing counterparts.</p>
    </section>}
    {embedded && <iframe title="Processor settlement notice" className="evidence-frame" sandbox="" srcDoc={'<!doctype html><html lang="en"><body style="font:14px system-ui;padding:12px;color:#24483c"><h2 style="font-size:16px">Processor settlement notice</h2><p>Batch 0842 · USD · Posting complete. Harbor settlements combine two installments. Unconfirmed references require operator remittance review.</p></body></html>'} />}
    {view !== 'Scenario lab' && <div className="ledgers">{ledger('L-', 'Internal ledger', 'Recorded receivables')}{ledger('P-', 'Processor settlement', 'Reported incoming payments')}</div>}
    {(view === 'Reconcile' || view === 'Exceptions') && <section className="selection-bar">
      <div>
      <span className="eyebrow">CURRENT SELECTION</span>
      <strong>{state.selected.length} entries selected</strong>
      <small>{state.selected.join(' · ') || 'Select corresponding entries from both sides.'}</small>
      </div>
      <div className="selection-total">
      <span>Ledger <b>{money(sum.ledger)}</b>
      </span>
      <span>Processor <b>{money(sum.processor)}</b>
      </span>
      <span className={sum.ledger === sum.processor ? 'green' : 'red'}>Difference <b>{money(sum.ledger - sum.processor)}</b>
      </span>
      </div>
      <div className="actions">
      <Button variant="ghost" disabled={locked} onClick={() => dispatch({ type: 'clear', actor: state.owner })}>Clear</Button>
      <Button variant="outline" disabled={locked || state.owner !== 'automation' || !state.selected.length} onClick={() => { dispatch({ type: 'request', actor: state.owner }); setNote(''); navigate('Exceptions'); }}>Request review</Button>
      <Button disabled={locked || state.owner !== 'automation' || !state.selected.length} onClick={() => dispatch({ type: 'match', actor: state.owner })}>
      <Check size={16} />Reconcile selection</Button>
      </div>
      </section>}
    {view === 'Reconcile' && <section className="history">
      <div className="section-heading">
      <h2>Reconciled groups</h2>
      <span>{state.groups.length} completed</span>
      </div>{!state.groups.length ? <p className="quiet">Verified matches will appear here. Select entries to create your first group.</p> : state.groups.map(g => <div className="group-row" key={g.id}>
      <span className="group-icon">
      <Check size={16} />
      </span>
      <div>
      <strong>{g.id}</strong>
      <small>{g.ids.join(' + ')}</small>
      </div>
      <b>{money(g.cents)}</b>
      <Button variant="ghost" disabled={locked} onClick={() => dispatch({ type: 'undo', id: g.id, actor: state.owner })}>
      <Undo2 size={15} />Undo</Button>
      </div>)}</section>}
    {(view === 'Exceptions' || view === 'Scenario lab') && <section className="history">
      <div className="section-heading">
      <h2>Session history</h2>
      <Button variant="ghost" onClick={exportEvidence}>Export evidence</Button>
      </div>
      <ol className="audit">{state.log.map((event, index) => <li key={index}>
      <span>{String(index + 1).padStart(2, '0')}</span>{event}</li>)}</ol>
      </section>}
    <AlertDialog open={state.fault !== 'none'}>
      <AlertDialogContent>
      <AlertDialogTitle>{state.fault === 'delayed' ? 'Waiting for settlement service' : state.fault === 'expired' ? 'Session verification required' : 'Unexpected service interruption'}</AlertDialogTitle>
      <AlertDialogDescription>Workflow actions are blocked. Existing selections and reconciled groups are preserved. {state.fault === 'delayed' ? 'The service will recover shortly.' : 'An operator must restore this simulated session.'}</AlertDialogDescription>{state.fault !== 'delayed' && <AlertDialogAction onClick={() => dispatch({ type: 'restore' })}>Operator: restore session</AlertDialogAction>}</AlertDialogContent>
      </AlertDialog>
    <AlertDialog open={resetVariant !== null} onOpenChange={open => { if (!open) setResetVariant(null); }}>
      <AlertDialogContent>
      <AlertDialogTitle>Replace this batch?</AlertDialogTitle>
      <AlertDialogDescription>This clears selections, reconciliations, reviews, and session history. Export any evidence you want to retain first.</AlertDialogDescription>
      <AlertDialogCancel>Keep current batch</AlertDialogCancel>
      <AlertDialogAction onClick={() => { dispatch({ type: 'reset', variant: resetVariant ?? false }); setResetVariant(null); setNote(''); navigate('Reconcile'); }}>Replace batch</AlertDialogAction>
      </AlertDialogContent>
      </AlertDialog>
    <footer className="footnote">Synthetic records only. No money moves. <span>Changes last until this page is reloaded.</span>
      </footer>
    <Sheet open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
      <SheetContent>
      <SheetHeader>
      <SheetTitle>{detail?.id} · {detail?.party}</SheetTitle>
      <SheetDescription>Payment evidence · synthetic batch 0842</SheetDescription>
      </SheetHeader>{detail && <div className="detail-body">
      <p className="detail-amount">{money(detail.cents)}</p>
      <p>
      <strong>Reference</strong>
      <br />{detail.ref}</p>
      <p>
      <strong>Supporting note</strong>
      <br />{detail.note}</p>
      <p>
      <strong>Current status</strong>
      <br />{used(state, detail.id) ? 'Reconciled' : 'Unmatched'}</p>
      <h3>Related entries</h3>{state.entries.filter(r => r.id !== detail.id && (r.ref === detail.ref || r.party === detail.party)).map(r => <Button variant="outline" key={r.id} onClick={() => setDetail(r)}>{r.id} · {money(r.cents)}</Button>)}<p className="quiet">Related entries are candidates, not confirmed matches. Verify references and both totals before reconciling.</p>
      </div>}</SheetContent>
      </Sheet>
    </div>
      </main>
      </SidebarProvider>;
}
