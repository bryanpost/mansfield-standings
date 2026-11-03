"""Check a shift's schedule CSVs for transcription mistakes.

Usage:  py scripts/verify_schedule.py data/2026-27/wednesday-late

Reads teams.csv, weeks.csv, games.csv in that folder and checks that:
  * every team plays exactly once each week, except its bye (weeks.csv)
  * nobody plays themselves; each sheet is used once per draw per week
  * recorded winners are one of the two teams
  * each team's first-half / second-half game counts (from first_half_end_week)
Exit code is 0 if everything passes, 1 otherwise. Prints a per-team summary.
"""
import csv
import sys
from collections import defaultdict
from pathlib import Path


def read(folder, name):
    with open(Path(folder) / name, newline="") as f:
        return list(csv.DictReader(f))


def main(folder):
    teams = {int(r["team_no"]): r for r in read(folder, "teams.csv")}
    weeks = {int(r["week"]): r for r in read(folder, "weeks.csv")}
    games = read(folder, "games.csv")
    errors = []

    by_week = defaultdict(list)
    for g in games:
        by_week[int(g["week"])].append(g)

    played = defaultdict(list)  # team_no -> [weeks]
    for wk in sorted(weeks):
        bye = int(weeks[wk]["bye_team"]) if weeks[wk]["bye_team"] else None
        seen = []
        sheets = set()
        for g in by_week.get(wk, []):
            a, b = int(g["team_a"]), int(g["team_b"])
            if a == b:
                errors.append(f"week {wk}: team {a} plays itself")
            if a not in teams or b not in teams:
                errors.append(f"week {wk}: unknown team in {a}v{b}")
            key = (g["draw"], g["sheet"])
            if key in sheets:
                errors.append(f"week {wk}: sheet {g['sheet']} used twice in the {g['draw']} draw")
            sheets.add(key)
            if g["date"] != weeks[wk]["date"]:
                errors.append(f"week {wk}: game date {g['date']} != week date {weeks[wk]['date']}")
            if g["winner_no"] and int(g["winner_no"]) not in (a, b):
                errors.append(f"week {wk}: winner {g['winner_no']} not in {a}v{b}")
            seen += [a, b]
            played[a].append(wk)
            played[b].append(wk)
        dupes = {t for t in seen if seen.count(t) > 1}
        if dupes:
            errors.append(f"week {wk}: teams playing twice: {sorted(dupes)}")
        expected = set(teams) - ({bye} if bye else set())
        if set(seen) != expected:
            errors.append(
                f"week {wk}: missing {sorted(expected - set(seen))}, unexpected {sorted(set(seen) - expected)}"
            )

    print(f"{len(games)} games, {len(weeks)} weeks, {len(teams)} teams")
    print(f"{'#':>2} {'team':<11} 1st+2nd half games  (first half ends wk)")
    for n, t in sorted(teams.items()):
        end = int(t["first_half_end_week"])
        h1 = sum(1 for w in played[n] if w <= end)
        h2 = len(played[n]) - h1
        print(f"{n:>2} {t['name']:<11} {h1:>2} + {h2:<2} = {h1 + h2:<2}        (wk {end})")

    if errors:
        print("\nPROBLEMS:")
        for e in errors:
            print("  -", e)
        return 1
    print("\nOK: every team plays exactly once a week except its bye; no conflicts.")
    return 0


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    sys.exit(main(sys.argv[1]))
