# frontend/app.py
import os
from flask import Flask, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, template_folder='.', static_folder='.', static_url_path='')

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")


@app.route("/")
def index():
    # Pass the backend URL to the template so JS knows where to connect
    return render_template("index.html", backend_url=BACKEND_URL)


if __name__ == "__main__":
    app.run(debug=True, port=8001)
