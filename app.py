"""
Efecto Compton — Flask app for PythonAnywhere hosting.
Serves all static files (HTML, CSS, JS, lib) from the project root.
"""
import os
from flask import Flask, send_from_directory

app = Flask(__name__)

PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))


@app.route('/')
def index():
    return send_from_directory(PROJECT_DIR, 'index.html')


@app.route('/manual')
def manual():
    return send_from_directory(PROJECT_DIR, 'manual.html')


@app.route('/css/<path:filename>')
def css(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, 'css'), filename)


@app.route('/js/<path:filename>')
def js(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, 'js'), filename)


@app.route('/lib/<path:filename>')
def lib(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, 'lib'), filename)


@app.route('/assets/<path:filename>')
def assets(filename):
    return send_from_directory(os.path.join(PROJECT_DIR, 'assets'), filename)


if __name__ == '__main__':
    app.run(debug=False)
