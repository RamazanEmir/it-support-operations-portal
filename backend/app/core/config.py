from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=Path(__file__).resolve().parents[2] / ".env",
        env_file_encoding="utf-8",
        str_strip_whitespace=True,
        hide_input_in_errors=True,
    )

    database_url: str = Field(validation_alias="DATABASE_URL", min_length=1, repr=False)


settings = Settings()
