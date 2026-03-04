import os
import re
import uuid
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle_model import VehicleModel
from app.pdf_merge import merge_to_pdf
from app.schemas.vehicle_model import VehicleModelCreate, VehicleModelOut, ModelMergeOut
from app.supabase_storage import upload_file as storage_upload

router = APIRouter()


def _safe_filename(name: str) -> str:
    return re.sub(r"[^\w\s.-]", "", name).strip() or "file"


@router.get("/", response_model=list[VehicleModelOut])
def search_models(
    country_id: uuid.UUID = Query(..., description="当前选中国家 ID"),
    q: str = Query("", description="车型名称，模糊匹配"),
    db: Session = Depends(get_db),
):
    """按 country_id 筛选，并对 model 列做模糊检索。"""
    query = db.query(VehicleModel).filter(VehicleModel.country_id == country_id)
    if (keyword := (q or "").strip()):
        pattern = f"%{keyword}%"
        query = query.filter(VehicleModel.model.ilike(pattern))
    return query.order_by(VehicleModel.model).all()


@router.get("/brands", response_model=list[str])
def suggest_brands(
    country_id: uuid.UUID = Query(..., description="当前选中国家 ID"),
    q: str = Query("", description="品牌关键词，模糊匹配"),
    db: Session = Depends(get_db),
):
    """按 country_id 筛选，对 brand 列模糊检索，返回去重后的品牌名列表。"""
    if not (keyword := (q or "").strip()):
        return []
    pattern = f"%{keyword}%"
    rows = (
        db.query(VehicleModel.brand)
        .filter(VehicleModel.country_id == country_id, VehicleModel.brand.ilike(pattern))
        .distinct()
        .order_by(VehicleModel.brand)
        .limit(20)
        .all()
    )
    return [r[0] for r in rows]


@router.post("/", response_model=VehicleModelOut, status_code=201)
def create_model(payload: VehicleModelCreate, db: Session = Depends(get_db)):
    row = VehicleModel(
        id=uuid.uuid4(),
        country_id=payload.country_id,
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        model_year=payload.model_year,
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return row


@router.post("/{model_id}/files/merge", response_model=ModelMergeOut, status_code=200)
def merge_and_upload_model_files(
    model_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="按顺序的 PDF/图片，将合并为单个 PDF 并上传"),
    db: Session = Depends(get_db),
):
    """按顺序合并所有 PDF/图片为单个 PDF，上传到 Supabase Storage，并将公开 URL 写入 model.original_url。"""
    from fastapi import HTTPException

    model = db.query(VehicleModel).filter(VehicleModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

    # 按表单顺序读取为 (content, content_type, filename)
    parts: list[tuple[bytes, str, str | None]] = []
    for uf in files:
        if not uf.filename:
            continue
        content = uf.file.read()
        content_type = uf.content_type or "application/octet-stream"
        parts.append((content, content_type, uf.filename))

    if not parts:
        raise HTTPException(status_code=400, detail="No valid files")

    try:
        merged_pdf_bytes = merge_to_pdf(parts)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"PDF merge failed: {e!s}")

    storage_path = f"{model_id}/merged.pdf"
    try:
        public_url = storage_upload(
            storage_path, merged_pdf_bytes, "application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e!s}")

    model.original_url = public_url
    db.commit()
    db.refresh(model)
    return ModelMergeOut(original_url=public_url)


