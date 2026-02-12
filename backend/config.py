import os


class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4")
    OPENAI_API_BASE = os.getenv("OPENAI_API_BASE", "https://api.openai.com/v1")

    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = FLASK_ENV == "development"

    RATE_LIMIT_DEFAULT = os.getenv("RATE_LIMIT_DEFAULT", "30 per hour")
    RATE_LIMIT_REVIEW = os.getenv("RATE_LIMIT_REVIEW", "10 per minute")
    MAX_DIFF_CHARS = int(os.getenv("MAX_DIFF_CHARS", "120000"))
