"""Check the built Nginx image and its API/history routing without a live backend."""
import http.server
from pathlib import Path
import secrets
import subprocess
import sys
import tempfile
import threading
import time
import urllib.error
import urllib.request


class Backend(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/health":
            payload = b'{"code":0,"data":{"status":"ok"}}'
        elif self.path == "/api/ci-probe":
            payload = b'{"probe":"forwarded-with-api-prefix"}'
        else:
            self.send_error(404)
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(payload)

    def log_message(self, *_):
        pass


def main(image):
    name = "admin-web-ci-" + secrets.token_hex(5)
    server = http.server.ThreadingHTTPServer(("0.0.0.0", 0), Backend)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    created = False
    try:
        with tempfile.TemporaryDirectory() as directory:
            template = Path(directory) / "default.conf.template"
            original = Path(__file__).resolve().parents[2] / "nginx.conf.template"
            template.write_text(original.read_text(encoding="utf-8").replace(":3000", f":{server.server_port}"), encoding="utf-8", newline="\n")
            subprocess.run([
                "docker", "run", "-d", "--name", name,
                "--add-host", "host.docker.internal:host-gateway",
                "-e", "BACKEND_HOST=host.docker.internal",
                "-v", f"{template.resolve()}:/etc/nginx/templates/default.conf.template:ro",
                "-p", "127.0.0.1::80", image,
            ], check=True, stdout=subprocess.DEVNULL)
            created = True
            binding = subprocess.run(["docker", "port", name, "80/tcp"], check=True, capture_output=True, text=True).stdout.strip().splitlines()[0]
            base = "http://" + binding
            for _ in range(30):
                try:
                    with urllib.request.urlopen(base + "/", timeout=5) as response:
                        index = response.read()
                    break
                except (OSError, ValueError):
                    time.sleep(1)
            else:
                raise RuntimeError("Frontend image did not start")
            if b"<html" not in index.lower():
                raise RuntimeError("Frontend did not serve HTML")
            with urllib.request.urlopen(base + "/dashboard", timeout=5) as response:
                if response.read() != index:
                    raise RuntimeError("SPA history fallback failed")
            with urllib.request.urlopen(base + "/health", timeout=5) as response:
                if b'"ok"' not in response.read():
                    raise RuntimeError("Health proxy failed")
            with urllib.request.urlopen(base + "/api/ci-probe", timeout=5) as response:
                if b"forwarded-with-api-prefix" not in response.read():
                    raise RuntimeError("API prefix proxy failed")
            print("Frontend image smoke test passed: static HTML, history fallback, health and API proxy.")
    finally:
        if created:
            subprocess.run(["docker", "rm", "-f", "-v", name], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        server.shutdown()
        server.server_close()
        thread.join(timeout=5)


if __name__ == "__main__":
    if len(sys.argv) != 2 or not sys.argv[1] or sys.argv[1].startswith("-"):
        raise SystemExit("Usage: smoke.py LOCAL_IMAGE")
    try:
        main(sys.argv[1])
    except Exception:
        print("Frontend image smoke test failed; no test-server resources were used.", file=sys.stderr)
        raise SystemExit(1)
