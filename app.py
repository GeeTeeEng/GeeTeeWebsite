from flask import Flask, render_template, send_from_directory, request, jsonify, redirect, url_for, Response
from flask_compress import Compress
import os
import json
from datetime import datetime, date

app = Flask(__name__)
Compress(app)

# ── Compression config ──────────────────────────────────────
app.config['COMPRESS_MIMETYPES'] = [
    'text/html', 'text/css', 'text/xml', 'text/plain',
    'application/javascript', 'application/json',
    'application/xml', 'image/svg+xml'
]
app.config['COMPRESS_ALGORITHM'] = ['br', 'gzip']
app.config['COMPRESS_MIN_SIZE'] = 256

# Force Jinja2 to reload templates from disk on every request (dev setting)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.jinja_env.auto_reload = True


# ── Static file caching ────────────────────────────────────
@app.after_request
def add_cache_headers(response):
    """Add aggressive caching for static assets, no-cache for HTML."""
    path = request.path
    if path.startswith('/static/'):
        if '/images/' in path:
            # Images: cache 1 year (immutable content-addressed)
            response.headers['Cache-Control'] = 'public, max-age=31536000, immutable'
        elif path.endswith(('.css', '.js')):
            # CSS/JS: cache 1 week
            response.headers['Cache-Control'] = 'public, max-age=604800'
        else:
            response.headers['Cache-Control'] = 'public, max-age=86400'
    else:
        # HTML pages: no cache (always fresh)
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    # Security headers
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Content-Security-Policy'] = "frame-ancestors 'self'"
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    return response


# ── Routes ──────────────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", active_page="home")

@app.route("/machines")
def machines():
    return render_template("machines.html", active_page="machines")

@app.route("/machine-specs")
def machine_specs():
    return render_template("specs.html", active_page="specs")

@app.route("/gallery")
def gallery():
    frames = [f"/static/images/gallery/gallery-{i}.webp" for i in range(1, 13)]
    return render_template("gallery.html", active_page="gallery", frames=frames)

@app.route("/contact")
def contact():
    return render_template("contact.html", active_page="contact")

@app.route("/contact/submit", methods=["POST"])
def contact_submit():
    """Server-side contact form handler.
    Saves submissions to a local JSON log and returns a success response.
    For production: integrate SendGrid / Mailgun / SMTP relay here.
    """
    data = {
        "timestamp": datetime.now().isoformat(),
        "first_name": request.form.get("first_name", "").strip(),
        "last_name": request.form.get("last_name", "").strip(),
        "email": request.form.get("email", "").strip(),
        "phone": request.form.get("phone", "").strip(),
        "service": request.form.get("service", "").strip(),
        "message": request.form.get("message", "").strip(),
    }

    # Basic validation
    if not data["first_name"] or not data["email"] or not data["message"]:
        if request.headers.get("X-Requested-With") == "XMLHttpRequest":
            return jsonify({"status": "error", "message": "Please fill in all required fields."}), 400
        return redirect(url_for("contact") + "?error=missing_fields")

    # Save submission to local log file
    log_path = os.path.join(os.path.dirname(__file__), "contact_submissions.json")
    submissions = []
    if os.path.exists(log_path):
        try:
            with open(log_path, "r") as f:
                submissions = json.load(f)
        except (json.JSONDecodeError, IOError):
            submissions = []
    submissions.append(data)
    with open(log_path, "w") as f:
        json.dump(submissions, f, indent=2)

    # Return appropriate response
    if request.headers.get("X-Requested-With") == "XMLHttpRequest":
        return jsonify({"status": "success", "message": "Thank you! We'll respond within 24 hours."})
    return redirect(url_for("contact") + "?success=1")

@app.route("/favicon.ico")
def favicon():
    return send_from_directory(app.static_folder, "favicon.ico", mimetype="image/x-icon")

@app.route("/robots.txt")
def robots():
    return send_from_directory(app.static_folder, "robots.txt")

@app.route("/sitemap.xml")
def sitemap():
    xml = render_template("sitemap.xml", last_modified=date.today().isoformat())
    return Response(xml, mimetype="application/xml")

@app.route("/llms.txt")
def llms():
    return send_from_directory(app.static_folder, "llms.txt", mimetype="text/plain")


if __name__ == "__main__":
    app.run(debug=False, host='0.0.0.0', port=5002, use_reloader=False)

# Gunicorn entry point: gunicorn app:app -b 0.0.0.0:8000 -w 4
