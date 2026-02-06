"""健康检查与基础接口"""
from fastapi import APIRouter

router = APIRouter()


@router.get("")
async def health_check():
    return {"status": "ok"}
