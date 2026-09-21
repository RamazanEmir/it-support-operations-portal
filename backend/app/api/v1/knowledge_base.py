from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import KnowledgeBaseArticle
from app.schemas.knowledge_base_article import (
    KnowledgeBaseArticleCreate,
    KnowledgeBaseArticleResponse,
    KnowledgeBaseArticleUpdate,
)
from app.services import knowledge_base_service

router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])


@router.get("", response_model=list[KnowledgeBaseArticleResponse])
def list_articles(
    db: Annotated[Session, Depends(get_db)], search: str | None = None
) -> list[KnowledgeBaseArticle]:
    return knowledge_base_service.list_articles(db, search)


@router.get("/{article_id}", response_model=KnowledgeBaseArticleResponse)
def get_article(article_id: int, db: Annotated[Session, Depends(get_db)]) -> KnowledgeBaseArticle:
    try:
        return knowledge_base_service.get_article(db, article_id)
    except knowledge_base_service.KnowledgeBaseArticleNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.post("", response_model=KnowledgeBaseArticleResponse, status_code=status.HTTP_201_CREATED)
def create_article(
    article_data: KnowledgeBaseArticleCreate, db: Annotated[Session, Depends(get_db)]
) -> KnowledgeBaseArticle:
    return knowledge_base_service.create_article(db, article_data)


@router.put("/{article_id}", response_model=KnowledgeBaseArticleResponse)
def update_article(
    article_id: int,
    article_data: KnowledgeBaseArticleUpdate,
    db: Annotated[Session, Depends(get_db)],
) -> KnowledgeBaseArticle:
    try:
        return knowledge_base_service.update_article(db, article_id, article_data)
    except knowledge_base_service.KnowledgeBaseArticleNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None


@router.delete("/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(article_id: int, db: Annotated[Session, Depends(get_db)]) -> Response:
    try:
        knowledge_base_service.delete_article(db, article_id)
    except knowledge_base_service.KnowledgeBaseArticleNotFoundError as error:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(error)) from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
