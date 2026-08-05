# Current Questionnaire

This document is the canonical product reference for participant-facing question copy. The runtime configuration in `index.html`, conditional rendering in `src/app/calm-benchmark.js`, participant results in `src/results/calm-results.js`, and question-copy tests must stay aligned with it.

Historical answer fields remain readable for data compatibility, but historical question wording must not be presented as current copy.

## Calm Route Comparison

### Q1 — all participants

**Which route would you choose for a calmer walk?**

- Route A
- Route B
- Both work well
- Both work poorly
- I'm not sure

Optional checkbox: **I know a better Calm route**

The first comparison shows this guidance below Q1:

- **Times are estimates. A “+” time shows how much longer that route takes than Fast for the same start and destination.**
- **If both routes work well but you prefer one, choose Route A or Route B. Choose “Both work well” only when you have no preference.**

Later comparisons place the same guidance under **About these choices**.

### Q2 — Route A or Route B selected

**What made you choose Route A?** or **What made you choose Route B?**

- Quieter or less busy streets
- More trees or green space
- More of the route is near water
- Less need to watch for traffic
- Takes less time
- Easier to follow
- I know this route or area better
- Other
- I'm not sure

Participants may select multiple reasons. `I'm not sure` is exclusive. After a reason is selected, **Add details (optional)** appears.

### Q2 — Both work well selected

**What made both routes work well?**

The options and optional-detail behavior are the same as the Route A / Route B Q2.

### Q3 — Route A or Route B selected

**Compared with only seeing Fast, how much does adding Route A improve things for you?**

or

**Compared with only seeing Fast, how much does adding Route B improve things for you?**

- A lot
- Somewhat
- A little
- Not at all
- I'm not sure

After an answer is selected, **Add details (optional)** appears.

### Q3 — Both work well selected

**Compared with only seeing Fast, how much does also having any of these calmer routes improve things for you?**

The options and optional-detail behavior are the same as the Route A / Route B Q3.

### Follow-up — Both work poorly selected

**What made you choose neither route?**

Hint: **Select all that apply to one or both routes.**

- Streets are too busy or noisy
- Not enough trees or green space
- Not enough of the route is near water
- Too much attention needed around traffic
- Takes too long
- Hard to follow
- I know another route I would prefer
- Other
- I'm not sure

Participants may select multiple reasons. `I'm not sure` is exclusive. After a reason is selected, **Add details (optional)** appears.

### I'm not sure selected

There are no follow-up questions.

## Fast vs Google Fast

### Q1 — all participants

**Which route would you prefer in this situation?**

- Route A
- Route B
- Both work well
- Both work poorly
- I'm not sure

### Follow-up — Route A or Route B selected

**What made Route B worse?** when Route A was selected, or **What made Route A worse?** when Route B was selected.

- Takes longer
- Takes an unnecessary detour
- Misses a useful shortcut
- Is hard to follow
- Has difficult street crossings
- Goes through crowded areas
- Misses a more pleasant route
- Part of the route may not be walkable
- Other
- I'm not sure

The participant may select one or more options. `I'm not sure` is exclusive, and **Add details (optional)** appears after a reason is selected.

### Follow-up — Both work poorly selected

**What made both routes poor options?**

- Take too long
- Take an unnecessary detour
- Miss a useful shortcut
- Are hard to follow
- Have difficult street crossings
- Go through crowded areas
- Miss a more pleasant route
- Part of the routes may not be walkable
- Other
- I'm not sure

The participant may select one or more options. `I'm not sure` is exclusive, and **Add details (optional)** appears after a reason is selected.

### Both work well or I'm not sure selected

There are no follow-up questions.
