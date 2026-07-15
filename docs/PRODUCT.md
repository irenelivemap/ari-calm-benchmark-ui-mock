# Product

## Register

product

## Users

- Internal route researchers and routing engineers collecting structured comparison data.
- Product and design teammates evaluating the benchmark experience.
- External participants comparing routes without needing prior ARI context.

All participants use the same comparison flow and produce records with the same validity rules.

## Product Purpose

This prototype tests whether people prefer or trust one walking route over another while keeping provider identity hidden.

The current benchmark family includes:

- **Fast vs Calm**, which asks which route better fits a calm walk.
- **Fast vs Google Fast**, which asks which route works better as a fast route.
- **Fast vs Safe**, planned but not yet implemented.

Success means a participant can start or resume a session, inspect both routes, use Street View only when necessary, answer with minimal friction, and produce a record that can be decoded reliably by research and engineering.

## Primary Task

Compare Route A and Route B on the map, choose the answer that fits the current challenge, and explain relevant issues when asked.

The map is the primary decision surface. Questions, progress, medals, and results must support comparisons rather than compete with them.

## Product Principles

- **Blind but understandable**: testers know the decision they are making but not which provider produced each visible route.
- **Map first**: route visibility, pan, zoom, fit, and optional Street View are core to the task.
- **Low friction**: no unnecessary clicks, repeated explanations, or forced detours before the next comparison.
- **Resumable**: leaving and returning must preserve the same session, pair, assignment, question step, and partial answer.
- **Motivating, not coercive**: medals and community results encourage more comparisons without changing answer semantics.
- **One data foundation**: internal and external participants produce equivalent records.
- **Adapter-driven integration**: real routes, maps, and persistence replace explicit interfaces rather than rewriting the UI.

## Non-goals

- Revealing route providers during active comparisons.
- Building the production routing engine in this repository.
- Storing production research data only in browser local storage.
- Treating the team dashboard as participant navigation.
- Implementing Fast vs Safe before its questions and route contract are defined.

## Brand Personality

Clear, focused, and playful. The map experience uses a restrained arcade language to make repeated comparisons engaging without reducing research credibility.

## Anti-references

Avoid cluttered survey pages, generic dashboards, marketing-style landing sections, hidden map interactions, tiny route previews, repeated explanatory copy, noisy gamification, and anything that makes the comparison feel secondary to the form.

## Accessibility and Inclusion

- Maintain readable contrast and visible focus states.
- Keep controls keyboard operable and touch targets at least 44px.
- Respect reduced-motion preferences.
- Use copy that works for participants outside the ARI team.
- Never rely on orange/green alone to communicate selection or status.
