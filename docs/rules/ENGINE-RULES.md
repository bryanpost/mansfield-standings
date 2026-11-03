# Rules the standings engine implements

Source: `2026-27/MCC_League_Guidelines.pdf` (Madison Curling Club Event Rules and
Event Tiebreakers, effective Oct 31, 2022; "Determination of Mansfield Event
Playoff Participants – 2022-23"). Section names below refer to that document.
Everything here is about the **Mansfield** event only.

## 1. The "one full game" rule

Teams do not all play the same number of games, so records are compared by
games behind, not by win percentage:

    games_behind(a, b) = ((b.wins - a.wins) + (a.losses - b.losses)) / 2

- Team A is *better* than team B only if A leads by **at least 1.0 game**.
- Within less than 1.0 game (i.e. half a game) the teams are *tied*.
- Examples from the document: 9-0 vs 8-0 is tied; 9-0 vs 8-1 is not; 12-6 does not beat 11-6.
- "Tied" is not transitive-all-or-nothing. With several teams, any team that is
  at least a full game behind some other contender is dropped, and the
  criteria are re-applied to the rest ("It is NOT a 'two tie, all tie' situation").

## 2. Order in which berths are awarded

Across the whole event, in this order (a team can only take one berth):

1. First-half winners
2. First-half runners-up (where the shift has them)
3. Second-half winners
4. Second-half runners-up (where the shift has them)
5. Shift wild cards (where the shift has them)
6. Event wild cards (4)

After a half winner is chosen, the runner-up is chosen from the remaining teams
by the same procedure. A 9-0 team that loses the winner spot on a tiebreaker to
an 8-0 team automatically gets runner-up, because it is a full game clear of an
8-1 team. If the 9-0 team wins, the criteria are re-applied to decide between
the 8-0 and 8-1 teams.

## 3. Tiebreaker criteria, in order

**Half winner / half runner-up** (compare on that half's record first, then):
1. Overall season record, by at least one full game
2. Head-to-head within that half, only if every involved team has played every other at least once that half (one-full-game rule applies to the aggregate)
3. Head-to-head over the whole season, same condition
4. Lowest draw-shot measurement
5. Coin flip among the remaining teams

**Shift wild card** = best overall record on the shift among teams not already a
half winner or runner-up:
1. Overall season record, by at least one full game
2. Head-to-head over the whole season (same condition as above)
3. Lowest draw-shot measurement
4. Coin flip

**Event wild card** = best overall record in the whole event among teams not
already qualified. Assumes teams played the same number of games, plus or minus one.
1. Overall season record, by at least one full game
2. Lowest draw-shot measurement
3. Coin flip

(No head-to-head step for event wild cards.)

## 4. Playoff spots per shift (28 total)

| Shift (club times in the document) | Spots | Breakdown |
|---|---|---|
| Tuesday 4:30 | 4 | top two first half, top two second half |
| Tuesday 6:30/8:30 | 2 | first-half winner, second-half winner |
| Wednesday 4:30 | 4 | top two each half |
| Wednesday 6:30/8:30 | 6 | top two each half, plus 2 shift wild cards |
| Thursday 5:00 | 4 | top two each half |
| Thursday 7:00/9:00 | 4 | top two each half |
| Event wild cards | 4 | |

Note the time labels do not match the current site's shift names (the site
says "Dinner"/"Late"; the league's Tuesday dinner game is at 4:25). The site's
existing `CONFIG` already matches the spot counts above.

## 5. Draw-shot measurement

- One stone per team per season, measured to the nearest 1/2 inch from the button.
- Missing the house is recorded as 72".
- A team that has not thrown by the deadline is marked **X**, which ranks *below* 72".
- Deadline for Mansfield playoff purposes: the completion of the final game of the first half for the team's shift. (The general-event page says week 8; that page excludes Mansfield.)
- Stored as text: a number, `X`, or null (not yet recorded). Null and X rank the same.

## 6. Games, forfeits and unplayed games

- The posted event sheet is the official record. Winning thirds mark the result.
- A game nobody marks by the end of the last week is a **forfeit for both teams** (Rule 7). The current data model (one winner or none) cannot represent this.
- A team that requests a reschedule and cannot agree a date with the other skip records a loss (Rule 11B).
- A team that is not legal at start time can forfeit after 30 minutes (Rule 5); games with a non-member are forfeited (Rule 8).
- Rescheduled games can be played on a different date than scheduled (Rule 11A). Played date can differ from scheduled date.
- No tiebreaker games are ever played.
- For the Mansfield event, unplayed games are *not* counted as losses mid-season; the one-full-game rule exists precisely because game counts differ.

## 7. Open questions (need a human answer)

1. **Are the 2022-23 playoff spot counts and the draw-shot deadline still the rules for 2026-27?** The document is dated 2022.
2. **Where does the first half end this season?** The old site hardcoded week 9 of 18. This season Tuesday has 20 weeks. The break week comes from the schedule, not a default.
3. **Do we need to record forfeits?** In particular, a double forfeit for an unmarked game. If yes, the games table needs a result type beyond "winner or null".
4. **Is a team ever "clinched" or "eliminated" before the halves end?** The rules only describe determination at the end of each half; the site should label in-progress badges as "currently leading", not as qualified.
5. **Event wild card fairness across shifts**: the rules assume equal games played, plus or minus one. Special circumstances (weather) are handled by the Games Committee, which the site cannot know about.
