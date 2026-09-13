"""
TipCheck Local Runner
Starts the unified TipCheck server (FastAPI + React Frontend) on http://127.0.0.1:8000
"""
import os
import sys
import subprocess
import webbrowser

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dist = os.path.join(root_dir, "frontend", "dist")

    # Check if frontend build exists, if not build it
    if not os.path.exists(frontend_dist):
        print("[TipCheck] Frontend build not found. Building React frontend...")
        frontend_dir = os.path.join(root_dir, "frontend")
        try:
            subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True, shell=True)
            print("[TipCheck] Frontend build complete.")
        except Exception as e:
            print(f"[TipCheck] Warning: Could not build frontend: {e}")

    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "127.0.0.1")
    url = f"http://{host}:{port}"
    print(f"\n=======================================================")
    print(f"  TipCheck Engine is starting at {url}")
    print(f"  Serving both API and React Web Application")
    print(f"  Press Ctrl+C to stop.")
    print(f"=======================================================\n")

    try:
        import uvicorn
        from backend.main import app
        webbrowser.open(url)
        uvicorn.run(app, host=host, port=port)
    except KeyboardInterrupt:
        print("\nTipCheck server stopped.")

if __name__ == "__main__":
    main()
