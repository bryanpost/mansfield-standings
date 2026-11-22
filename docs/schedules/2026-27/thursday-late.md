# Thursday Late (Mansfield - Thursday 6:35/8:45PM), 2026-27

Copied from the club website league page (curlingmembers.com league id 665) on 2026-11-22.
The page needs a member sign-in, so this is the record of what it said. Phone numbers, e-mail
addresses and the individuals/subs list were left out on purpose.

## Files

| File | What it is |
|---|---|
| `thursday-late-schedule.png` | Screenshot of the schedule table on the club website page (no contact details). |
| `../../../data/2026-27/thursday-late/` | The schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/thursday-late.sql` | Generated seed SQL for Supabase (no results). |

Men's league, 4 players per team, point limit 43, shift captains Steven Trac (team 7) and Ryan Hood (team 1).
13 teams, 6 sheets, alternating 6:35 and 8:45 draws (odd weeks 6:35, even weeks 8:45), 6 games a week
plus one bye, 20 weeks (10/15 to 3/25), playdowns 4/1. Pairings are written "3v4"; the lower team
number is stored as `home_no`. Team names are the skip's surname.

## Page notes

- **Half boundary:** the page labels weeks 1-10 "First Half" and week 11 (1/14) "Second Half", so
  `first_half_end_week` is **10** for every team.
- **No-play dates:** 11/26 Thanksgiving, 12/24 Christmas, 12/31 New Years, 2/18 USSMCA.
- **Asterisks** on a team in the schedule mean "team tasked with leading 8:45 cleanup". They are not
  stored in the data.
- **Bye column** is the team not playing that week; stored as `bye_team`.
- Teams 1, 2, 7, 8, 9, 10, 13 get 18 games; teams 3, 4, 5, 6, 11, 12 get 19.

## Byes

Weeks 1-20: 10, 7, 1, 8, 2, 9, 13, 3, 12, 4, 11, 5, 10, 6, 13, 7, 8, 1, 2, 9.

## Teams (skip, vice, second, lead)

| # | Skip | Vice | Second | Lead |
|---|---|---|---|---|
| 1 | Ryan Hood | Matthew Bock | Jerry Taylor | Kyle Magyera |
| 2 | Jacob Fortune | Dan Grupe | Jeff Knight | Ross Johnson |
| 3 | Dan Backes | Aaron Bertsch | Andrew Bremer | Dennis Rodenberg |
| 4 | Jesse Peterson | Andrew Baraniak | Kyle Clower | Bobby Marshment-Howell |
| 5 | Matt Rodefeld | Mark Hartman | Rob Pugh | James Raschke |
| 6 | Steve Day | Sean Cassidy | Adam Brown | Matt Record |
| 7 | Steven Trac | Zach Kerwin | Adam Sasse | Brian Bentley |
| 8 | Dean Schmitz | John Schiller | Matt Hirsch | Will Erikson |
| 9 | Chris Hopp | Brian Schmeiser | Clint Walz | Owen Hopp |
| 10 | Nathan Schwantes | Steve Ackerman | Zach Biel | Joshua Ksioszk |
| 11 | Jason Klein | Kevin Gustafson | Thomas Carter | John Flaherty |
| 12 | Wesley Simonis | Phil Grupe | Jacob Riehl | Tim Brickner |
| 13 | Patrick Roe | Kenneth Mullikin | Brad Thompson | Caleb Dillingham |

## Schedule

| Wk | Date | Draw | Sheet 1 | Sheet 2 | Sheet 3 | Sheet 4 | Sheet 5 | Sheet 6 | Bye |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 10/15 | 6:35 | 3v4 | 9v11 | 1v6 | 8v12 | 7v13 | 2v5 | 10 |
| 2 | 10/22 | 8:45 | 1v13 | 2v12 | 3v11 | 4v10 | 5v9 | 6v8 | 7 |
| 3 | 10/29 | 6:35 | 6v9 | 7v8 | 2v13 | 3v12 | 4v11 | 5v10 | 1 |
| 4 | 11/5 | 8:45 | 5v11 | 6v10 | 7v9 | 1v2 | 3v13 | 4v12 | 8 |
| 5 | 11/12 | 6:35 | 4v13 | 1v3 | 5v12 | 6v11 | 7v10 | 8v9 | 2 |
| 6 | 11/19 | 8:45 | 6v12 | 7v11 | 8v10 | 5v13 | 1v4 | 2v3 | 9 |
| 7 | 12/3 | 6:35 | 3v10 | 5v8 | 4v9 | 2v11 | 6v7 | 1v12 | 13 |
| 8 | 12/10 | 8:45 | 7v12 | 2v4 | 8v11 | 9v10 | 1v5 | 6v13 | 3 |
| 9 | 12/17 | 6:35 | 1v10 | 3v8 | 4v7 | 5v6 | 11v13 | 2v9 | 12 |
| 10 | 1/7 | 8:45 | 3v5 | 10v11 | 9v12 | 1v7 | 2v6 | 8v13 | 4 |
| 11 | 1/14 | 6:35 | 2v7 | 4v5 | 3v6 | 9v13 | 1v8 | 10v12 | 11 |
| 12 | 1/21 | 8:45 | 11v12 | 1v9 | 10v13 | 2v8 | 3v7 | 4v6 | 5 |
| 13 | 1/28 | 6:35 | 1v6 | 7v13 | 2v5 | 3v4 | 8v12 | 9v11 | 10 |
| 14 | 2/4 | 8:45 | 4v8 | 12v13 | 1v11 | 3v9 | 2v10 | 5v7 | 6 |
| 15 | 2/11 | 6:35 | 2v11 | 6v7 | 5v8 | 1v12 | 4v9 | 3v10 | 13 |
| 16 | 2/25 | 8:45 | 6v8 | 5v9 | 2v12 | 4v10 | 3v11 | 1v13 | 7 |
| 17 | 3/4 | 6:35 | 5v11 | 6v10 | 3v13 | 1v2 | 4v12 | 7v9 | 8 |
| 18 | 3/11 | 8:45 | 2v13 | 3v12 | 6v9 | 7v8 | 5v10 | 4v11 | 1 |
| 19 | 3/18 | 6:35 | 5v12 | 4v13 | 7v10 | 6v11 | 8v9 | 1v3 | 2 |
| 20 | 3/25 | 8:45 | 8v10 | 2v3 | 1v4 | 5v13 | 6v12 | 7v11 | 9 |

## Checks that passed

- 120 games = 20 weeks x 6; every team plays exactly once a week except its bye; all dates are Thursdays.
- `python3 scripts/verify_schedule.py data/2026-27/thursday-late` passes.
