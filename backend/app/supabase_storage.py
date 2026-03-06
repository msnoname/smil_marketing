"""
Supabase Storage：上传/删除文件，返回公开 URL。
客户端由 app.database 统一提供（与 Postgres 同属 Supabase 项目）。
Bucket 名称：vehicle-docs（需在 Supabase 控制台创建并为 public）。
"""
from app.database import get_supabase_storage_client

BUCKET = "vehicle-docs"


def upload_file(storage_path: str, content: bytes, content_type: str) -> str:
    """上传到 bucket，返回公开 URL。storage_path 如：{model_id}/{unique}_{filename}"""
    client = get_supabase_storage_client()
    bucket = client.storage.from_(BUCKET)
    bucket.upload(storage_path, content, file_options={"content-type": content_type})
    return bucket.get_public_url(storage_path)


def delete_file(storage_path: str) -> None:
    """从 bucket 删除指定路径文件。"""
    client = get_supabase_storage_client()
    client.storage.from_(BUCKET).remove([storage_path])


def list_files_by_prefix(prefix: str) -> list[str]:
    """列出 bucket 中指定前缀下的所有文件路径。prefix 如 'model_id'。"""
    client = get_supabase_storage_client()
    bucket = client.storage.from_(BUCKET)
    base = prefix.rstrip("/")
    try:
        result = bucket.list(base, {"limit": 1000})
    except Exception:
        return []
    paths: list[str] = []
    for item in result:
        name = item.get("name") if isinstance(item, dict) else getattr(item, "name", None)
        if not name:
            continue
        full_path = f"{base}/{name}"
        meta = item.get("metadata") if isinstance(item, dict) else getattr(item, "metadata", {}) or {}
        mimetype = meta.get("mimetype") if isinstance(meta, dict) else None
        if mimetype:
            paths.append(full_path)
        else:
            try:
                sub = bucket.list(full_path, {"limit": 1000})
                for s in sub:
                    n = s.get("name") if isinstance(s, dict) else getattr(s, "name", None)
                    if n:
                        paths.append(f"{full_path}/{n}")
            except Exception:
                pass
    return paths


def delete_prefix(prefix: str) -> None:
    """删除 bucket 中指定前缀下的所有文件。先列出再批量删除。"""
    paths = list_files_by_prefix(prefix)
    if not paths:
        return
    client = get_supabase_storage_client()
    bucket = client.storage.from_(BUCKET)
    bucket.remove(paths)
