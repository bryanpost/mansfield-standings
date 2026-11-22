# Tuesday Late (Mansfield - Tuesday 6:35/8:45PM), 2026-27

Copied from the club website league page (curlingmembers.com league id 661) on 2026-11-22.
The page needs a member sign-in, so this is the record of what it said. Phone numbers, e-mail
addresses and the individuals/subs list were left out on purpose.

## Files

| File | What it is |
|---|---|
| `tuesday-late-schedule.png` | Screenshot of the schedule table on the club website page (cropped, no contact details). |
| `../../../data/2026-27/tuesday-late/` | The schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/tuesday-late.sql` | Generated seed SQL for Supabase (no results). |

Men's league, 4 players per team, point limit 43, shift captain Matt Aro (team 2).
11 teams, 5 sheets in play each week (6 columns on the page, one shown as "MD" = no game),
one draw a week that alternates 8:45 and 6:35, 20 weeks (10/27 to 3/23), playoffs 3/30.
Pairings are written "1v3"; the lower team number is stored as `home_no`.
Team names are the skip's surname. The page headed the schedule "Tuesday Late 2025-26",
but the dates are 2026-27 (10/27/2026 is a Tuesday), so that heading is just stale.

## Half boundary

The page marks "1st half" as weeks 1-10 and "2nd half" as weeks 11-20, so
`first_half_end_week` is **10** for every team (stated on the page, not assumed).

## Byes

Weeks 1-20: 6, 2, 5, 7, 4, 8, 3, 9, 10, 11, 7, 9, 8, 11, 2, 6, 5, 4, 3, 1.
Teams 1 and 10 have one bye (19 games); every other team has two (18 games).
No games between 12/15 and 1/5.

## Teams (skip, vice, second, lead)

| # | Skip | Vice | Second | Lead |
|---|---|---|---|---|
| 1 | Kyle Amend | Jon Scholl | Dennis DiCarlantonio | Alex Marach |
| 2 | Matt Aro | Dean Vanden Bush | Eric Wilcots | Jeff Schmidt |
| 3 | Max Grabowski | Gavin Lloyd | Jeremy Kofoot | Unal Karabulut |
| 4 | Steve Hicks | Chuck Brei | Joe Mabie | Gene Cook |
| 5 | Erich Inglin | Mike Johnson | TJ Turner | Michael Xenos |
| 6 | Dave Nelson | Trevor Nelson | John Zdeblick | Brad Grzesiak |
| 7 | Scott Moss | Daniel Cho | Keith Levin | Michael Foley |
| 8 | Evan Oakeson | Thomas Rathert | Paul Gerlach | Ryan Henke |
| 9 | Anthony Sommer | Greg Harding | Kevin Saberniak | Kevin Disch |
| 10 | Tommy Stauffer | Kyle Julius | Nathan Zukas | Charles Donaldson |
| 11 | Dan Wiza | Aaron Levine | Cody Carrell | Kevin Winters Morriss |

## Schedule

| Wk | Date | Draw | Sheet 1 | Sheet 2 | Sheet 3 | Sheet 4 | Sheet 5 | Sheet 6 | Bye |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 10/27 | 8:45 | 1v3 | 5v10 | 8v11 | 4v9 | 2v7 | MD | 6 |
| 2 | 11/3 | 6:35 | 10v11 | 7v9 | 3v6 | 1v8 | MD | 4v5 | 2 |
| 3 | 11/10 | 8:45 | 4v6 | 2v8 | 1v10 | MD | 3v7 | 9v11 | 5 |
| 4 | 11/17 | 6:35 | 8v9 | 3v4 | MD | 5v11 | 6v10 | 1v2 | 7 |
| 5 | 11/24 | 8:45 | 7v11 | MD | 2v6 | 9v10 | 1v5 | 3v8 | 4 |
| 6 | 12/1 | 6:35 | MD | 1v4 | 3v9 | 2v5 | 6v11 | 7v10 | 8 |
| 7 | 12/8 | 8:45 | 5v9 | 2v11 | 7v8 | 1v6 | 4v10 | MD | 3 |
| 8 | 12/15 | 6:35 | 2v10 | 6v8 | 4v11 | 3v5 | MD | 1v7 | 9 |
| 9 | 1/5 | 8:45 | 4v8 | 1v11 | 5v7 | MD | 2v3 | 6v9 | 10 |
| 10 | 1/12 | 6:35 | 1v9 | 3v10 | MD | 6v7 | 5v8 | 2v4 | 11 |
| 11 | 1/19 | 8:45 | 5v6 | MD | 2v10 | 8v9 | 1v4 | 3v11 | 7 |
| 12 | 1/26 | 6:35 | MD | 3v7 | 1v8 | 4v10 | 6v11 | 2v5 | 9 |
| 13 | 2/2 | 8:45 | 2v7 | 6v10 | 5v9 | 1v11 | 3v4 | MD | 8 |
| 14 | 2/9 | 6:35 | 3v10 | 1v5 | 4v7 | 2v8 | MD | 6v9 | 11 |
| 15 | 2/16 | 8:45 | 5v11 | 4v6 | 1v10 | MD | 7v9 | 3v8 | 2 |
| 16 | 2/23 | 6:35 | 2v3 | 1v9 | MD | 4v11 | 5v8 | 7v10 | 6 |
| 17 | 3/2 | 8:45 | 1v7 | MD | 2v9 | 3v6 | 10v11 | 4v8 | 5 |
| 18 | 3/9 | 6:35 | MD | 2v11 | 3v5 | 9v10 | 7v8 | 1v6 | 4 |
| 19 | 3/16 | 8:45 | 4v5 | 8v10 | 9v11 | 6v7 | 1v2 | MD | 3 |
| 20 | 3/23 | 6:35 | 6v8 | 7v11 | 2v4 | 3v9 | MD | 5v10 | 1 |

## Checks that passed

- 100 games = 20 weeks x 5; every team plays exactly once a week except its bye.
- `python3 scripts/verify_schedule.py data/2026-27/tuesday-late` passes.
