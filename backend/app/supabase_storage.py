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
