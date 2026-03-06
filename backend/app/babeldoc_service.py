"""
Babeldoc 翻译服务：调用 BabelDOC 将 PDF 翻译为中/英文及小语种版本。
需安装 BabelDOC: uv tool install --python 3.12 BabelDOC
需配置环境变量（见 BABELDOC_API.md 或下方注释）。
若未安装或配置，翻译将跳过，cn_url/en_url 保持为空。
"""
import os
import subprocess
import tempfile
from pathlib import Path

# 环境变量（任选其一配置即可）：
#   BABELDOC_OPENAI_API_KEY  - API 密钥（必填，启用翻译时）
#   BABELDOC_OPENAI_BASE_URL - API 地址，默认 https://api.openai.com/v1
#   BABELDOC_OPENAI_MODEL    - 模型名，默认 gpt-4o-mini
# 免费方案示例：DeepSeek / Groq（见 BABELDOC_API.md）


def _babeldoc_cmd() -> list[str]:
    """uv tool install 的 babeldoc 需通过 uv tool run 调用。"""
    return ["uv", "tool", "run", "babeldoc"]


def _build_babeldoc_args(
    pdf_path: str,
    output_path: str,
    lang_in: str,
    lang_out: str,
) -> list[str]:
    args = [
        "--files", pdf_path,
        "--lang-in", lang_in,
        "--lang-out", lang_out,
        "-o", output_path,
    ]
    api_key = os.getenv("BABELDOC_OPENAI_API_KEY")
    if api_key:
        base_url = os.getenv("BABELDOC_OPENAI_BASE_URL", "https://api.openai.com/v1")
        model = os.getenv("BABELDOC_OPENAI_MODEL", "gpt-4o-mini")
        args = [
            "--openai",
            "--openai-api-key", api_key,
            "--openai-base-url", base_url,
            "--openai-model", model,
        ] + args
    return args


def translate_pdf_to_cn(pdf_path: str, output_path: str) -> bool:
    """
    将 PDF 翻译为中文。使用 BabelDOC CLI。
    若未安装或配置，返回 False。
    """
    try:
        cmd = _babeldoc_cmd()
        args = _build_babeldoc_args(pdf_path, output_path, "en", "zh-CN")
        result = subprocess.run(
            cmd + args,
            capture_output=True,
            text=True,
            timeout=300,
        )
        return result.returncode == 0 and Path(output_path).exists()
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        return False


def translate_pdf_to_en(pdf_path: str, output_path: str) -> bool:
    """
    将 PDF 翻译为英文。使用 BabelDOC CLI。
    若未安装或配置，返回 False。
    """
    try:
        cmd = _babeldoc_cmd()
        args = _build_babeldoc_args(pdf_path, output_path, "zh-CN", "en")
        result = subprocess.run(
            cmd + args,
            capture_output=True,
            text=True,
            timeout=300,
        )
        return result.returncode == 0 and Path(output_path).exists()
    except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
        return False


def translate_pdf(pdf_bytes: bytes, lang_out: str) -> bytes | None:
    """
    将 PDF 字节翻译为目标语言，返回翻译后的 PDF 字节。
    lang_out: 'zh' 或 'en'
    若翻译失败返回 None。
    """
    with tempfile.TemporaryDirectory() as tmpdir:
        inp = Path(tmpdir) / "input.pdf"
        out = Path(tmpdir) / f"output_{lang_out}.pdf"
        inp.write_bytes(pdf_bytes)
        if lang_out == "zh":
            ok = translate_pdf_to_cn(str(inp), str(out))
        else:
            ok = translate_pdf_to_en(str(inp), str(out))
        if ok and out.exists():
            return out.read_bytes()
    return None
