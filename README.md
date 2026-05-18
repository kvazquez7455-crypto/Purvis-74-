# Purvi Indies Agent

Purvi Indies Agent is a local-first agent runner that lets you bundle a large task into a single OpenAI planning call, then run the resulting plan from your own terminal, workspace, or macOS automation helpers.

The app is intentionally minimal: it uses Node.js built-ins only, stores logs locally, and treats **one `purvi run` request as one planning credit**. Local checks, templates, health monitoring, and macOS helpers do not call the model.

## What this gives you now

- A `purvi` CLI for task planning, health checks, templates, and macOS helper actions.
- A local browser app at `http://localhost:4737`.
- A one-command/one-credit rule enforced by the planner: one `purvi run` call makes at most one OpenAI Responses API request.
- Offline dry-run mode for planning without spending credits.
- A local credit ledger in `~/.purvi-indies/credit-ledger.jsonl`.
- Self-monitoring health output and JSONL logs in `~/.purvi-indies/logs`.
- macOS helpers for focusing apps, typing text, and sending hotkeys through AppleScript.

## Install and run

```bash
npm install
npm link
purvi help
```

For model-backed planning:

```bash
export OPENAI_API_KEY="your_api_key"
purvi run "inspect this project, fix the failing test, and summarize changes" --template code
```

For no-credit offline planning:

```bash
purvi run "build a landing page template" --template app --dry-run
```

Start the local web app:

```bash
npm start
```

## macOS automation setup

Apple requires explicit permission before terminal tools can control other apps.

1. Open **System Settings > Privacy & Security > Accessibility**.
2. Allow Terminal, iTerm, or your packaged Purvi runner.
3. Try:

```bash
purvi mac focus "Safari"
purvi mac type "Hello from Purvi"
purvi mac hotkey c command down
```

These helpers are intentionally small and reviewable. They do not bypass macOS privacy permissions and they do not grant themselves access.

## Command reference

```bash
purvi run "task" [--template code|app|mac|business] [--model MODEL] [--dry-run]
purvi templates
purvi health
purvi credits
purvi config set <key> <value>
purvi mac setup
purvi mac focus "App Name"
purvi mac type "text"
purvi mac hotkey <key> [modifier ...]
```

## Credit rule

The app separates expensive model planning from free local execution:

- `purvi run` with an API key: one OpenAI Responses API request, recorded as one local planning credit.
- `purvi run --dry-run`: zero OpenAI requests.
- `purvi templates`, `purvi health`, `purvi credits`, and `purvi mac ...`: zero OpenAI requests.

OpenAI billing is still controlled by your OpenAI account and selected model. This project can minimize calls, but it cannot change OpenAI's actual billing rules.

## Project structure

```text
src/cli.js             CLI entrypoint
src/server.js          Local web app and JSON API
src/agent.js           One-call task bundler and fallback planner
src/openaiClient.js    Responses API client
src/macAutomation.js   macOS AppleScript helpers
src/logger.js          Self-monitoring logs and local credit ledger
src/templates.js       Agent task templates
src/config.js          Local configuration
```

## Safety notes

- Review any generated command before running it.
- Keep secrets in environment variables, never in prompts or files.
- macOS automation only works after you grant Accessibility permission.
- The app does not clone or copy any private external agent unless you provide legal access and a repository URL.
