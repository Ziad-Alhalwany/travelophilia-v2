# Chat Summary: TP-OTA-HOME-FIX-011

## What was discussed

- **Visual Regression**: Addressed the layout shifts in the Home page hero section caused by the lack of config mappings in Tailwind v4 for legacy custom classes (specifically `text-accent-strong` and arbitrary spacings/sizes).
- **Arbitrary Value Ban**: Cleanly aligned `Home.jsx` with the strict system guardrail prohibiting inline arbitrary classes (such as `max-w-[560px]`, `to-[#00d8c0]`, etc.).
- **Build Stabilization**: Ensured the compilation completes successfully after mapping layout classes to theme variables.

## Decisions made

- **CSS Theme Mapping**: Added legacy variables and hero layout tokens to `@theme inline` in `src/styles.css`:
  - `--color-accent-strong: var(--accent-strong);`
  - `--tracking-premium: 0.16em;`
  - `--text-hero: 2.6rem;`
  - `--leading-hero: 1.1;`
  - `--max-width-hero: 560px;`
  - `--max-width-hero-p: 90%;`
  - `--max-width-card-featured: 340px;`
  - `--height-skeleton: 380px;`
  - `--min-height-hero: 80vh;`
  - `--shadow-primary-btn`, `--shadow-primary-btn-hover`
- **Home Page Refactoring**: Cleaned `src/pages/Home.jsx` to use these semantic Tailwind classes instead of raw arbitrary properties.
- **Flawless Smoke Build**: Production build succeeded cleanly in both the main worktree and the release worktree, compiling 2889 modules with zero errors.

## Open questions

- None.

## Related report

- [2026-06-07_RELEASE_Home_Layout_Fix.md](../../reports/_runs/2026-06-07_RELEASE_Home_Layout_Fix.md)

## Proposed Commit Message

`fix(theme): map legacy config classes and resolve visual regression on home page hero (agent:release)`
