from typing import Literal

from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import Password


class LoginRequest(BaseModel):
    email: EmailStr = Field(max_length=254)
    password: Password = Field(repr=False)


class TokenResponse(BaseModel):
    access_token: str = Field(repr=False)
    token_type: Literal["bearer"] = "bearer"
