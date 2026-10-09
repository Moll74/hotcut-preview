# Hot Cut website: how prices work

**All prices live in `data/prices.json`. Never type a price into a page.**

Pages and scripts contain placeholders where a price belongs, for example `{{p:dameklip}}` or
`{{p:balayage_toning}}`. The build fills them in, formatted for the page language
(`1.450` on Danish pages, `1,450` on English pages).

| You want to | Do this |
|---|---|
| Change a price | Edit its `"kr"` value in `data/prices.json`. Every page, the price list, the FAQ, the assistant and the schema data update. |
| Mention a price in new text | Write the placeholder: `Herreklip koster {{p:herreklip}} kr` / `A men's cut costs DKK {{p:herreklip}}`. |
| Put a price in schema data (`"price": "…"`) | Use the plain form: `"price": "{{p:herreklip:raw}}"`. |
| Add a new treatment | Add a key to `data/prices.json` (with `kr`, `da`, `en`), then use `{{p:new_key}}`. |
| Preview locally | `python3 tools/build.py`, then open `_site/index.html`. |

`python3 tools/build.py --check` fails if a page contains a price typed as a number
(`395 kr`, `DKK 395`, `"price": "395"`), or a placeholder whose key is missing from the data file.
The same check runs on every pull request.

Publishing: every push to `main` runs `.github/workflows/deploy.yml`, which builds the site and
publishes `_site/` to GitHub Pages. The repository files themselves are not the published site.

Notes
- "fra"-prices in menus point to the cheapest variant (e.g. "Børn fra" = `boern_0_3`). If the order
  of prices inside a group changes, check those menu lines.
- `{{p:analyse_rabat_pct}}` is calculated: analysis price ÷ purchase threshold (`analyse_graense`).
- Opening hours are still written directly in the pages.
