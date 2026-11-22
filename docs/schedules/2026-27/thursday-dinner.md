# Thursday Dinner (Mansfield - Thursday 4:25PM), 2026-27

Copied from the club website league page (curlingmembers.com league id 664) on 2026-11-22.
The page needs a member sign-in, so this is the record of what it said. Phone numbers, e-mail
addresses and the individuals/subs list were left out on purpose.

## Files

| File | What it is |
|---|---|
| `../../../data/2026-27/thursday-dinner/` | The schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/thursday-dinner.sql` | Generated seed SQL for Supabase (no results). |

No screenshot of the page is saved yet.

Men's league, 4 players per team, point limit 43, shift captain Rob Wixson (team 4).
13 teams, 6 sheets, one 4:25 draw, 6 games a week plus one bye, 19 league weeks (10/22 to 3/25),
playoffs start 3/29. Pairings are written "2v13"; the lower team number is stored as `home_no`.
Team names are the skip's surname.

## Page notes

- **Week 0 (10/15)** is listed as "1 and 2, 3 and 4, ... 11 and 12" on sheets 1-6. It is not a
  scheduled league game and is not in the data.
- **No-play dates:** 11/26 Thanksgiving, holiday break (12/24 and 12/31), 2/18 USSMCA Bonspiel.
- **Half boundary:** the page shows "Second Half" between week 9 (1/7) and week 10 (1/14), so
  `first_half_end_week` is **9** for every team.
- **Bye column** is the team not playing that week; stored as `bye_team`. Week 14 gives bye 1,
  the schedule then repeats the Wednesday Dinner pattern (2, 3, 4, 5, 6 in the last five weeks).
- Teams 1-6 get 17 games, teams 7-13 get 18.

## Byes

Weeks 1-19: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 1, 2, 3, 4, 5, 6.

## Teams (skip, vice, second, lead)

| # | Skip | Vice | Second | Lead |
|---|---|---|---|---|
| 1 | Bill Grout | Kevin Tyler | Nathan Perry | Dennis Haight |
| 2 | Steve Olson | Jim Sirianni | Tom Ziarnik | Todd Friske |
| 3 | Nick DeJongh | Tim Dingee | Jeffrey Brown | Brad Nellis |
| 4 | Rob Wixson | Jeff Lamont | Kevin Juno | Mark McDermid |
| 5 | Chris Helland | Eric Kelsey | Donald Greuel | Brian George |
| 6 | Derek Marley | Dan Schally | Bret Wagner | Adam Kachelski |
| 7 | Joe Weber | Phil Pielage | Jeff Wong | David Welo |
| 8 | Troy Mayne | Mike Bennett | Peter von Tresckow | Tyler Smith |
| 9 | Chuck Soldner | Mark McCarthy | Fred Fleitz | Bob Soldner |
| 10 | Paul Matzke | PJ Slinger | Allan Muzilla | John Elgar |
| 11 | Cory Gilbertson | John Eaton | Phil Dean | Nathan Johnson |
| 12 | Ron Kroner | Bill Burns | Dan Buri | Jonathan Baran |
| 13 | Mike Fraboni | Will Piatt | Bennett Fraboni | Stephen Frantz |

## Schedule

| Wk | Date | Sheet 1 | Sheet 2 | Sheet 3 | Sheet 4 | Sheet 5 | Sheet 6 | Bye |
|---|---|---|---|---|---|---|---|---|
| 1 | 10/22 | 2v13 | 3v12 | 4v11 | 5v10 | 6v9 | 7v8 | 1 |
| 2 | 10/29 | 8v9 | 4v13 | 5v12 | 6v11 | 7v10 | 3v1 | 2 |
| 3 | 11/5 | 4v2 | 5v1 | 6v13 | 7v12 | 8v11 | 9v10 | 3 |
| 4 | 11/12 | 10v11 | 6v2 | 7v1 | 8v13 | 9v12 | 5v3 | 4 |
| 5 | 11/19 | 6v4 | 7v3 | 8v2 | 9v1 | 10v13 | 11v12 | 5 |
| 6 | 12/3 | 12v13 | 8v4 | 9v3 | 10v2 | 11v1 | 7v5 | 6 |
| 7 | 12/10 | 8v6 | 9v5 | 10v4 | 11v3 | 12v2 | 13v1 | 7 |
| 8 | 12/17 | 1v2 | 10v6 | 11v5 | 12v4 | 13v3 | 9v7 | 8 |
| 9 | 1/7 | 10v8 | 11v7 | 12v6 | 13v5 | 1v4 | 2v3 | 9 |
| 10 | 1/14 | 3v4 | 12v8 | 13v7 | 1v6 | 2v5 | 11v9 | 10 |
| 11 | 1/21 | 12v10 | 13v9 | 1v8 | 2v7 | 3v6 | 4v5 | 11 |
| 12 | 1/28 | 5v6 | 1v10 | 2v9 | 3v8 | 4v7 | 13v11 | 12 |
| 13 | 2/4 | 1v12 | 2v11 | 3v10 | 4v9 | 5v8 | 6v7 | 13 |
| 14 | 2/11 | 4v11 | 5v10 | 6v9 | 7v8 | 2v13 | 3v12 | 1 |
| 15 | 2/25 | 5v12 | 6v11 | 7v10 | 3v1 | 8v9 | 4v13 | 2 |
| 16 | 3/4 | 6v13 | 7v12 | 8v11 | 9v10 | 4v2 | 5v1 | 3 |
| 17 | 3/11 | 7v1 | 8v13 | 9v12 | 5v3 | 10v11 | 6v2 | 4 |
| 18 | 3/18 | 8v2 | 9v1 | 10v13 | 11v12 | 6v4 | 7v3 | 5 |
| 19 | 3/25 | 12v13 | 8v4 | 9v3 | 10v2 | 11v1 | 7v5 | 6 |

## Checks that passed

- 114 games = 19 weeks x 6; every team plays exactly once a week except its bye; all dates are Thursdays.
- `python3 scripts/verify_schedule.py data/2026-27/thursday-dinner` passes.
