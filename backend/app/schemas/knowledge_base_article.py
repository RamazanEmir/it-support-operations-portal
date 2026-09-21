from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class KnowledgeBaseArticleBase(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    title: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    content: str = Field(min_length=1)


class KnowledgeBaseArticleCreate(KnowledgeBaseArticleBase):
    pass


class KnowledgeBaseArticleUpdate(KnowledgeBaseArticleBase):
    pass


class KnowledgeBaseArticleResponse(KnowledgeBaseArticleBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime
