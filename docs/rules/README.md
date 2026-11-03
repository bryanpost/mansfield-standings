# League rules

The club's rules are the source of truth for the standings engine. When the
engine and these documents disagree, the documents win and the engine is the bug.

## Layout

| Path | What it is |
|---|---|
| `2026-27/MCC_League_Guidelines.pdf` | Original document as received. Never edited. |
| `2026-27/MCC_League_Guidelines.txt` | Verbatim text extraction of the PDF, so it can be searched and diffed. |
| `ENGINE-RULES.md` | The parts of the rules the engine implements, as precise steps. The unit tests are written against this file. |
| `archive/` | Superseded versions, moved here (not deleted) when rules change. |

## When the rules change

1. `git mv` the old season folder's documents into `archive/` (or leave the old season folder in place and add a new one, e.g. `2027-28/`).
2. Add the new PDF and its text extraction.
3. Update `ENGINE-RULES.md` and the tests in the same commit.

## Provenance warning

The PDF says "Effective October 31, 2022", and its playoff-participants page is
headed "2022-23". It was supplied as the current guidelines for 2026-27, but
nothing in the document itself confirms the playoff spot counts or the draw-shot
deadline for this season. See "Open questions" in `ENGINE-RULES.md`.
