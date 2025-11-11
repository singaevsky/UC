# =========================
# Файл: web/scanner.py
# =========================
import os
import sys
import ast
import json
import configparser
import subprocess
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

def safe_eval_node_name(node: ast.AST) -> Optional[str]:
    try:
        if isinstance(node, ast.Name):
            return node.id
        if isinstance(node, ast.Attribute):
            left = safe_eval_node_name(node.value)
            if left is None:
                return None
            return f"{left}.{node.attr}"
    except Exception:
        return None
    return None

def parse_definitions(content: str, fname: str) -> Dict[str, Any]:
    """Парсим .py файл: классы, функции, импорты и наличие argparse."""
    tree = ast.parse(content, filename=fname)
    classes: List[str] = []
    functions: List[str] = []
    imports: List[str] = []
    uses_argparse = False

    for node in ast.walk(tree):
        if isinstance(node, ast.ClassDef):
            classes.append(node.name)
        if isinstance(node, ast.FunctionDef):
            functions.append(node.name)
        if isinstance(node, (ast.Import, ast.ImportFrom)):
            if isinstance(node, ast.Import):
                for a in node.names:
                    imports.append(a.name)
            else:
                module = node.module or ""
                imports.append(module.split(".")[0])
        if isinstance(node, ast.Call):
            callee = safe_eval_node_name(node.func)
            if callee in ("argparse.ArgumentParser", "ArgumentParser"):
                uses_argparse = True
    return {
        "classes": classes,
        "functions": functions,
        "imports": imports,
        "uses_argparse": uses_argparse,
    }

def read_setup_cfg(setup_cfg_path: Path) -> Dict[str, List[str]]:
    """Читаем entry points из setup.cfg [entry_points]."""
    res: Dict[str, List[str]] = {}
    if not setup_cfg_path.exists():
        return res
    cp = configparser.ConfigParser()
    cp.read(setup_cfg_path, encoding="utf-8")
    for sec_name in cp.sections():
        if sec_name.lower().startswith("entry_points"):
            for k, v in cp.items(sec_name):
                res.setdefault(k, []).append(v)
    return res

def read_pyproject_toml(pyproject_path: Path) -> Dict[str, List[str]]:
    """Читаем entry points из pyproject.toml [project.scripts]."""
    res: Dict[str, List[str]] = {}
    if not pyproject_path.exists():
        return res
    try:
        import tomli
    except Exception:
        # если нет tomli — просто вернем пустое
        return res
    with open(pyproject_path, "rb") as f:
        data = tomli.load(f)
    scripts = data.get("project", {}).get("scripts", {})
    for k, v in scripts.items():
        res.setdefault(k, []).append(v)
    return res

def detect_entrypoints(repo_root: Path) -> Dict[str, List[str]]:
    """Авто-определение entrypoints из setup.py/setup.cfg/pyproject.toml."""
    entry: Dict[str, List[str]] = {}

    setup_py = repo_root / "setup.py"
    if setup_py.exists():
        # Пытаемся вытащить entry_points через setuptools
        try:
            sys.path.insert(0, str(repo_root))
            import setup as setup_mod
            # Попробуем найти setup() и взять параметр entry_points
            # Это хрупко, но зачастую работает
            if hasattr(setup_mod, "entry_points"):
                ep = setup_mod.entry_points
                if isinstance(ep, dict):
                    for k, v in ep.items():
                        entry.setdefault(k, []).append(v)
                elif isinstance(ep, str):
                    # формат: "a = b, c = d" — упрощенно пропустим
                    pass
        except Exception:
            pass
        finally:
            if str(repo_root) in sys.path:
                sys.path.remove(str(repo_root))

    setup_cfg = repo_root / "setup.cfg"
    if setup_cfg.exists():
        entry.update(read_setup_cfg(setup_cfg))

    pyproject = repo_root / "pyproject.toml"
    if pyproject.exists():
        entry.update(read_pyproject_toml(pyproject))
    return entry

def find_python_files(repo_root: Path, exclude_dirs: List[str] = None, max_files: int = 1000) -> List[Path]:
    exclude_dirs = exclude_dirs or [".git", "__pycache__", ".pytest_cache", ".mypy_cache", "node_modules", ".venv", "venv", "env", ".env", "build", "dist"]
    py_files: List[Path] = []
    for root, dirs, files in os.walk(repo_root):
        # срезаем исключения
        dirs[:] = [d for d in dirs if d not in exclude_dirs and not d.startswith(".")]
        for f in files:
            if f.endswith(".py"):
                py_files.append(Path(root) / f)
                if len(py_files) >= max_files:
                    return py_files
    return py_files

def parse_requirements_txt(requirements_path: Path) -> List[str]:
    if not requirements_path.exists():
        return []
    reqs: List[str] = []
    with open(requirements_path, "r", encoding="utf-8") as rf:
        for line in rf:
            s = line.strip()
            if s and not s.startswith("#"):
                reqs.append(s)
    return reqs

def detect_config_files(repo_root: Path) -> Dict[str, Any]:
    configs: Dict[str, Any] = {}
    for cfg in ["config.yaml", "config.yml", "config.json", "configs.yaml", "configs.yml", "configs.json"]:
        p = repo_root / cfg
        if p.exists():
            try:
                if cfg.endswith(".json"):
                    with open(p, "r", encoding="utf-8") as f:
                        configs[cfg] = json.load(f)
                else:
                    with open(p, "r", encoding="utf-8") as f:
                        configs[cfg] = yaml.safe_load(f) if cfg.endswith(".yaml") or cfg.endswith(".yml") else {}
            except Exception as e:
                configs[cfg] = {"error": str(e)}
    return configs

def scan_repo(repo_root: Path) -> Dict[str, Any]:
    repo_root = Path(repo_root)
    py_files = find_python_files(repo_root)
    modules: Dict[str, Dict[str, Any]] = {}
    for p in py_files:
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            rel = str(p.relative_to(repo_root))
            modules[rel] = parse_definitions(content, str(p))
        except Exception as e:
            modules[str(p.relative_to(repo_root))] = {"error": str(e)}

    entrypoints = detect_entrypoints(repo_root)
    readme = None
    for p in ["README.md", "readme.md", "README.rst", "readme.rst", "README.txt"]:
        rp = repo_root / p
        if rp.exists():
            try:
                with open(rp, "r", encoding="utf-8", errors="ignore") as f:
                    readme = f.read()[:4000]
                readme_file = p
                break
            except Exception:
                pass

    req_files = ["requirements.txt", "requirements-dev.txt", "dev-requirements.txt", "requirements/requirements.txt"]
    reqs: Dict[str, List[str]] = {}
    for r in req_files:
        rp = repo_root / r
        if rp.exists():
            reqs[r] = parse_requirements_txt(rp)

    configs = detect_config_files(repo_root)
    license_file = None
    for p in ["LICENSE", "LICENSE.txt", "LICENSE.md"]:
        lp = repo_root / p
        if lp.exists():
            try:
                with open(lp, "r", encoding="utf-8", errors="ignore") as f:
                    license_file = f.read()[:1500]
                break
            except Exception:
                pass

    return {
        "repo_root": str(repo_root),
        "modules": modules,
        "entrypoints": entrypoints,
        "readme": {"file": readme_file, "text": readme},
        "requirements": reqs,
        "configs": configs,
        "license": license_file,
    }

def module_call_map(repo_root: Path, selected_modules: List[str]) -> Dict[str, Any]:
    """Собираем карту модулей: классы, функции, импорты; можно расширить поиск вызовов."""
    repo_root = Path(repo_root)
    out: Dict[str, Any] = {}
    for rel in selected_modules:
        p = repo_root / rel
        if not p.exists():
            continue
        try:
            with open(p, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
            out[rel] = parse_definitions(content, str(p))
        except Exception as e:
            out[rel] = {"error": str(e)}
    return out

def run_help_for_module(repo_root: Path, module: str, entry: str, python: str) -> Tuple[int, str, str]:
    """
    Пытаемся получить справку: python -m <module> --help или через entrypoint --help
    На входе:
      - module: например "tools.train" (путь без .py)
      - entry: команда из entrypoints, например "uc-train = tools.train:main"
    """
    repo_root = Path(repo_root)
    env = os.environ.copy()
    env["PYTHONPATH"] = str(repo_root)

    # Если entry передана как "key = value" — запуск через ключ
    if entry and "=" in entry:
        parts = entry.split("=")
        cmd_key = parts[0].strip()
        # Пробуем: cmd_key --help
        cmd = [python, "-m", "UC_wrapper", cmd_key, "--help"]
        # Более общий случай — попробуем запуск как модуля:
    else:
        # Сначала пробуем как модуль
        cmd = [python, "-m", module, "--help"]

    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, env=env, cwd=repo_root, timeout=20)
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as e:
        # fallback
        return 2, "", f"Help run failed: {e}"
