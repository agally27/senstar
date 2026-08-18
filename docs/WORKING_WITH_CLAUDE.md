# Working with Claude on Senstar

**Status:** Implemented (the GitHub Action) / Planned (the rest — see §5 for what is not set up yet).
**Audience:** the founder, and every Claude session that opens this repository.

`CLAUDE.md` says _what_ Claude must do on this project. This document says _where_ Claude runs and _which surface to reach for_. Where the two disagree, `CLAUDE.md` wins.

---

## 1. The four surfaces

| Surface                    | Reach it from                                            | Has the repo?           | Use it for                                                                                            |
| -------------------------- | -------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------------------------- |
| **Claude Code (local)**    | Terminal on the Mac, in `~/senstar`                      | Yes, your working copy  | Interactive engineering. Fastest loop. The default for real work.                                     |
| **Claude Code on the web** | claude.ai/code, browser or phone                         | Yes, clones it itself   | Work while away from the laptop. Sessions persist when you close the tab and resume on mobile.        |
| **`@claude` in GitHub**    | Any issue or PR comment, including the GitHub mobile app | Yes, via Actions runner | Async, well-scoped asks. "Fix this failing test", "implement the issue below". Replies on the thread. |
| **Cowork session**         | Claude desktop app                                       | No — no repo access     | Research, decision briefs, documents. Not for building.                                               |

**Rule of thumb:** if the output is a commit, use one of the first three. If the output is a decision or a document, Cowork is fine.

### Why not just use one

Local is fastest but needs you at the machine. Web is the only one that runs without your laptop and lets you answer Claude's questions from a phone. GitHub Actions is the only one that triggers from a comment, which makes it the right tool when the request is already written down as an issue. They share the same repo and the same `CLAUDE.md`, so switching between them costs nothing.

## 2. Triggering `@claude` in GitHub

Comment on any issue or PR:

```
@claude implement the email gateway described in ADR-0009,
following the packages/jobs pattern for the memory implementation.
```

Claude replies in the thread and updates its comment as it works. It can read CI results, push to a branch, and open a PR.

Constraints worth knowing, all enforced by the action rather than by our workflow file:

- Only users with **write access** to the repository can trigger a run. Bot actors are rejected, which is what stops trigger loops.
- `@claude` must appear as a whole word. `/claude` and `@claude-bot` do not trigger it.
- The workflow caps each run at **40 turns and 30 minutes**, and queues rather than parallelises runs on the same thread. Both are cost guardrails; raise them in `.github/workflows/claude.yml` when a task genuinely needs it rather than leaving them off.

The workflow installs dependencies and starts Postgres 16 before handing over, mirroring `ci.yml` — so Claude can run `pnpm typecheck && pnpm lint && pnpm format && pnpm test` and verify its own work rather than guessing.

## 3. Rules that bind every surface

These restate `CLAUDE.md` and `docs/DEVELOPMENT_RULES.md` because they are the ones most easily lost when work moves between surfaces.

1. **Read `DECISIONS.md` first.** Open items are DECISION REQUIRED and are **never** resolved by implementation. Discovering a needed-but-unmade decision means stop and ask — not pick the sensible default and carry on.
2. **No feature work while the foundation is incomplete.** See `docs/foundation/01-FOUNDATION_PLAN.md`, Stages A–E, and the current audit in `docs/foundation/`.
3. **Branch, never push to `main`.** CI green is the definition of mergeable; "works locally" is an anecdote.
4. **Provider SDKs live in their gateway package only.** No business logic in UI components or route handlers.
5. **Authorisation ships with allow _and_ deny tests.** Migrations, authz and safeguarding-relevant code never land without tests in the same change.
6. **Synthetic data only.** No real child data anywhere before the D10 gate (ICO registration + DPIA).
7. **Documentation describes reality.** Every capability claim carries a state: Planned / Designed / Implemented / Tested / Production-ready. A claim without one is a defect.

A Claude session that cannot satisfy one of these should say so in its reply and stop, rather than working around it.

## 4. Answering Claude's questions when you are away

- **Web sessions**: questions appear in the session; answer from the Claude mobile app.
- **GitHub Actions**: Claude replies on the issue or PR thread; answer with another comment.
- **Local sessions**: run `claude --remote-control`, then enable _Push when actions required_ via `/config`. You get a push notification when Claude needs a decision and can answer from your phone while the work continues on the Mac. The Mac has to stay awake.

## 5. Setup state

| Item                                        | State                                                                                                                                 |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Claude GitHub App installed on `agally27`   | Done — read/write, all repositories                                                                                                   |
| `.github/workflows/claude.yml`              | In this repository                                                                                                                    |
| `CLAUDE_CODE_OAUTH_TOKEN` repository secret | **Not set** — run `claude setup-token` locally, add it under Settings → Secrets and variables → Actions                               |
| Branch protection on `main`                 | **Enabled** 2026-08-18 — PR required, `ci` must pass, branch up to date before merge, no force-push, no deletion, **admins included** |
| `DECISIONS.md` in the repository            | **Not present** — currently lives only in the Claude project, so rule 1 above cannot be satisfied from the repo alone                 |

Branch protection is now enforced. The repository was made public on 2026-08-18, which lifts the GitHub Pro gate on protected branches. Rule 3 in §3 ("branch, never push to `main`") is now a mechanism rather than a convention: `main` takes changes only through a pull request with `ci` green, and **admins are included**, so a session running under the founder's own token cannot bypass it either.

`DECISIONS.md` remains the open item. Without it, every session is told to read a file that does not exist and proceeds without knowing which decisions are open — precisely the failure mode the register exists to prevent.

**The repository is public.** Everything here — the constitutions, `SAFEGUARDING.md`, `SECURITY_AND_PRIVACY.md`, `MULTI_TENANCY.md`, and every ADR — is world-readable, including ADRs describing controls that are designed but not yet implemented. Two consequences worth holding: security gaps recorded in the open (ADR-0009 in particular) should be closed promptly rather than left standing, and anyone can comment `@claude` on an issue. The action only runs for users with **write access** and rejects bot actors, which is what prevents a stranger from driving it — do not weaken `allowed_bots` on a public repository.

## 6. Cost

Each `@claude` run consumes GitHub Actions minutes and either subscription credits (OAuth token) or API tokens (API key). At this project's size, expect single-digit dollars a month for moderate use. Clear, specific requests cost less than vague ones, because Claude needs fewer turns. Keeping `CLAUDE.md` concise also helps — it is read on every run.

---

**References:** [GitHub Actions](https://code.claude.com/docs/en/github-actions.md) · [Claude Code on the web](https://code.claude.com/docs/en/claude-code-on-the-web.md) · [Remote Control](https://code.claude.com/docs/en/remote-control.md)
