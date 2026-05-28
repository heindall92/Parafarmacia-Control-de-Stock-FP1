# Graph Report - farmacia-stock  (2026-05-29)

## Corpus Check
- 40 files · ~222,408 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 734 nodes · 1046 edges · 92 communities (91 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ee5b67d8`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]
- [[_COMMUNITY_Community 61|Community 61]]
- [[_COMMUNITY_Community 62|Community 62]]
- [[_COMMUNITY_Community 63|Community 63]]
- [[_COMMUNITY_Community 64|Community 64]]
- [[_COMMUNITY_Community 65|Community 65]]
- [[_COMMUNITY_Community 66|Community 66]]
- [[_COMMUNITY_Community 67|Community 67]]
- [[_COMMUNITY_Community 68|Community 68]]
- [[_COMMUNITY_Community 69|Community 69]]
- [[_COMMUNITY_Community 70|Community 70]]
- [[_COMMUNITY_Community 71|Community 71]]
- [[_COMMUNITY_Community 72|Community 72]]
- [[_COMMUNITY_Community 73|Community 73]]
- [[_COMMUNITY_Community 74|Community 74]]
- [[_COMMUNITY_Community 75|Community 75]]
- [[_COMMUNITY_Community 76|Community 76]]
- [[_COMMUNITY_Community 77|Community 77]]
- [[_COMMUNITY_Community 78|Community 78]]
- [[_COMMUNITY_Community 79|Community 79]]
- [[_COMMUNITY_Community 80|Community 80]]
- [[_COMMUNITY_Community 81|Community 81]]
- [[_COMMUNITY_Community 82|Community 82]]
- [[_COMMUNITY_Community 83|Community 83]]
- [[_COMMUNITY_Community 84|Community 84]]
- [[_COMMUNITY_Community 85|Community 85]]
- [[_COMMUNITY_Community 86|Community 86]]

## God Nodes (most connected - your core abstractions)
1. `allow` - 76 edges
2. `deny` - 76 edges
3. `permissions` - 31 edges
4. `permissions` - 30 edges
5. `getDb()` - 26 edges
6. `compilerOptions` - 18 edges
7. `scripts` - 11 edges
8. `Producto` - 11 edges
9. `permissions` - 11 edges
10. `permissions` - 9 edges

## Surprising Connections (you probably didn't know these)
- `App()` --calls--> `useAppBootstrap()`  [EXTRACTED]
  src/App.tsx → src/hooks/useAppBootstrap.ts
- `App()` --calls--> `useMorphTransition()`  [EXTRACTED]
  src/App.tsx → src/hooks/useMorphTransition.ts
- `App()` --calls--> `getSeedStats()`  [EXTRACTED]
  src/App.tsx → src/lib/database.ts
- `ThemeToggle()` --calls--> `useTheme()`  [EXTRACTED]
  src/components/ThemeToggle.tsx → src/context/ThemeContext.tsx

## Communities (92 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (68): AuroraBackground(), AuroraBackgroundProps, CategoriasView(), CategoriasViewProps, COLOR_PRESETS, EstantesView(), EstantesViewProps, InventarioView() (+60 more)

### Community 1 - "Community 1"
Cohesion: 0.05
Nodes (44): commands, description, identifier, commands, description, identifier, commands, description (+36 more)

### Community 2 - "Community 2"
Cohesion: 0.06
Nodes (36): commands, description, identifier, commands, description, identifier, commands, description (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (30): dependencies, lucide-react, react, react-dom, @tauri-apps/api, @tauri-apps/plugin-sql, devDependencies, tailwindcss (+22 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (28): app, security, windows, build, beforeBuildCommand, beforeDevCommand, devUrl, frontendDist (+20 more)

### Community 5 - "Community 5"
Cohesion: 0.11
Nodes (20): Header(), HeaderProps, mainNav, NavItem, settingsNav, Sidebar(), SidebarProps, ThemeToggle() (+12 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules, jsx, lib, module, moduleResolution (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.19
Nodes (16): core, core:app, default_permission, global_scope_schema, permission_sets, default_permission, default_permission, global_scope_schema (+8 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (15): definitions, Identifier, Number, PermissionEntry, Target, Value, oneOf, anyOf (+7 more)

### Community 9 - "Community 9"
Cohesion: 0.13
Nodes (15): definitions, Identifier, Number, PermissionEntry, Target, Value, oneOf, anyOf (+7 more)

### Community 10 - "Community 10"
Cohesion: 0.27
Nodes (12): bool, DataFrame, Path, build_seed(), find_excel(), is_header(), main(), normalize() (+4 more)

### Community 11 - "Community 11"
Cohesion: 0.18
Nodes (10): ✨ Características Principales, code:bash (git clone https://github.com/heindall92/Parafarmacia-Control), code:bash (npm install), code:bash (npx prisma generate), code:bash (npm run dev), 🎥 Demo del Proyecto, 🛠️ Instalación y Despliegue, 🏥 Parafarmacia - Control de Stock (+2 more)

### Community 12 - "Community 12"
Cohesion: 0.18
Nodes (11): description, properties, required, type, Capability, description, type, identifier (+3 more)

### Community 13 - "Community 13"
Cohesion: 0.18
Nodes (11): description, properties, required, type, Capability, description, type, identifier (+3 more)

### Community 14 - "Community 14"
Cohesion: 0.20
Nodes (10): commands, commands, description, identifier, commands, description, identifier, allow (+2 more)

### Community 15 - "Community 15"
Cohesion: 0.20
Nodes (10): $ref, description, items, type, uniqueItems, description, items, type (+2 more)

### Community 16 - "Community 16"
Cohesion: 0.20
Nodes (10): type, webviews, windows, items, description, items, type, description (+2 more)

### Community 17 - "Community 17"
Cohesion: 0.20
Nodes (10): $ref, description, items, type, uniqueItems, description, items, type (+2 more)

### Community 18 - "Community 18"
Cohesion: 0.20
Nodes (10): type, webviews, windows, items, description, items, type, description (+2 more)

### Community 19 - "Community 19"
Cohesion: 0.22
Nodes (9): commands, description, identifier, commands, description, identifier, deny, allow-is-checked (+1 more)

### Community 20 - "Community 20"
Cohesion: 0.22
Nodes (8): categorias, estantes, productos, source, stats, categorias, estantes, productos

### Community 21 - "Community 21"
Cohesion: 0.22
Nodes (8): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, strict, include

### Community 22 - "Community 22"
Cohesion: 0.29
Nodes (6): buildMonthGrid(), CalendarWidget(), CalendarWidgetProps, DayCell, MONTHS, WEEKDAYS

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (8): description, identifier, permissions, commands, description, identifier, allow-app-show, deny-version

### Community 24 - "Community 24"
Cohesion: 0.25
Nodes (8): description, properties, required, type, CapabilityRemote, urls, description, type

### Community 25 - "Community 25"
Cohesion: 0.25
Nodes (8): description, properties, required, type, CapabilityRemote, urls, description, type

### Community 26 - "Community 26"
Cohesion: 0.29
Nodes (6): default, description, identifier, local, permissions, windows

### Community 27 - "Community 27"
Cohesion: 0.33
Nodes (5): description, identifier, permissions, $schema, windows

### Community 28 - "Community 28"
Cohesion: 0.40
Nodes (5): commands, description, identifier, permissions, allow-is-enabled

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (4): anyOf, description, $schema, title

### Community 30 - "Community 30"
Cohesion: 0.40
Nodes (4): anyOf, description, $schema, title

### Community 31 - "Community 31"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-bundle-type

### Community 32 - "Community 32"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-default-window-icon

### Community 33 - "Community 33"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-identifier

### Community 34 - "Community 34"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-register-listener

### Community 35 - "Community 35"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-remove-data-store

### Community 36 - "Community 36"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-app-theme

### Community 37 - "Community 37"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-tauri-version

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-version

### Community 39 - "Community 39"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-fetch-data-store-identifiers

### Community 40 - "Community 40"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-remove-data-store

### Community 41 - "Community 41"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-set-dock-visibility

### Community 42 - "Community 42"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-tauri-version

### Community 43 - "Community 43"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-app-hide

### Community 44 - "Community 44"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-fetch-data-store-identifiers

### Community 45 - "Community 45"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-name

### Community 46 - "Community 46"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-remove-listener

### Community 47 - "Community 47"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-dock-visibility

### Community 48 - "Community 48"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-app-hide

### Community 49 - "Community 49"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-app-show

### Community 50 - "Community 50"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-bundle-type

### Community 51 - "Community 51"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-default-window-icon

### Community 52 - "Community 52"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-identifier

### Community 53 - "Community 53"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-name

### Community 54 - "Community 54"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-register-listener

### Community 55 - "Community 55"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-remove-listener

### Community 56 - "Community 56"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-set-app-theme

### Community 57 - "Community 57"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-supports-multiple-windows

### Community 58 - "Community 58"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-remove

### Community 59 - "Community 59"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-create-default

### Community 60 - "Community 60"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-prepend

### Community 61 - "Community 61"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-accelerator

### Community 62 - "Community 62"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-as-window-menu

### Community 63 - "Community 63"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-append

### Community 64 - "Community 64"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-get

### Community 65 - "Community 65"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-insert

### Community 66 - "Community 66"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-items

### Community 67 - "Community 67"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-popup

### Community 68 - "Community 68"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-remove-at

### Community 69 - "Community 69"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-as-app-menu

### Community 70 - "Community 70"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-as-help-menu-for-nsapp

### Community 71 - "Community 71"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-as-windows-menu-for-nsapp

### Community 72 - "Community 72"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-checked

### Community 73 - "Community 73"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-enabled

### Community 74 - "Community 74"
Cohesion: 0.50
Nodes (4): commands, description, identifier, allow-set-text

### Community 75 - "Community 75"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-append

### Community 76 - "Community 76"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-create-default

### Community 77 - "Community 77"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-get

### Community 78 - "Community 78"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-insert

### Community 79 - "Community 79"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-is-checked

### Community 80 - "Community 80"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-is-enabled

### Community 81 - "Community 81"
Cohesion: 0.50
Nodes (4): commands, description, identifier, deny-items

### Community 82 - "Community 82"
Cohesion: 0.50
Nodes (4): default, description, type, local

### Community 83 - "Community 83"
Cohesion: 0.50
Nodes (4): default, description, type, description

### Community 84 - "Community 84"
Cohesion: 0.50
Nodes (4): default, description, type, local

### Community 85 - "Community 85"
Cohesion: 0.50
Nodes (4): default, description, type, description

## Knowledge Gaps
- **373 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+368 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `allow` connect `Community 14` to `Community 1`, `Community 2`, `Community 19`, `Community 23`, `Community 28`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `deny` connect `Community 19` to `Community 1`, `Community 2`, `Community 14`, `Community 23`, `Community 28`, `Community 31`, `Community 32`, `Community 33`, `Community 34`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`, `Community 48`, `Community 49`, `Community 50`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`?**
  _High betweenness centrality (0.068) - this node is a cross-community bridge._
- **Why does `permissions` connect `Community 28` to `Community 1`, `Community 7`, `Community 14`, `Community 19`, `Community 58`, `Community 59`, `Community 60`, `Community 61`, `Community 62`, `Community 63`, `Community 64`, `Community 65`, `Community 66`, `Community 67`, `Community 68`, `Community 69`, `Community 70`, `Community 71`, `Community 72`, `Community 73`, `Community 74`, `Community 75`, `Community 76`, `Community 77`, `Community 78`, `Community 79`, `Community 80`, `Community 81`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _374 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.061122538936232734 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.045454545454545456 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._