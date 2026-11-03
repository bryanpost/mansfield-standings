# Rules the standings engine implements

Source: **pages 5-7** of `2026-27/MCC_League_Guidelines.pdf` ("Determination of
Mansfield Event Playoff Participants", dated 2022-23). These are the only pages
that apply to the Mansfield event. Pages 1-4 (general event rules and the
tiebreakers for other events) are kept for reference but are not used by the
engine. The league confirmed these rules are current for 2025-26 and 2026-27.

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
- Deadline: the completion of the final game of the first half for the team's shift.
- Stored as text: a number, `X`, or null (not yet recorded). Null and X rank the same.

## 6. Decided scope

- **Forfeits are not modelled.** Decided by the site owner: any team in contention marks all of its games, so every game ends with exactly one winner. To be raised with the league chairs at the end of 2026-27.
- Unplayed games are *not* counted as losses; the one-full-game rule exists because game counts differ.
- No tiebreaker games are played.

## 7. Checked against the current engine (Nov 2026)

`tests/engine-rules.test.js` runs the engine against this document: the 9-0 / 8-0 / 8-1
worked example (both branches), the "tied within half a game" rule, "12-6 does not
beat 11-6", criteria order for half winners / shift wild cards / event wild cards
(including no head-to-head for event wild cards), draw-shot ranking (X and blank
rank below 72"), "one tie is not all tie", and the 28 playoff spots. **All pass.**
The tiebreaker logic itself is correct.

Gaps the document does not settle, found while testing:

1. **Berths are shown before they are decided** (decided: see section 8, item 1). The engine awards every berth from day one, using the first-listed team when everyone is tied. After one game it already shows a second-half berth for a team that lost its only game. The rules only decide berths at the end of each half.
2. **Coin flips are hidden.** When criteria run out the engine silently picks the first team instead of saying a coin flip is needed.
3. **Wednesday Late boundary games.** With a different break week per team, a game in the boundary week counts in the first half for one team and the second half for the other, so the half head-to-head is lopsided (the winner shows 1-0, the loser 0-0 instead of 0-1). This can change who wins a half head-to-head when that game is the only meeting.
4. **Display order is by win percentage**, which can disagree with the games-behind logic used for berths. Cosmetic.

## 8. Decisions (site owner, Nov 2 2026)

1. **A half is complete when all of its games are played.** Per team: a team's half
   is the games on its own side of its own line (see 3). A berth's *status* is then:
   - **projected**: the half is not complete (or, for wild cards, the regular season is not complete). Show as "currently leading", never as qualified.
   - **provisional**: the half is complete, but the decision used a season-long criterion (overall record or season head-to-head) and at least one team in the contention at that step still has season games left. Tiebreaker 1 is overall record, so a half can be complete while its winner is not settled.
   - **final**: every input is final. A winner who is a full game clear on the half record alone is final as soon as the half is complete.
   - **needs coin flip**: all criteria are exhausted. Say so; never pick a team.
   Draw shots are final once the shift's first half is complete (a blank is then X by rule).
2. **A team can hold only one berth.** Berths are awarded in the order on page 5: first-half winners, first-half runners-up, second-half winners, second-half runners-up, shift wild cards, event wild cards. The engine already does this.
3. **Wednesday Late uses per-team half boundaries in 2026-27**, confirmed by the sheet (`docs/schedules/2026-27/wednesday-late.md`): teams 4-10 end the first half at week 11, everyone else at week 10. Other shifts: from their sheets.

## 9. Open

1. **Head-to-head for a boundary-week game.** Week 11 (1/20) is first half for teams 4-10 and second half for the others, so a game between, say, team 4 and team 12 is in different halves for each. Proposed default: a game counts toward the *half* head-to-head only if it is in the same half for both teams; it always counts toward the *season* head-to-head (criterion 3). Confirm, or ask the league chairs.
2. The first-half end week for the other five shifts (from their sheets).
3. The page 7 draw principles (top four seeds by event-wild-card criteria get byes; teams from one shift kept apart in rounds 1-2) describe the playoff bracket, which this site does not yet build.
