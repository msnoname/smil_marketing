import os
import re
import uuid
from fastapi import APIRouter, Depends, File, Form, Query, UploadFile, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.vehicle_model import VehicleModel
from app.pdf_merge import merge_to_pdf
from app.schemas.vehicle_model import (
    VehicleModelCreate,
    VehicleModelUpdate,
    VehicleModelOut,
    ModelMergeOut,
    ModelProcessOut,
)
from app.supabase_storage import upload_file as storage_upload, delete_prefix
from app.babeldoc_service import translate_pdf

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


def _exists_duplicate(
    db: Session,
    country_id: uuid.UUID,
    brand: str,
    model: str,
    model_year: int | None,
    exclude_id: uuid.UUID | None = None,
) -> bool:
    """检查是否存在重复：国家+品牌+车型+年款 完全一致。"""
    q = db.query(VehicleModel).filter(
        VehicleModel.country_id == country_id,
        VehicleModel.brand == brand,
        VehicleModel.model == model,
        VehicleModel.model_year == model_year,
    )
    if exclude_id is not None:
        q = q.filter(VehicleModel.id != exclude_id)
    return q.first() is not None


@router.post("/", response_model=VehicleModelOut, status_code=201)
def create_model(payload: VehicleModelCreate, db: Session = Depends(get_db)):
    brand = payload.brand.strip()
    model = payload.model.strip()
    if _exists_duplicate(db, payload.country_id, brand, model, payload.model_year):
        raise HTTPException(
            status_code=409,
            detail="该国家下已存在相同的品牌、车型、年款组合，请修改后重试",
        )
    row = VehicleModel(
        id=uuid.uuid4(),
        country_id=payload.country_id,
        brand=brand,
        model=model,
        model_year=payload.model_year,
    )
    db.add(row)
    db.flush()
    db.refresh(row)
    return row


@router.patch("/{model_id}", response_model=VehicleModelOut)
def update_model(
    model_id: uuid.UUID,
    payload: VehicleModelUpdate,
    db: Session = Depends(get_db),
):
    """更新车型的品牌、车型名称、年款。"""
    model = db.query(VehicleModel).filter(VehicleModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    brand = payload.brand.strip()
    model_name = payload.model.strip()
    if _exists_duplicate(db, model.country_id, brand, model_name, payload.model_year, exclude_id=model_id):
        raise HTTPException(
            status_code=409,
            detail="该国家下已存在相同的品牌、车型、年款组合，请修改后重试",
        )
    model.brand = brand
    model.model = model_name
    model.model_year = payload.model_year
    db.commit()
    db.refresh(model)
    return model


@router.get("/{model_id}", response_model=VehicleModelOut)
def get_model(model_id: uuid.UUID, db: Session = Depends(get_db)):
    """获取单个车型详情。"""
    model = db.query(VehicleModel).filter(VehicleModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post("/{model_id}/files/process", response_model=ModelProcessOut, status_code=200)
def process_model_files(
    model_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="按顺序的 PDF/图片，将合并、上传并翻译"),
    db: Session = Depends(get_db),
):
    """
    配置表处理中心：合并文件 -> 删除旧文件 -> 上传原文 -> 调用 Babeldoc 翻译 -> 上传翻译件 -> 更新 model。
    """
    model = db.query(VehicleModel).filter(VehicleModel.id == model_id).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")

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

    prefix = str(model_id)
    try:
        delete_prefix(prefix)
    except Exception as e:
        pass  # 忽略删除失败（可能本无旧文件）

    storage_path_orig = f"{model_id}/merged.pdf"
    try:
        public_url = storage_upload(storage_path_orig, merged_pdf_bytes, "application/pdf")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e!s}")

    cn_url: str | None = None
    en_url: str | None = None

    cn_pdf = translate_pdf(merged_pdf_bytes, "zh")
    if cn_pdf:
        try:
            cn_url = storage_upload(f"{model_id}/merged_cn.pdf", cn_pdf, "application/pdf")
        except Exception:
            pass

    en_pdf = translate_pdf(merged_pdf_bytes, "en")
    if en_pdf:
        try:
            en_url = storage_upload(f"{model_id}/merged_en.pdf", en_pdf, "application/pdf")
        except Exception:
            pass

    model.original_url = public_url
    model.cn_url = cn_url
    model.en_url = en_url
    db.commit()
    db.refresh(model)
    return ModelProcessOut(original_url=public_url, cn_url=cn_url, en_url=en_url)


@router.post("/{model_id}/files/merge", response_model=ModelMergeOut, status_code=200)
def merge_and_upload_model_files(
    model_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="按顺序的 PDF/图片，将合并为单个 PDF 并上传"),
    db: Session = Depends(get_db),
):
    """按顺序合并所有 PDF/图片为单个 PDF，上传到 Supabase Storage，并将公开 URL 写入 model.original_url。"""
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

    try:
        delete_prefix(str(model_id))
    except Exception:
        pass

    storage_path = f"{model_id}/merged.pdf"
    try:
        public_url = storage_upload(
            storage_path, merged_pdf_bytes, "application/pdf"
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Storage upload failed: {e!s}")

    model.original_url = public_url
    model.cn_url = None
    model.en_url = None
    db.commit()
    db.refresh(model)
    return ModelMergeOut(original_url=public_url)


