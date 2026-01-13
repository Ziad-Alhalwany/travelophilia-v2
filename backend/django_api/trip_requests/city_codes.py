# backend/django_api/trip_requests/city_codes.py
import re

CITY_ALIASES = {
    # Egypt (sample – زوّد براحتك)
    "cairo": "CAI",
    "القاهرة": "CAI",
    "giza": "GIZ",
    "الجيزة": "GIZ",
    "alexandria": "ALX",
    "الاسكندرية": "ALX",
    "الإسكندرية": "ALX",
    "mansoura": "MNS",
    "المنصورة": "MNS",
    "kafr elsheikh": "KFS",
    "كفرالشيخ": "KFS",
    "كفر الشيخ": "KFS",
    "ain sokhna": "AIN",
    "العين السخنة": "AIN",
    "fayoum": "FYM",
    "الفيوم": "FYM",
}

def _norm(s: str) -> str:
    s = (s or "").strip().lower()
    s = re.sub(r"\s+", " ", s)
    return s

def guess_city_code(city_name: str) -> str:
    key = _norm(city_name)
    return CITY_ALIASES.get(key, "")
