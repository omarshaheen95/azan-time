"""Records the spoken reminder and announcement clips (Afnon's tools/fetch-announce.sh) into
src-tauri/resources/announce/<lang>/<clip>.mp3 with Microsoft neural voices through edge-tts.

    python -m pip install edge-tts
    python tools/announce.py            # all languages; existing clips are kept
    python tools/announce.py --force    # record again
"""
import asyncio
import pathlib
import sys

import edge_tts

VOICES = {'ar': 'ar-EG-SalmaNeural', 'en': 'en-US-AriaNeural', 'es': 'es-MX-DaliaNeural', 'pt': 'pt-BR-FranciscaNeural'}
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'src-tauri' / 'resources' / 'announce'


async def main(force: bool) -> None:
    for line in (ROOT / 'tools' / 'announce-lines.tsv').read_text(encoding='utf-8').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        lang, clip, text = line.split('\t')
        dest = OUT / lang / f'{clip}.mp3'
        if dest.exists() and not force:
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        await edge_tts.Communicate(text, VOICES[lang], rate='-5%').save(str(dest))
        print(dest.relative_to(ROOT))


asyncio.run(main('--force' in sys.argv))
