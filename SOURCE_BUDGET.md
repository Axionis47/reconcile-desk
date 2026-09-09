# Source budget

Limit: **1,000 nonblank authored source lines**. Current count: **804**, including tests, the counting utility, styles, layout, and favicon. Blank lines are excluded; comments are included. This is a physical source-line measure, not a claim about program complexity.

| Authored file | Nonblank lines |
| --- | ---: |
| app/page.tsx | 322 |
| app/model.ts | 113 |
| app/legacy-settlement.tsx | 66 |
| app/globals.css | 153 |
| app/layout.tsx | 30 |
| tests/model.test.mjs | 100 |
| scripts/count-lines.mjs | 16 |
| public/favicon.svg | 4 |
| **Total** | **804** |

Reproduce with `node scripts/count-lines.mjs`. It exits unsuccessfully above the limit. It counts every TypeScript, JavaScript module, CSS and SVG file under app, tests, scripts and public.

The unmodified starter component library, hooks, helpers and root TypeScript declarations/configuration add **7,033 nonblank lines**, reported separately. Dependencies, generated bundles, lockfiles, metadata/configuration JSON, and documentation are excluded. The complete repository therefore exceeds 1,000 lines; the cap applies to authored application source, not vendored framework code. No handwritten runtime source has been moved into an excluded directory.
