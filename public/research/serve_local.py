#!/usr/bin/env python3
r"""
Minimal HTTPS-capable local server for the CuuNet research demo.
Service workers require either localhost or HTTPS.
Run from: E:\Luu_Tru_O_C\CuuNet\public\research\
  python serve_local.py
Then open: http://localhost:8787/index.html
"""
import http.server, socketserver, os, sys

PORT = 8787
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        '.mjs': 'application/javascript',
        '.js': 'application/javascript',
        '.json': 'application/json',
        '.geojson': 'application/geo+json',
    }
    def end_headers(self):
        # Enable COOP and relaxed COEP to allow OSM map tiles while maintaining isolation
        self.send_header('Cross-Origin-Opener-Policy', 'same-origin')
        self.send_header('Cross-Origin-Embedder-Policy', 'credentialless')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} {fmt % args}")

class ThreadingServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

with ThreadingServer(('', PORT), Handler) as httpd:
    print(f"\n  CuuNet research demo server")
    print(f"  Open: http://localhost:{PORT}/index.html")
    print(f"  Stop: Ctrl+C\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('\n  Stopped.')
        sys.exit(0)
