#!/usr/bin/env python3
"""Run the archive locally so it builds itself.

    python3 scripts/serve.py

Leave it running. Drop a folder like assets/images/2027/ in with some
photographs and the new section appears in the open page within a couple of
seconds — no rebuild, no reload. Deleting or renaming files works the same way.

Every request for the manifest rescans the image folders, so data/memories.js
on disk is kept in step too and the page still works opened straight from the
filesystem afterwards.
"""
import argparse
import http.server
import json
import socket
import socketserver
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

# What --browser accepts, mapped to the macOS application name
BROWSERS = {
    "safari": "Safari",
    "chrome": "Google Chrome",
    "firefox": "Firefox",
    "edge": "Microsoft Edge",
    "brave": "Brave Browser",
}

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build  # noqa: E402  (same folder)

ROOT = build.ROOT


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    # ---------------------------------------------------------------- routes
    def do_GET(self):
        route = self.path.split("?", 1)[0].rstrip("/") or "/"

        if route == "/api/signature":
            return self._json({"signature": build.signature()})

        if route == "/api/memories":
            payload, _ = build.scan()
            build.write_manifest(payload)
            return self._json(payload)

        if route == "/data/memories.js":
            payload, _ = build.scan()
            build.write_manifest(payload)
            body = ("window.MEMORIES = "
                    + json.dumps(payload, ensure_ascii=False) + ";\n").encode()
            return self._send(body, "application/javascript; charset=utf-8")

        return super().do_GET()

    # ---------------------------------------------------------------- output
    def _json(self, obj):
        self._send(json.dumps(obj, ensure_ascii=False).encode(),
                   "application/json; charset=utf-8")

    def _send(self, body, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def end_headers(self):
        # the page is being edited while it's open; never serve it from cache
        if not self.path.startswith("/api/"):
            self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        if "/api/signature" in self.path:
            return  # the live-sync poll would drown out everything else
        sys.stderr.write(f"  {self.address_string()} — {fmt % args}\n")


class Server(socketserver.ThreadingTCPServer):
    daemon_threads = True
    allow_reuse_address = True


def free_port(host, preferred):
    for port in range(preferred, preferred + 25):
        with socket.socket() as s:
            try:
                s.bind((host, port))
                return port
            except OSError:
                continue
    raise SystemExit(f"No free port between {preferred} and {preferred + 24}.")


def lan_address():
    """This machine's address on the local network, for opening on a phone."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("192.0.2.1", 1))  # a reserved test address; nothing is sent
        return s.getsockname()[0]
    except OSError:
        return None
    finally:
        s.close()


def launch_browser(choice, url):
    """Open the site in a named browser, falling back to the system default."""
    app = BROWSERS.get(choice)
    if app:
        try:
            subprocess.run(["open", "-a", app, url], check=True,
                           capture_output=True, timeout=15)
            return
        except (OSError, subprocess.SubprocessError) as err:
            print(f"  Could not open {app} ({err}); using the default browser.")
    webbrowser.open(url)


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--no-open", action="store_true",
                    help="don't open a browser window")
    ap.add_argument("--browser", default="default",
                    choices=["default", "none", *sorted(BROWSERS)],
                    help="which browser to open (default: your system default)")
    ap.add_argument("--lan", action="store_true",
                    help="also accept connections from other devices on your "
                         "network, so you can open the site on your phone")
    args = ap.parse_args()

    # keep the banner and the request log readable when stdout is redirected
    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, ValueError):
        pass

    payload, added = build.scan()
    build.write_manifest(payload)
    build.report(payload, added)

    host = "0.0.0.0" if args.lan else "127.0.0.1"
    port = free_port(host, args.port)
    url = f"http://localhost:{port}/"

    if port != args.port:
        print(f"\n  Port {args.port} was busy, using {port} instead.")
    print(f"\n  Memories is live at {url}")

    if args.lan:
        ip = lan_address()
        if ip:
            print(f"  On your phone, same wi-fi:  http://{ip}:{port}/")
        print("  (--lan means anyone on this network can view the archive.)")

    print("  Add a folder like assets/images/2027/ with photographs in it —")
    print("  the section appears in the open page on its own. Ctrl-C to stop.\n")

    choice = "none" if args.no_open else args.browser
    if choice != "none":
        threading.Timer(0.6, launch_browser, args=(choice, url)).start()

    with Server((host, port), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nstopped.")


if __name__ == "__main__":
    main()
