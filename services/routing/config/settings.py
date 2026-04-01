"""
Django settings for the Stellar routing service.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "stellar-routing-dev-key-change-in-production")
DEBUG      = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["*"]  # Gateway only — no direct browser access

INSTALLED_APPS = [
    "django.contrib.contenttypes",
    "django.contrib.auth",
    "rest_framework",
    "routing",
]

MIDDLEWARE = [
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES":   ["rest_framework.parsers.JSONParser"],
}

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME":   BASE_DIR / "db.sqlite3",
    }
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Custom config
SYSTEM_CONFIG_PATH = os.getenv("SYSTEM_CONFIG_PATH", "../../config/system.json")
QAOA_LAYERS        = int(os.getenv("QAOA_LAYERS", "2"))
USE_QAOA           = os.getenv("USE_QAOA", "true").lower() == "true"