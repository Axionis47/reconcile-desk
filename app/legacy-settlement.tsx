'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { money, type Entry } from './model';

const frameDocument = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Settlement terminal</title>
<style>
body { margin:0; padding:14px; color:#23382e; background:#f4f3e9; font:14px Arial,sans-serif; }
table { width:100%; border-collapse:collapse; }
td { padding:10px 7px; border-bottom:1px solid #c7ccbd; vertical-align:middle; }
.layout > tbody > tr > td { border:0; padding:0; }
.banner { background:#324e3f; color:white; padding:12px; font-weight:bold; }
.reference { color:#5c675d; font-size:12px; margin-top:5px; }
.amount { text-align:right; white-space:nowrap; font-variant-numeric:tabular-nums; }
.selected { background:#dce8ce; }
button { padding:7px 9px; border:1px solid #758373; background:#fffef5; color:#23382e; cursor:pointer; }
button:focus-visible { outline:3px solid #1665b5; outline-offset:2px; }
button:disabled { opacity:.5; cursor:default; }
.caption { padding:12px 0; line-height:1.5; }
</style></head><body></body></html>`;

type Props = {
  entries: Entry[];
  selected: string[];
  disabled: boolean;
  isUsed: (id: string) => boolean;
  onSelect: (id: string) => void;
  onInspect: (entry: Entry) => void;
};

export function LegacySettlement(props: Props) {
  const frame = useRef<HTMLIFrameElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (doc?.readyState === 'complete') setBody(doc.body);
  }, []);
  return <section className="ledger" aria-label="Processor settlement">
    <div className="ledger-heading"><div><h2>Processor settlement</h2>
      <p>Legacy terminal · separate frame</p></div>
      <span className="count">{props.entries.length} entries</span></div>
    <iframe ref={frame} title="Legacy settlement terminal" srcDoc={frameDocument}
      className="legacy-terminal" sandbox="allow-same-origin"
      onLoad={event => setBody(event.currentTarget.contentDocument?.body ?? null)} />
    {body && createPortal(<table className="layout"><tbody><tr><td>
      <div className="banner">SETTLEMENT INQUIRY / BATCH 0842</div>
      <div className="caption">Choose a payment using its entry number and reference. Amount alone is not proof of a match.</div>
      <table><tbody>
        <tr><td>Action</td><td>Payment / reference</td><td className="amount">USD</td><td>File</td></tr>
        {props.entries.map(entry => <tr key={entry.id}
          className={props.selected.includes(entry.id) ? 'selected' : ''}>
          <td><button type="button" aria-pressed={props.selected.includes(entry.id)}
            disabled={props.disabled || props.isUsed(entry.id)}
            onClick={() => props.onSelect(entry.id)}>
            {props.selected.includes(entry.id) ? 'Selected' : 'Select'}</button></td>
          <td><table><tbody><tr><td>{entry.party}
            <div className="reference">{entry.id} / {entry.ref}</div>
          </td></tr></tbody></table></td>
          <td className="amount">{money(entry.cents)}<div className="reference">
            {props.isUsed(entry.id) ? 'Matched' : entry.ref === 'UNCONFIRMED' ? 'Needs review' : 'Unmatched'}
          </div></td>
          <td><button type="button" onClick={() => props.onInspect(entry)}>Open</button></td>
        </tr>)}
      </tbody></table>
      {!props.entries.length && <p>No entries found. Adjust the search or filter in the main workspace.</p>}
    </td></tr></tbody></table>, body)}
  </section>;
}
