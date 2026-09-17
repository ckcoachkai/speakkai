"""Generate short, generic cartoon monster reaction sounds for The Hungry Forest.

The ElevenLabs credential is read only from the existing local credentials file.
It is never printed, committed, or embedded in the game. Existing output files
are reused so rerunning this script does not spend credits unnecessarily.
"""
from __future__ import annotations

import hashlib
import json
import os
import subprocess
import urllib.error
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "forest" / "sfx"
MANIFEST_PATH = ROOT / "docs" / "forest-ow-manifest.json"
CREDENTIALS = Path.home() / ".config" / "elevenlabs" / "credentials.env"
MODEL = "eleven_text_to_sound_v2"

PROMPTS = {
    "monster-ow-low": (
        "A short deep generic cartoon monster reaction vocalization: one rounded, "
        "surprised nonverbal 'ow' after a slapstick hit, friendly game sound effect, "
        "no real person imitation, no words, no music, no gore."
    ),
    "monster-ow-mid": (
        "A short dramatic generic cartoon monster reaction vocalization: one raspy "
        "comic 'ow!' after a strong but playful hit, expressive and clean, no real "
        "person imitation, no words, no music, no gore."
    ),
    "monster-ow-high": (
        "A short high energetic generic cartoon monster reaction vocalization: one "
        "surprised squeaky comic 'ow!' after a slapstick hit, family-friendly game "
        "sound effect, no real person imitation, no words, no music, no gore."
    ),
}


def read_key() -> str:
    if not CREDENTIALS.exists():
        raise SystemExit(f"ElevenLabs credentials file is missing: {CREDENTIALS}")
    for raw in CREDENTIALS.read_text(encoding="utf-8-sig").splitlines():
        if raw.startswith("ELEVENLABS_API_KEY="):
            value = raw.split("=", 1)[1].strip().strip("\"'")
            if value:
                return value
    raise SystemExit("ELEVENLABS_API_KEY is not configured in the local credentials file")


def opener() -> urllib.request.OpenerDirector:
    proxy = os.environ.get("ELEVENLABS_PROXY", "http://127.0.0.1:7897")
    return urllib.request.build_opener(urllib.request.ProxyHandler({"https": proxy}))


def generate(name: str, prompt: str, key: str, client: urllib.request.OpenerDirector) -> Path:
    target = OUT / f"{name}.mp3"
    if target.exists() and target.stat().st_size > 1000 and not os.environ.get("FORCE_OW_REGEN"):
        print(f"Reusing {target.name}", flush=True)
        return target

    body = json.dumps(
        {
            "text": prompt,
            "duration_seconds": 0.8,
            "model_id": MODEL,
            "prompt_influence": 0.55,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        "https://api.elevenlabs.io/v1/sound-generation",
        data=body,
        headers={"xi-api-key": key, "Content-Type": "application/json"},
    )
    try:
        with client.open(request, timeout=90) as response:
            raw = response.read()
    except urllib.error.HTTPError as error:
        raise SystemExit(
            f"ElevenLabs SFX generation stopped: HTTP {error.code}. Existing outputs were preserved."
        ) from error
    except urllib.error.URLError as error:
        raise SystemExit(
            f"ElevenLabs SFX generation could not connect: {error.reason}. Existing outputs were preserved."
        ) from error

    temporary = target.with_suffix(".raw.mp3")
    temporary.write_bytes(raw)
    try:
        subprocess.run(
            [
                "ffmpeg",
                "-v",
                "error",
                "-y",
                "-i",
                str(temporary),
                "-af",
                "loudnorm=I=-20:TP=-2:LRA=7,afade=t=out:st=0.68:d=0.10",
                "-ar",
                "44100",
                "-ac",
                "1",
                "-b:a",
                "96k",
                str(target),
            ],
            check=True,
        )
    finally:
        temporary.unlink(missing_ok=True)
    return target


def duration(path: Path) -> float:
    return float(
        subprocess.check_output(
            [
                "ffprobe",
                "-v",
                "error",
                "-show_entries",
                "format=duration",
                "-of",
                "default=nw=1:nk=1",
                str(path),
            ],
            text=True,
        ).strip()
    )


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    key = read_key()
    client = opener()
    effects = []
    for name, prompt in PROMPTS.items():
        path = generate(name, prompt, key, client)
        effects.append(
            {
                "id": name,
                "file": path.name,
                "prompt": prompt,
                "seconds": round(duration(path), 4),
                "bytes": path.stat().st_size,
                "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            }
        )
        print(f"Ready: {path.name} ({effects[-1]['seconds']:.2f}s)", flush=True)

    MANIFEST_PATH.write_text(
        json.dumps(
            {
                "provider": "ElevenLabs",
                "model": MODEL,
                "purpose": "Generic cartoon monster reaction variants; no real-person imitation.",
                "effects": effects,
            },
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {MANIFEST_PATH}", flush=True)


if __name__ == "__main__":
    main()
