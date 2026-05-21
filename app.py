"""
Efecto Compton — Flask app for PythonAnywhere hosting.
Catch-all static file server: serves every file from the project root.
"""
import os
from flask import Flask, send_from_directory, abort

app = Flask(__name__)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


@app.route('/')
def index():
    return send_from_directory(PROJECT_DIR, 'index.html')


@app.route('/<path:filename>')
def serve_file(filename):
    # Normalise: strip leading slashes, block path traversal
    filename = filename.lstrip('/')
    if '..' in filename:
        abort(403)
    target = os.path.join(PROJECT_DIR, filename)
    if os.path.isfile(target):
        return send_from_directory(PROJECT_DIR, filename)
    # Try appending .html (so /manual also works)
    if os.path.isfile(target + '.html'):
        return send_from_directory(PROJECT_DIR, filename + '.html')
    abort(404)


if __name__ == '__main__':
    app.run(debug=False)
