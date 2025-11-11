# =========================
# Файл: web/run_utils.py
# =========================
import os
import json
import shlex
import subprocess
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

def write_configs(configs_dir: Path, config_files: Dict[str, Any]) -> List[str]:
    """
    Сохраняем конфиги из словаря в папку configs_dir.
    Каждый ключ = имя файла, значение = содержимое (dict/str).
    """
    configs_dir.mkdir(parents=True, exist_ok=True)
    written: List[str] = []
    for name, content in config_files.items():
        if content is None:
            continue
        if not name.endswith((".json", ".yaml", ".yml")):
            name = f"{name}.json"
        path = configs_dir / name
        with open(path, "w", encoding="utf-8") as f:
            if isinstance(content, (dict, list)):
                json.dump(content, f, ensure_ascii=False, indent=2)
            else:
                f.write(str(content))
        written.append(str(path))
    return written

def detect_python() -> str:
    return os.environ.get("PYTHON", "python")

def run_command_cwd(
    repo_root: Path,
    cmdline: str,
    env_add: Optional[Dict[str, str]] = None,
    timeout: Optional[int] = 600,
    cwd: Optional[Path] = None,
) -> Tuple[int, str, str]:
    cwd = cwd or repo_root
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_root)
    if env_add:
        env.update(env_add)
    try:
        proc = subprocess.run(
            cmdline,
            shell=False,  # безопаснее, если cmdline приходит как список; здесь строка — разобьём ниже
            capture_output=True,
            text=True,
            env=env,
            cwd=str(cwd),
            timeout=timeout
        )
        return proc.returncode, proc.stdout, proc.stderr
    except subprocess.TimeoutExpired as e:
        return 124, "", f"Timeout: {timeout}s"
    except Exception as e:
        return 2, "", f"Run failed: {e}"

def run_command_from_args(
    repo_root: Path,
    args: List[str],
    config_map: Optional[Dict[str, Any]] = None,
    env_add: Optional[Dict[str, str]] = None,
    timeout: Optional[int] = 600,
    python_path: Optional[str] = None
) -> Tuple[int, str, str]:
    """
    Запуск команды как [python, -m, <module>, <...>].
    Если config_map не пуст — подменяем конфиги в data/configs/.
    """
    repo_root = Path(repo_root)
    config_map = config_map or {}
    written = []
    if config_map:
        configs_dir = repo_root.parent / "data" / "configs"
        written = write_configs(configs_dir, config_map)

    python = python_path or detect_python()
    full_cmd = [python, "-m", "__main__"] + args
    return run_command_cwd(repo_root, " ".join(shlex.quote(c) for c in full_cmd), env_add=env_add, timeout=timeout, cwd=repo_root)

def simple_shell_run(
    repo_root: Path,
    cmd: str,
    env_add: Optional[Dict[str, str]] = None,
    timeout: Optional[int] = 600
) -> Tuple[int, str, str]:
    """Универсальный shell-вариант (менее безопасно). Используйте только если понимаете, что запускаете."""
    return run_command_cwd(repo_root, cmd, env_add=env_add, timeout=timeout, cwd=repo_root)
