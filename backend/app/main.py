from fastapi import FastAPI, Request
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

from app.api.v1.router import api_router

app = FastAPI(title="IT Support Operations Portal")


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    path = request.url.path.rstrip("/")
    if path == "/api/v1/auth/login" or path == "/api/v1/users" or path.startswith("/api/v1/users/"):
        errors = [{key: value for key, value in item.items() if key not in {"input", "ctx"}} for item in error.errors()]
        error = RequestValidationError(errors)
    return await request_validation_exception_handler(request, error)

app.include_router(api_router, prefix="/api/v1")
