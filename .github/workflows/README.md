# Workflows

| Workflow | Runs on | What it does |
| --- | --- | --- |
| [`deploy.yml`](deploy.yml) | Push to `main`, by hand, a `themes-release`, `scenes-release` or `games-release` repository dispatch and once a day | Syncs the newest Zacess Themes, Zacess Scenes and Zacess Games releases with `--strict`, so a failed sync stops the run rather than deploying an old copy. Then it runs `astro check`, builds, verifies the built site and deploys it to Cloudflare. A dispatch carries the new tag in `client_payload.tag`: the run summary names it and the matching sync uses that tag rather than waiting for the tags list to catch up. The daily run compares the built `/themes/version.txt`, `/scenes/version.txt` and `/games/version.txt` with the live site and deploys only when one of them differs, so it catches a release whose dispatch was not sent |

A dispatch is sent with a token that can write to this repository, for example:

```sh
gh api repos/zacesshq/website/dispatches -f event_type=games-release -f 'client_payload[tag]=v0.1.0'
```

The deploy needs the `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets and reads
the `PUBLIC_CF_BEACON_TOKEN` variable. Every action is pinned to a full commit SHA with its version in
a comment.
