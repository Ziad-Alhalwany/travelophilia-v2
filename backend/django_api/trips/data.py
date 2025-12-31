# backend/django_api/trips/data.py
"""
Static trips data (temporary).
Later we will replace this with a Trip model + DB table.
"""

TRIPS = [
    {
        "id": "hurghada-weekend",
        "slug": "hurghada-weekend",
        "name": "Hurghada Chill Weekend",
        "location": "Hurghada, Egypt",
        "type": "SEA_ESCAPE",
        "description": "3 days / 2 nights in a cozy hotel by the Red Sea. Perfect for quick recharge with snorkeling & chill vibes.",
        "priceFrom": 4500,
        "priceTo": 7500,
        "currency": "EGP",
        "durationNights": 2,
        "tags": ["Sea", "Snorkeling", "Weekend", "Egypt"],
        "highlights": [
            "2 nights in a 4★ cozy hotel near the sea",
            "Snorkeling trip to Giftun Island",
            "Breakfast included",
            "Airport or bus station pick-up (optional)",
        ],
    },
    {
        "id": "istanbul-flavors",
        "slug": "istanbul-flavors",
        "name": "Istanbul Flavors & Bosphorus",
        "location": "Istanbul, Turkey",
        "type": "CITY_ESCAPE",
        "description": "5 days exploring Istanbul’s food, culture and Bosphorus sunset cruise. Ideal for couples & small groups.",
        "priceFrom": 18000,
        "priceTo": 26000,
        "currency": "EGP",
        "durationNights": 4,
        "tags": ["City", "Food", "Culture", "Bosphorus"],
        "highlights": [
            "Guided tour in Sultanahmet & Hagia Sophia",
            "Bosphorus sunset cruise",
            "Local food experience in Kadikoy",
            "Airport transfers & hotel 4★ (standard plan)",
        ],
    },
    {
        "id": "sharm-diving",
        "slug": "sharm-diving",
        "name": "Sharm El Sheikh Diving Escape",
        "location": "Sharm El Sheikh, Egypt",
        "type": "ADVENTURE",
        "description": "4 days packed with diving, boat trips and Red Sea adventures. For adrenaline & underwater lovers.",
        "priceFrom": 9000,
        "priceTo": 15000,
        "currency": "EGP",
        "durationNights": 3,
        "tags": ["Diving", "Adventure", "Red Sea"],
        "highlights": [
            "3 diving sessions with professional guide",
            "Boat trip & snorkeling",
            "3 nights accommodation",
            "Airport or bus station pick-up (optional)",
        ],
    },
]
