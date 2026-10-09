#!/usr/bin/env python3
"""Build the Hot Cut site: fill every price placeholder from data/prices.json.

    python3 tools/build.py            # writes the finished site to _site/
    python3 tools/build.py --check    # only checks that every placeholder has a price

Pages and scripts contain placeholders such as {{p:dameklip}} where a price belongs.
The build copies the site to _site/ and replaces each placeholder with the price,
formatted for the page's language: 1.450 on Danish pages, 1,450 on English pages.

    {{p:key}}        price, formatted for the page language
    {{p:key:raw}}    plain number for schema data, e.g. 1450
    {{p:min}} / {{p:max}}   lowest / highest price on the list (the schema "priceRange")
    {{p:analyse_rabat_pct}} the analysis price as a percentage of the purchase that cancels it out (25)

To change a price, edit data/prices.json only. Never type a price directly into a page.
"""
import json, pathlib, re, shutil, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / '_site'
SKIP = {'.git', '.github', 'tools', 'data', '_site', 'node_modules'}
TOKEN = re.compile(r'\{\{p:([a-z0-9_]+)(?::(raw|en|da))?\}\}')


def load():
    data = json.loads((ROOT / 'data' / 'prices.json').read_text(encoding='utf-8'))
    prices = {k: int(v['kr']) for k, v in data['prices'].items()}
    listed = [v for k, v in prices.items() if k != 'analyse_graense']   # a purchase threshold, not a price
    prices['min'], prices['max'] = min(listed), max(listed)
    prices['analyse_rabat_pct'] = round(100 * prices['analyse'] / prices['analyse_graense'])
    return prices


def fmt(n, lang):
    return f'{n:,}'.replace(',', '.' if lang == 'da' else ',')


def lang_of(rel):
    return 'en' if rel.parts[0] == 'en' or rel.name.endswith('-en.js') else 'da'


def render(text, lang, prices, missing):
    def sub(m):
        key, mode = m.group(1), m.group(2)
        if key not in prices:
            missing.add(key)
            return m.group(0)
        return str(prices[key]) if mode == 'raw' else fmt(prices[key], mode or lang)
    return TOKEN.sub(sub, text)


LITERAL = re.compile(r'DKK\s?\d|(?<![\d.,])\d{2,3}(?:[.,]\d{3})?\s?(?:kr|kroner)\b|"(?:price|lowPrice)": ?"\d')


def literal_prices():
    """Prices typed straight into a page instead of a placeholder: these would not follow data/prices.json."""
    found = []
    for src in sorted(ROOT.rglob('*')):
        rel = src.relative_to(ROOT)
        if src.suffix not in ('.html', '.js') or SKIP & set(rel.parts) or 'vendor' in rel.parts:
            continue
        for n, line in enumerate(src.read_text(encoding='utf-8').splitlines(), 1):
            for m in LITERAL.finditer(line):
                found.append(f'{rel}:{n}: …{line[max(0, m.start() - 40):m.end() + 10].strip()}…')
    return found


def main():
    check_only = '--check' in sys.argv
    stray = literal_prices()
    if stray:
        print('These prices are typed directly into a page. Replace each with a {{p:key}} placeholder:', *stray[:40], sep='\n  ')
        sys.exit(1)
    prices, missing, count = load(), set(), 0
    if not check_only:
        shutil.rmtree(OUT, ignore_errors=True)
    for src in sorted(ROOT.rglob('*')):
        rel = src.relative_to(ROOT)
        if SKIP & set(rel.parts) or src.is_dir():
            continue
        dst = OUT / rel
        if src.suffix in ('.html', '.js', '.xml', '.txt') and 'vendor' not in rel.parts:
            text = src.read_text(encoding='utf-8')
            count += len(TOKEN.findall(text))
            out = render(text, lang_of(rel), prices, missing)
            if not check_only:
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_text(out, encoding='utf-8')
        elif not check_only:
            dst.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dst)
    if missing:
        sys.exit(f'Unknown price keys in pages: {", ".join(sorted(missing))}. Add them to data/prices.json.')
    print(f'{count} prices filled from data/prices.json' + ('' if check_only else f' -> {OUT.relative_to(ROOT)}/'))


if __name__ == '__main__':
    main()
