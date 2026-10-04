from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints

from app.core.enums import UserRole

Password = Annotated[str, StringConstraints(strip_whitespace=False, min_length=12, max_length=128)]


class UserBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    name: str = Field(min_length=1, max_length=100)
    email: EmailStr = Field(max_length=254)
    role: UserRole


class UserCreate(UserBase):
    password: Password = Field(repr=False)


class UserUpdate(UserBase):
    password: Password | None = Field(default=None, repr=False)


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
