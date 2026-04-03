# Stellar Docs

The Docusaurus documentation site for the Stellar interplanetary voyage booking system. Contains both technical documentation for developers and lore documentation for the Solara system.

## Running Locally

```bash
cd docs
pnpm install
pnpm start
```

Opens at [http://localhost:3000](http://localhost:3000).

## Structure

```
docs/
├── docs/
│   ├── technical/          # Architecture, services, frontend, testing
│   ├── system/             # Planets, moons, fleet, route map
│   └── voyages/            # How voyages work, scheduling, options
├── src/css/custom.css      # Dark space theme
├── docusaurus.config.js    # Site config
└── sidebars.js             # Navigation structure
```

## What to Copy From This Conversation

The following sections of the Docusaurus site draw directly from content developed during project planning and can be treated as stable:

**System lore** (`docs/system/`) — The planet descriptions, moon overviews, ship class lore, and route map content were all developed during the world-building phase. If you refine the lore (names, populations, orbital periods), update `system.json` for numbers and `src/lib/planetData.ts` / `src/lib/fleetData.ts` for narrative text, then update the corresponding docs pages.

**Voyage mechanics** (`docs/voyages/`) — The orbital window rating thresholds, pricing multipliers, route type characteristics, cryo option pricing, and scheduling model are all sourced directly from `system.json`. If you change those values in config, update the tables in these docs pages to match.

**Technical docs** (`docs/technical/`) — These describe the implementation as built. They should be updated whenever the architecture changes.

## Deploying

Build for production:

```bash
pnpm build
pnpm serve  # preview the production build locally
```

The Docusaurus build output is in `docs/build/`. It can be deployed to Vercel, Netlify, or GitHub Pages as a static site, separately from the main frontend application.
