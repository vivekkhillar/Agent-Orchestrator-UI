"""
Unified Multi-Process Runner:
Launches both the Python FastAPI Orchestrator (Port 8000) and the Vite/Express UI (Port 3000).
"""

import subprocess
import sys
import os
import time
import signal

def main():
    print("=" * 70)
    print("🏦 FIRST DIGITAL TREASURY - MULTI-AGENT HARNESS")
    print("🚀 Starting FastAPI Backend (Port 8000) & Vite/Express UI (Port 3000)...")
    print("=" * 70)

    # 1. Start FastAPI Process
    fastapi_cmd = [sys.executable, "-m", "uvicorn", "fastapi_app:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
    fastapi_proc = subprocess.Popen(
        fastapi_cmd,
        cwd=os.getcwd(),
        env=os.environ.copy()
    )
    print("✅ FastAPI Backend started on http://127.0.0.1:8000 (Docs: http://127.0.0.1:8000/docs)")

    # 2. Wait 1 second for FastAPI to bind
    time.sleep(1)

    # 3. Start Vite/Express UI Process
    npm_cmd = "npm.cmd" if os.name == "nt" else "npm"
    ui_proc = subprocess.Popen(
        [npm_cmd, "run", "dev"],
        cwd=os.getcwd(),
        env=os.environ.copy()
    )
    print("✅ Vite + Express UI started on http://localhost:3000")
    print("=" * 70)
    print("Press Ctrl+C to terminate both servers.")
    print("=" * 70)

    try:
        while True:
            time.sleep(0.5)
            # If either process terminates unexpectedly, exit loop
            if fastapi_proc.poll() is not None:
                print(f"⚠️ FastAPI process terminated with code {fastapi_proc.returncode}")
                break
            if ui_proc.poll() is not None:
                print(f"⚠️ UI process terminated with code {ui_proc.returncode}")
                break
    except KeyboardInterrupt:
        print("\n🛑 Shutting down all servers...")
    finally:
        if fastapi_proc.poll() is None:
            fastapi_proc.terminate()
        if ui_proc.poll() is None:
            ui_proc.terminate()
        print("✅ All services stopped.")

if __name__ == "__main__":
    main()
