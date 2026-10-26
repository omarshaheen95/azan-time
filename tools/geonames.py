"""Builds src/lib/places.json, the city search's data, from GeoNames (CC BY 4.0, credited in THIRD_PARTY.md):
every place of 15,000 people or more, with its region and time zone. Latin America and the Caribbean also get the
places of 5,000 or more, the app's audience living in many small towns (Foz do Iguaçu's neighbours, Maicao...).

    python tools/geonames.py <folder with cities15000.txt, cities5000.txt and admin1CodesASCII.txt>

from https://download.geonames.org/export/dump/ (unzipped). Rows: [name, country code, region, lat, lng, tz, population].
"""
import json
import pathlib
import sys

LATAM = set('AR BO BR CL CO CR CU DO EC GT GY HN HT JM MX NI PA PE PR PY SR SV TT UY VE BZ BS BB GF'.split())
src = pathlib.Path(sys.argv[1])
out = pathlib.Path(__file__).resolve().parent.parent / 'src' / 'lib' / 'places.json'

admin1 = {}
for line in (src / 'admin1CodesASCII.txt').read_text(encoding='utf-8').splitlines():
    code, name, *_ = line.split('\t')
    admin1[code] = name


def rows(path, keep):
    for line in path.read_text(encoding='utf-8').splitlines():
        f = line.split('\t')
        country, population = f[8], int(f[14] or 0)
        if not keep(country, population):
            continue
        yield f[0], [f[1], country, admin1.get(f'{country}.{f[10]}', ''), round(float(f[4]), 4), round(float(f[5]), 4),
                     f[17], population]


places = dict(rows(src / 'cities15000.txt', lambda c, p: True))
places.update(rows(src / 'cities5000.txt', lambda c, p: c in LATAM))
data = sorted(places.values(), key=lambda r: -r[6])
out.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
print(f'{len(data)} places, {out.stat().st_size // 1024} KB -> {out}')
