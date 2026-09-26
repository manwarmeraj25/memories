#!/usr/bin/env python3
"""Serve the archive and keep it in step with data/years/.

    python3 scripts/serve.py --browser safari

Leave it running. Drop a file like data/years/2022.json in and the 2022
section appears in the open page within a couple of seconds — no rebuild, no
reload. Editing a year's quote or its list of links works the same way.

There is no build step. The page reads the JSON files directly; this server
only tells it which years exist and when something changed. It also keeps
data/years/index.json current so the site works on a plain static host
(GitHub Pages and the like) with no server at all.
"""
import argparse
import hashlib
import http.server
import json
import re
import socket
import socketserver
import subprocess
import sys
import threading
import webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
YEARS_DIR = ROOT / "data" / "years"
INDEX = YEARS_DIR / "index.json"
YEAR_RE = re.compile(r"^\d{4}$")

# What --browser accepts, mapped to the macOS application name
BROWSERS = {
    "safari": "Safari",
    "chrome": "Google Chrome",
    "firefox": "Firefox",
    "edge": "Microsoft Edge",
    "brave": "Brave Browser",
}


def year_files():
    """Every data/years/<year>.json, newest year first."""
    if not YEARS_DIR.is_dir():
        return []
    found = [p for p in YEARS_DIR.glob("*.json") if YEAR_RE.match(p.stem)]
    return sorted(found, key=lambda p: p.stem, reverse=True)


def years():
    return [p.stem for p in year_files()]


def signature():
    """A cheap fingerprint of the year files — changes when anything does."""
    parts = []
    for p in year_files():
        st = p.stat()
        parts.append(f"{p.name}:{st.st_mtime_ns}:{st.st_size}")
    site = ROOT / "site.json"
    if site.exists():
        st = site.stat()
        parts.append(f"site:{st.st_mtime_ns}:{st.st_size}")
    return hashlib.sha1("|".join(parts).encode()).hexdigest()[:16]


def write_index():
    """Keep the static fallback list current, so no server is needed to deploy."""
    payload = {"years": years()}
    try:
        current = json.loads(INDEX.read_text())
    except (OSError, ValueError):
        current = None
    if current != payload:
        try:
            YEARS_DIR.mkdir(parents=True, exist_ok=True)
            INDEX.write_text(json.dumps(payload, indent=2) + "\n")
        except OSError:
            pass
    return payload


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT), **kw)

    def do_GET(self):
        route = self.path.split("?", 1)[0].rstrip("/") or "/"

        if route == "/api/signature":
            return self._json({"signature": signature()})

        if route == "/api/years":
            return self._json(write_index())

        return super().do_GET()

    def _json(self, obj):
        body = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def end_headers(self):
        # the archive is being edited while it's open; never serve from cache
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

    try:
        sys.stdout.reconfigure(line_buffering=True)
    except (AttributeError, ValueError):
        pass

    found = write_index()["years"]
    if found:
        print(f"{len(found)} year(s): {', '.join(found)}")
    else:
        print(f"No year files yet. Add one at "
              f"{(YEARS_DIR / '2026.json').relative_to(ROOT)}.")

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

    print("  Add a file like data/years/2022.json and the section appears")
    print("  in the open page on its own. Ctrl-C to stop.\n")

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
