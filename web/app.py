# =========================
# Файл: web/app.py
# =========================
import os
import json
import yaml
from pathlib import Path
from typing import Any, Dict, Optional, List

from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.templating import Jinja2Templates
from starlette.requests import Request
from starlette.responses import RedirectResponse

from .scanner import scan_repo, module_call_map, run_help_for_module
from .run_utils import run_command_from_args, simple_shell_run, detect_python
from .uc_api import train as uc_train, eval_model as uc_eval, infer_model as uc_infer

@app.post("/api/uc/train")
def api_uc_train(cfg: Dict[str, Any] = Body(...)):
    return uc_train(cfg)

@app.post("/api/uc/eval")
def api_uc_eval(cfg: Dict[str, Any] = Body(...)):
    return uc_eval(cfg)

@app.post("/api/uc/infer")
def api_uc_infer(cfg: Dict[str, Any] = Body(...), input_data: Dict[str, Any] = Body(...)):
    return uc_infer(cfg, input_data)
BASE_DIR = Path(__file__).resolve().parent
REPOS_DIR = BASE_DIR.parent.parent / "data" / "repos"
REPO_NAME = "UC"
UC_REPO_URL = "https://github.com/singaevsky/UC.git"
UC_ROOT = REPOS_DIR / REPO_NAME
CONFIGS_DIR = BASE_DIR.parent.parent / "data" / "configs"
DEFAULT_CONFIG = {
    "dataset": {
        "train": str(BASE_DIR.parent.parent / "data" / "datasets" / "train.csv"),
        "val": str(BASE_DIR.parent.parent / "data" / "datasets" / "val.csv")
    },
    "model": {
        "name": "UCModel",
        "hidden_size": 256
    },
    "training": {
        "epochs": 2,
        "batch_size": 16,
        "lr": 1e-3
    },
    "runtime": {
        "device": "cpu"
    }
}

def ensure_repo() -> None:
    REPOS_DIR.mkdir(parents=True, exist_ok=True)

def clone_or_update(repo_url: str, target_dir: Path) -> Dict[str, Any]:
    target_dir.parent.mkdir(parents=True, exist_ok=True)
    if target_dir.exists():
        # update
        import subprocess
        proc = subprocess.run(["git", "-C", str(target_dir), "pull", "--rebase"], capture_output=True, text=True)
        return {"ok": True, "action": "update", "log": proc.stdout + proc.stderr}
    else:
        import subprocess
        proc = subprocess.run(["git", "clone", repo_url, str(target_dir)], capture_output=True, text=True)
        return {"ok": True, "action": "clone", "log": proc.stdout + proc.stderr}

app = FastAPI(title="UC Repository Web Starter", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# статические ассеты/шаблоны
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/api/clone")
def api_clone():
    ensure_repo()
    res = clone_or_update(UC_REPO_URL, UC_ROOT)
    return res

@app.get("/api/scan")
def api_scan():
    if not UC_ROOT.exists():
        raise HTTPException(400, "Repository not found. Clone via /api/clone first.")
    scan = scan_repo(UC_ROOT)
    return {"ok": True, "scan": scan}

@app.post("/api/module-map")
def api_module_map(selected_modules: List[str] = Body(...)):
    if not UC_ROOT.exists():
        raise HTTPException(400, "Repository not found. Clone via /api/clone first.")
    return {"ok": True, "map": module_call_map(UC_ROOT, selected_modules)}

@app.get("/api/entrypoints")
def api_entrypoints():
    if not UC_ROOT.exists():
        raise HTTPException(400, "Repository not found. Clone via /api/clone first.")
    from .scanner import detect_entrypoints
    ep = detect_entrypoints(UC_ROOT)
    return {"ok": True, "entrypoints": ep}

@app.get("/api/help")
def api_help(entry: Optional[str] = None, module: Optional[str] = None):
    if not UC_ROOT.exists():
        raise HTTPException(400, "Repository not found. Clone via /api/clone first.")
    if not entry and not module:
        raise HTTPException(400, "Provide entry or module")
    python = detect_python()
    code, out, err = run_help_for_module(UC_ROOT, module or "", entry or "", python)
    return {"ok": True, "returncode": code, "stdout": out, "stderr": err}

@app.post("/api/run")
def api_run(
    args: List[str] = Body(...),
    config_files: Optional[Dict[str, Any]] = None,
    env_add: Optional[Dict[str, str]] = None,
    timeout: int = 600
):
    if not UC_ROOT.exists():
        raise HTTPException(400, "Repository not found. Clone via /api/clone first.")
    if not args:
        raise HTTPException(400, "Args cannot be empty")
    # Если нужно подменить конфиги — кладем в data/configs/
    config_files = config_files or {}
    if config_files:
        from .run_utils import write_configs
        CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
        write_configs(CONFIGS_DIR, config_files)

    # Запуск как python -m __main__ <args> из репозитория
    python = detect_python()
    full_cmd = [python, "-m", "__main__"] + args
    import shlex
    code, out, err = simple_shell_run(UC_ROOT, " ".join(shlex.quote(c) for c in full_cmd), env_add=env_add, timeout=timeout)
    return {"ok": True, "returncode": code, "stdout": out, "stderr": err}

@app.get("/api/default-config")
def api_default_config():
    return {"ok": True, "config": DEFAULT_CONFIG}

@app.post("/api/ensure-default-configs")
def api_ensure_default_configs():
    CONFIGS_DIR.mkdir(parents=True, exist_ok=True)
    cfg_path = CONFIGS_DIR / "config.json"
    with open(cfg_path, "w", encoding="utf-8") as f:
        json.dump(DEFAULT_CONFIG, f, ensure_ascii=False, indent=2)
    return {"ok": True, "path": str(cfg_path)}

@app.get("/health")
def health():
    return {"ok": True}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="127.0.0.1", port=8000, reload=False)
