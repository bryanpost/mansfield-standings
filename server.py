# server.py — local development server for the Mansfield standings app
#
# Usage:
#   pip install flask openpyxl
#   python server.py
#   Open http://localhost:8080 in your browser.
#
# Edit mansfield.xlsx in Excel, save, then refresh the browser — the server
# re-reads the file on every request, so no restart is needed.

import pathlib
from flask import Flask, jsonify, send_from_directory
import engine

BASE    = pathlib.Path(__file__).parent       # directory this file lives in
RESULTS = BASE / "results.xlsx"
CONFIG  = BASE / "config.csv"

app = Flask(__name__)


@app.route("/")
def index():
    return send_from_directory(BASE, "index.html")


@app.route("/<path:filename>")
def static_files(filename):
    return send_from_directory(BASE, filename)


@app.route("/api/data")
def data():
    """Return fully-computed standings + bracket data as JSON.

    The engine reads mansfield.xlsx fresh on every call, so changes to the
    spreadsheet are visible on the next browser refresh (no server restart).
    """
    try:
        return jsonify(engine.compute_all(RESULTS, CONFIG))
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500


if __name__ == "__main__":
    print(f"Serving from {BASE}")
    print("Open http://localhost:8080")
    app.run(port=8080, debug=True)
