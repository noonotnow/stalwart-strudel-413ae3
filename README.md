# stalwart-strudel-413ae3 — retired

This repository no longer deploys anything. It previously served two
unrelated public interfaces from one repo, disambiguated only by
per-Netlify-site dashboard "Base directory" settings that were invisible
from the repo itself. That hidden-glue setup caused a real misdeployment
(the apex domain briefly served the wrong app's legacy page). It has been
split into one repository per deployable, each with its own root, build
config, and README:

- **Fandom / Vibe Atlas** (`fandom.justlikekatie.com`) is now
  [`noonotnow/fandom-justlikekatie-com`](https://github.com/noonotnow/fandom-justlikekatie-com).
  Includes the React app, all Netlify Functions (search/ranking, the
  Send-to-PLAN producer, and the PLAN editorial-view proxy).
- **Apex coming-soon page** (`justlikekatie.com`) is now
  [`noonotnow/justlikekatie-com`](https://github.com/noonotnow/justlikekatie-com).

See `MIGRATION_NOTES.md` in each of those repos (as `MIGRATION.md`) for
exact provenance: source commit, paths carried over, and what was
intentionally left behind (the legacy root `index.html` static bundle,
superseded by `phase0` long before this split and not carried into either
successor repo).

This repository is kept, archived, as the historical record and for git
blame/authorship on anything not obvious from the successor repos' shorter
histories. It is not expected to receive further commits.
