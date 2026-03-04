"""
按顺序将多个 PDF/图片合并为单个 PDF。
支持 application/pdf 与常见图片类型（通过 img2pdf 转成 PDF 页）。
"""
import tempfile
from io import BytesIO
from pathlib import Path

import img2pdf
from pypdf import PdfWriter


def is_pdf(content_type: str, filename: str | None) -> bool:
    if content_type and "pdf" in content_type.lower():
        return True
    if filename and filename.lower().endswith(".pdf"):
        return True
    return False


def _ext_for_image(content_type: str, filename: str | None) -> str:
    if filename:
        ext = Path(filename).suffix.lower()
        if ext in (".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff", ".tif"):
            return ext if ext != ".jpeg" else ".jpg"
    if content_type:
        if "jpeg" in content_type or "jpg" in content_type:
            return ".jpg"
        if "png" in content_type:
            return ".png"
        if "webp" in content_type:
            return ".webp"
        if "gif" in content_type:
            return ".gif"
    return ".png"


def _images_to_pdf(image_items: list[tuple[bytes, str, str | None]]) -> bytes:
    """多张图片按顺序转为一个 PDF。img2pdf 需文件路径，故用临时文件。"""
    if not image_items:
        return b""
    with tempfile.TemporaryDirectory() as tmpdir:
        paths = []
        for i, (content, content_type, filename) in enumerate(image_items):
            ext = _ext_for_image(content_type, filename)
            p = Path(tmpdir) / f"img_{i}{ext}"
            p.write_bytes(content)
            paths.append(str(p))
        return img2pdf.convert(paths)


def merge_to_pdf(files: list[tuple[bytes, str, str | None]]) -> bytes:
    """
    将若干 (content, content_type, filename) 按顺序合并为一个 PDF。
    files: [(content, content_type, filename), ...]
    返回合并后的 PDF 二进制。
    """
    writer = PdfWriter()
    image_buffers: list[tuple[bytes, str, str | None]] = []

    def flush_images() -> None:
        if not image_buffers:
            return
        pdf_bytes = _images_to_pdf(image_buffers)
        if pdf_bytes:
            writer.append(BytesIO(pdf_bytes))
        image_buffers.clear()

    for content, content_type, filename in files:
        if is_pdf(content_type, filename):
            flush_images()
            writer.append(BytesIO(content))
        else:
            image_buffers.append((content, content_type, filename))

    flush_images()

    out = BytesIO()
    writer.write(out)
    return out.getvalue()
