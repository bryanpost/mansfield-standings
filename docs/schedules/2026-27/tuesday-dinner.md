# Tuesday Dinner (Mansfield - Tuesday 4:25PM), 2026-27

## Files

| File | What it is |
|---|---|
| `tuesday-dinner-schedule.png` | The posted pairings: 6 sheets, one 4:25 draw, byes, no curling 12/22 and 12/29. |
| `tuesday-dinner-teams-roster.png` | Team roster from the club website (skip, vice, second, lead and ratings). |
| `../../../data/2026-27/tuesday-dinner/` | The schedule as data: `teams.csv`, `weeks.csv`, `games.csv`. |
| `../../../db/seed/2026-27/tuesday-dinner.sql` | Generated seed SQL for Supabase (no results). |

Facts from the posted schedule: men's league, 4 players per team, point limit 43,
shift captain Terry Cunningham (team 9). 13 teams, 6 games a week plus one bye, 20 weeks
(10/27 to 3/23). Pairings are written "1 vs 13"; the lower team number is stored as `home_no`.
Team names are the skip's surname.

## Byes

Weeks 1-20: 7, 1, 8, 2, 9, 3, 10, 4, 11, 5, 12, 6, 13, 7, 1, 8, 2, 9, 3, 10.

## Half boundary (ASSUMED, please confirm)

The pairings page does not show the half line; that is on the record sheet.
`first_half_end_week` is set to **10** for every team (same as Wednesday Late: 8 weeks before
the holiday break plus 2 in January, 20 weeks in all). Replace it from the Tuesday Dinner
record sheet if the bold line is elsewhere or differs by team.

## Checks that passed

- 120 games = 20 weeks x 6; every team plays exactly once a week except its bye.
- `python3 scripts/verify_schedule.py data/2026-27/tuesday-dinner` passes.
- Week 20 repeats week 7's pairings, as on the posted sheet.
