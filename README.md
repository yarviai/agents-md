# agents.md for stores

A small, open format a store publishes at `/agents.md` so AI shopping agents can read the facts they otherwise
guess at: returns, shipping, sizing, ingredients, and whether the store has an endpoint built for agents.

- **Spec:** [SPEC.md](SPEC.md) (v0.2, draft for public comment). Also at [agents-md.org](https://agents-md.org).
- **Validator:** [validator/](validator/), a Node CLI that checks a file or a live store.
- **Examples:** [examples/](examples/), three complete files (olive oil, skincare, apparel) for fictional brands.
- **Hosted validator:** [yarvi.ai/validate](https://yarvi.ai/validate).

## Why a store would bother

Shopify already serves a default `/agents.md` on most storefronts. In Yarvi's census of 403 Shopify stores
(October 2026), 309 served that default unchanged and 25 had customized it. The default says nothing about the
store itself. A v0.2 file keeps the Markdown body agents already read and adds a front matter block with the
store's actual policies, in fields a program can check.

No AI shopping agent has announced support for these fields yet. The body works with any agent that reads the
file today; the fields are there so agents have something consistent to adopt.

## Validate a file

```bash
cd validator && npm install
node src/cli.js check ../examples/olive-oil.md
node src/cli.js check hillside-olive.example        # fetches https://<domain>/agents.md
node src/cli.js check ../examples/apparel.md --json # machine-readable result
```

Exit code 0 means valid, 1 means errors were found, 2 means the file couldn't be read.

The scorecard: a file with any error scores 0. Otherwise the score is 50, plus up to 50 for how many of the
spec's fields are present, minus 3 per warning.

## Not the coding-agent AGENTS.md

`AGENTS.md` in a software repository tells coding agents how to work in that codebase. This format is for
stores and shopping agents. Same filename, different job.

## Contributing

Open an issue to propose a field. Include who would publish it, which agent behavior it changes, and an
example value. Changes to stable fields follow the deprecation policy in SPEC.md, section 6.

## License

MIT. See [LICENSE](LICENSE).
