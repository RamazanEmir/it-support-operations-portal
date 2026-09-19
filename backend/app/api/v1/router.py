from fastapi import APIRouter

from app.api.v1.assets import router as assets_router
from app.api.v1.health import router as health_router
from app.api.v1.it_requests import router as it_requests_router
from app.api.v1.tickets import router as tickets_router
from app.api.v1.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(users_router)
api_router.include_router(tickets_router)
api_router.include_router(it_requests_router)
api_router.include_router(assets_router)
