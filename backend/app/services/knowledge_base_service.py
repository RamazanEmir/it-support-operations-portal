from sqlalchemy import or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.models import KnowledgeBaseArticle
from app.schemas.knowledge_base_article import KnowledgeBaseArticleCreate, KnowledgeBaseArticleUpdate


class KnowledgeBaseArticleNotFoundError(Exception):
    pass


def list_articles(db: Session, search: str | None = None) -> list[KnowledgeBaseArticle]:
    query = select(KnowledgeBaseArticle)
    if search is not None and search.strip():
        pattern = f"%{search.strip()}%"
        query = query.where(
            or_(
                KnowledgeBaseArticle.title.ilike(pattern),
                KnowledgeBaseArticle.category.ilike(pattern),
                KnowledgeBaseArticle.content.ilike(pattern),
            )
        )
    return list(db.scalars(query).all())


def get_article(db: Session, article_id: int) -> KnowledgeBaseArticle:
    article = db.get(KnowledgeBaseArticle, article_id)
    if article is None:
        raise KnowledgeBaseArticleNotFoundError("Knowledge base article not found.")
    return article


def create_article(db: Session, article_data: KnowledgeBaseArticleCreate) -> KnowledgeBaseArticle:
    article = KnowledgeBaseArticle(**article_data.model_dump())
    try:
        db.add(article)
        db.commit()
        db.refresh(article)
    except SQLAlchemyError:
        db.rollback()
        raise
    return article


def update_article(
    db: Session, article_id: int, article_data: KnowledgeBaseArticleUpdate
) -> KnowledgeBaseArticle:
    article = get_article(db, article_id)
    try:
        article.title = article_data.title
        article.category = article_data.category
        article.content = article_data.content
        db.commit()
        db.refresh(article)
    except SQLAlchemyError:
        db.rollback()
        raise
    return article


def delete_article(db: Session, article_id: int) -> None:
    article = get_article(db, article_id)
    try:
        db.delete(article)
        db.commit()
    except SQLAlchemyError:
        db.rollback()
        raise
