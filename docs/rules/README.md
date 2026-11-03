# League rules

The club's rules are the source of truth for the standings engine. When the
engine and these documents disagree, the documents win and the engine is the bug.

## Layout

| Path | What it is |
|---|---|
| `2026-27/MCC_League_Guidelines.pdf` | Original document as received. Never edited. |
| `2026-27/MCC_League_Guidelines.txt` | Verbatim text extraction of the PDF, so it can be searched and diffed. |
| `ENGINE-RULES.md` | Pages 5-7 as precise steps, what the engine was checked against, known gaps and open questions. `tests/engine-rules.test.js` is written against this file. |
| `archive/` | Superseded versions, moved here (not deleted) when rules change. |

## When the rules change

1. `git mv` the old season folder's documents into `archive/` (or leave the old season folder in place and add a new one, e.g. `2027-28/`).
2. Add the new PDF and its text extraction.
3. Update `ENGINE-RULES.md` and the tests in the same commit.

## Which pages matter

Only **pages 5-7** apply to the Mansfield event. Pages 1-4 cover other club
events. The rules are from 2022 and have been confirmed by the site owner as
current for 2025-26 and 2026-27. Nothing in the document itself says so, so
re-confirm each season.
