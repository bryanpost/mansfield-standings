# Wednesday Dinner (Mansfield - Wednesday 4:25PM), 2026-27

Copied from the club website league page (curlingmembers.com league id 662) on 2026-11-22.
The page needs a member sign-in, so this is the record of what it said. Phone numbers, e-mail
addresses and the individuals/subs list were left out on purpose.

## Files

| File | What it is |
|---|---|
| `wednesday-dinner-schedule.png` | Screenshot of the schedule table on the club website page (cropped, no contact details). |
| `../../../data/2026-27/wednesday-dinner/` | The schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/wednesday-dinner.sql` | Generated seed SQL for Supabase (no results). |

Men's league, 4 players per team, point limit 43, shift captain Tom Schmidt (team 10).
13 teams, 6 sheets, one 4:25 draw, 6 games a week plus one bye, 20 weeks (10/28 to 3/24),
playdowns 3/29 to 4/2. Pairings are written "2v13"; the lower team number is stored as
`home_no`. Team names are the skip's surname.

## Page quirks

- **Week numbering typo.** The page labels the row after the holiday break (1/6) as week "8"
  again, so its labels for the rest of the season are one short (last row shown as 19). Counting
  the rows, there are 20 weeks; this repo uses the true numbers (1/6 is week 9, 3/24 is week 20),
  the same dates as Wednesday Late.
- **"Supper" column = the bye.** The team listed under "Supper" is the one team not playing that
  week (checked for all 20 weeks). It is stored as `bye_team`.
- **Spelling differs between the page's two tables.** The hand-typed table at the top of the roster
  and the member roster below it disagree on a few names. The member roster is used here;
  team 7's skip is "Robert (Pooch) Blakley" there but "Pooch Blakely" in the other table, so the
  team name is **Blakley**. Easy to change in `teams.csv` if the club spells it the other way.

## Half boundary (ASSUMED, please confirm)

The page does not show the half line. `first_half_end_week` is set to **10** for every team
(8 weeks before the holiday break plus 2 in January), as for the other Wednesday and Tuesday
shifts. Replace it from the record sheet if it differs.

## Byes (Supper)

Weeks 1-20: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 4, 2, 3, 1, 5, 6, 7.

## Teams (skip, vice, second, lead)

| # | Skip | Vice | Second | Lead |
|---|---|---|---|---|
| 1 | Reese Railling | Blair Fogeltanz | Darrell Gilbertson | Kristjan Gudjonsson |
| 2 | Ryan Witt | Martin Brown | Cory Wright | Dennis Schmitz |
| 3 | Adam Derringer | Neil Heggelund | Forrest Howk | Korey Stanberry |
| 4 | Theran Michaelis | Brad Miller | Sam Sondrup | Regan OConnor |
| 5 | Tony Roth | James Degerman | Todd Bernhardt | Michael Kennedy |
| 6 | Kroy Nernberger | Andy Merlin | Adam Ridgely | Bill W Buckingham |
| 7 | Robert "Pooch" Blakley | Michael Pfiffner | Doug Clark | Jim Elmore |
| 8 | Tim Wenzler | Derek Richardson | Austin Kempf | Jason Rittel |
| 9 | Don Rottscheit | Dennis Bork | Drew Freeman | Robert Thayer |
| 10 | Tom Schmidt | Greg Thornburg | Jonathon Truttmann | Hunter Brunwald |
| 11 | David Solheim | Thomas Solheim | Brian Kopp | Chad Vogel |
| 12 | Mason Tikkanen | Erik Ellenberger | Jeff Koch | Abe Meinke |
| 13 | Rob Nickells | Chris Dawson | Joe Taylor | Dan Youngblut |

## Schedule

| Wk | Date | Sheet 1 | Sheet 2 | Sheet 3 | Sheet 4 | Sheet 5 | Sheet 6 | Bye |
|---|---|---|---|---|---|---|---|---|
| 1 | 10/28 | 2v13 | 3v12 | 4v11 | 5v10 | 6v9 | 7v8 | 1 |
| 2 | 11/4 | 8v9 | 4v13 | 5v12 | 6v11 | 7v10 | 3v1 | 2 |
| 3 | 11/11 | 4v2 | 5v1 | 6v13 | 7v12 | 8v11 | 9v10 | 3 |
| 4 | 11/18 | 10v11 | 6v2 | 7v1 | 8v13 | 9v12 | 5v3 | 4 |
| 5 | 11/25 | 6v4 | 7v3 | 8v2 | 9v1 | 10v13 | 11v12 | 5 |
| 6 | 12/2 | 12v13 | 8v4 | 9v3 | 10v2 | 11v1 | 7v5 | 6 |
| 7 | 12/9 | 8v6 | 9v5 | 10v4 | 11v3 | 12v2 | 13v1 | 7 |
| 8 | 12/16 | 1v2 | 10v6 | 11v5 | 12v4 | 13v3 | 9v7 | 8 |
| 9 | 1/6 | 10v8 | 11v7 | 12v6 | 13v5 | 1v4 | 2v3 | 9 |
| 10 | 1/13 | 3v4 | 12v8 | 13v7 | 1v6 | 2v5 | 11v9 | 10 |
| 11 | 1/20 | 12v10 | 13v9 | 1v8 | 2v7 | 3v6 | 4v5 | 11 |
| 12 | 1/27 | 5v6 | 1v10 | 2v9 | 3v8 | 4v7 | 13v11 | 12 |
| 13 | 2/3 | 1v12 | 2v11 | 3v10 | 4v9 | 5v8 | 6v7 | 13 |
| 14 | 2/10 | 1v11 | 5v10 | 6v9 | 7v8 | 2v13 | 3v12 | 4 |
| 15 | 2/17 | 5v12 | 6v11 | 7v10 | 3v1 | 8v9 | 4v13 | 2 |
| 16 | 2/24 | 6v13 | 7v12 | 8v11 | 9v10 | 4v2 | 5v1 | 3 |
| 17 | 3/3 | 7v4 | 8v13 | 9v12 | 5v3 | 10v11 | 6v2 | 1 |
| 18 | 3/10 | 8v2 | 9v1 | 10v13 | 11v12 | 6v4 | 7v3 | 5 |
| 19 | 3/17 | 9v3 | 10v2 | 11v1 | 7v5 | 12v13 | 8v4 | 6 |
| 20 | 3/24 | 11v3 | 12v2 | 13v1 | 8v6 | 9v5 | 10v4 | 7 |

## Checks that passed

- 120 games = 20 weeks x 6; every team plays exactly once a week except its bye.
- The page's "Supper" team equals the team with the bye in all 20 weeks; all 20 dates are Wednesdays.
- `python3 scripts/verify_schedule.py data/2026-27/wednesday-dinner` passes.
