# Wednesday Late, 2026-27

## Files

| File | What it is |
|---|---|
| `wednesday-late-record-sheet.jpg` | Photo of the posted record sheet (dates, byes, half lines, W/L marks; no opponents). |
| `wednesday-night-schedule.png` | The pairings: who plays whom, 6:35 and 8:45 draws, sheets, byes, clean-up. |
| `wednesday-night-teams-roster.png` | Team roster from the club website (skip, vice, second, lead and ratings). |
| `../../../data/2026-27/wednesday-late/` | The same schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/wednesday-late.sql` | Generated seed SQL for Supabase. |

Facts from the posted schedule: 17 teams share the 6:35 and 8:45 draws (the
league's "Wednesday 6:30/8:30" shift); holiday break 12/23 and 12/30; "Mansfield
Playdowns Week March 29 - April 3". Pairings are written like "4v6" with the lower
team number first, so the posted schedule has no home/away. The seed stores the lower
number as `home_no`. The record sheet and the pairings were transcribed separately
and agree on every bye and every game count.

## Weeks

## Weeks

| Wk | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Date | 10/28 | 11/4 | 11/11 | 11/18 | 11/25 | 12/2 | 12/9 | 12/16 | 1/6 | 1/13 | 1/20 | 1/27 | 2/3 | 2/10 | 2/17 | 2/24 | 3/3 | 3/10 | 3/17 | 3/24 |

No games 12/23 or 12/30. The bold line sits between 1/13 (wk 10) and 1/20 (wk 11).

## Teams, byes and half boundaries

On the sheet the bold line **steps one column to the right for rows 4-10**, so for those
seven teams the 1/20 game (week 11) belongs to the first half. For every other team the
first half ends at week 10.

| # | Rink | Bye weeks | First half ends | Games 1st + 2nd half |
|---|---|---|---|---|
| 1 | Kozloski | 1, 19 | wk 10 | 9 + 9 = 18 |
| 2 | Oldenburg | 2, 18 | wk 10 | 9 + 9 = 18 |
| 3 | Oakeson | 3, 20 | wk 10 | 9 + 9 = 18 |
| 4 | McPhee | 4 | **wk 11** | 10 + 9 = 19 |
| 5 | Krajewski | 5 | **wk 11** | 10 + 9 = 19 |
| 6 | Christen | 6 | **wk 11** | 10 + 9 = 19 |
| 7 | Shilling | 7 | **wk 11** | 10 + 9 = 19 |
| 8 | Peterson | 8 | **wk 11** | 10 + 9 = 19 |
| 9 | Ryan | 9 | **wk 11** | 10 + 9 = 19 |
| 10 | Hamilton | 10 | **wk 11** | 10 + 9 = 19 |
| 11 | Ebert | 11 | wk 10 | 10 + 9 = 19 |
| 12 | Ramm | 12 | wk 10 | 10 + 9 = 19 |
| 13 | Koehler | 13 | wk 10 | 10 + 9 = 19 |
| 14 | Veler | 14 | wk 10 | 10 + 9 = 19 |
| 15 | K Neidhart | 15 | wk 10 | 10 + 9 = 19 |
| 16 | Perry | 16 | wk 10 | 10 + 9 = 19 |
| 17 | J Neidhart | 17 | wk 10 | 10 + 9 = 19 |

`teams.first_half_end_week` is therefore 11 for teams 4-10 and 10 for the rest.

## Week 1 (10/28) marks already on the sheet

Bye: Kozloski.
W: Oldenburg, Oakeson, McPhee, Ryan, K Neidhart, Perry. L: Christen, Shilling, Peterson, Ebert, Veler, J Neidhart.
(Perry W and Ebert L confirmed by the site owner.)
Blank: Krajewski, Hamilton, Ramm, Koehler. With the pairings these are the games 5v12 and 10v13, not yet marked.
Results entered in the seed: 4v6 -> 4, 3v17 -> 3, 2v11 -> 2, 14v15 -> 15, 8v16 -> 16, 7v9 -> 9.

## Checks that passed

- 20 weeks, 17 teams, exactly one bye every week (20 byes).
- 160 games total, 8 per week (320 team-games = 3 x 18 + 14 x 19).
- Every team plays exactly 9 second-half games under this boundary reading.
- Week 1: every marked W is paired with a marked L; the 2 unmarked games are 5v12 and 10v13.
- `py scripts/verify_schedule.py data/2026-27/wednesday-late` passes (every team plays once a week except its bye).
