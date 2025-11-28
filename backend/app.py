import os
from pathlib import Path
from flask import Flask, jsonify, request
from datetime import datetime
from flask_cors import CORS
from dotenv import load_dotenv
from models import db, Category, Report, User
from werkzeug.utils import secure_filename
from supabase import create_client, Client 
from uuid import uuid4
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

app = Flask(__name__, static_folder=str(FRONTEND_DIR), static_url_path="")
CORS(app)

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_KEY")
bucket_name = os.environ.get("BUCKET_NAME")

supabase: Client | None = None
if supabase_url and supabase_key:
    supabase = create_client(supabase_url, supabase_key)
else:
    print("[warn] SUPABASE_URL/KEY not set, image upload disabled.")

database_url = os.getenv('DATABASE_URL')
if database_url and database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'default_secret')

db.init_app(app)

with app.app_context():
    try:
        db.create_all()
        print("connect to Neon & Table synced!")
    except Exception as e:
        print(f"failed to connect to database: {e}")

ALLOWED_IMAGE_MIMES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/gif': '.gif',
}


def upload_image_to_supabase(file_storage) -> str:
    """Upload an image file to Supabase Storage and return a public URL.

    Raises an Exception if upload fails or file type is not allowed.
    """
    if supabase is None or not bucket_name:
        raise RuntimeError('Supabase is not configured. Please set SUPABASE_URL, SUPABASE_KEY, BUCKET_NAME')
    if not file_storage or not getattr(file_storage, 'filename', None):
        raise ValueError('No file provided')

    mime = file_storage.mimetype or 'application/octet-stream'
    ext = ALLOWED_IMAGE_MIMES.get(mime)
    if not ext:
        filename = secure_filename(file_storage.filename)
        lower = filename.lower()
        if lower.endswith('.jpg') or lower.endswith('.jpeg'):
            ext, mime = '.jpg', 'image/jpeg'
        elif lower.endswith('.png'):
            ext, mime = '.png', 'image/png'
        elif lower.endswith('.webp'):
            ext, mime = '.webp', 'image/webp'
        elif lower.endswith('.gif'):
            ext, mime = '.gif', 'image/gif'
        else:
            raise ValueError('Unsupported image type')

    unique_name = f"reports/{uuid4().hex}{ext}"
    file_bytes = file_storage.read()
    try:
        file_storage.seek(0)
    except Exception:
        pass

    storage = supabase.storage.from_(bucket_name)
    storage.upload(unique_name, file_bytes)

    pub = storage.get_public_url(unique_name)
    public_url = None
    if isinstance(pub, dict):
        public_url = pub.get('publicUrl') or pub.get('public_url') or pub.get('data')
    else:
        public_url = getattr(pub, 'public_url', None) or getattr(pub, 'data', None)

    if not public_url:
        base = (os.environ.get('SUPABASE_URL') or '').rstrip('/')
        if base:
            public_url = f"{base}/storage/v1/object/public/{bucket_name}/{unique_name}"

    if not public_url:
        raise RuntimeError('Failed to obtain public URL from Supabase response')

    return public_url


# ---------- Auth helpers ----------
def create_token(user_id: int) -> str:
    """Create a simple JWT using SECRET_KEY. Encodes user_id and issued-at."""
    payload = {"sub": user_id, "iat": int(datetime.utcnow().timestamp())}
    secret = app.config.get('SECRET_KEY', 'default_secret')
    token = jwt.encode(payload, secret, algorithm='HS256')
    # PyJWT may return bytes on old versions; normalize to str
    return token if isinstance(token, str) else token.decode('utf-8')


def get_current_user():
    """Extract and validate JWT from Authorization header. Returns User or None."""
    auth = request.headers.get('Authorization', '')
    parts = auth.split()
    if len(parts) == 2 and parts[0].lower() == 'bearer':
        token = parts[1]
        try:
            payload = jwt.decode(token, app.config.get('SECRET_KEY', 'default_secret'), algorithms=['HS256'])
            user_id = payload.get('sub')
            if user_id:
                return User.query.get(int(user_id))
        except Exception:
            return None
    return None


def require_auth(role: str | None = None):
    """Simple auth guard: ensures a logged-in user; optional role check."""
    user = get_current_user()
    if not user:
        return None, (jsonify({"error": "Unauthorized"}), 401)
    if role and getattr(user, 'role', None) != role:
        return None, (jsonify({"error": "Forbidden"}), 403)
    return user, None


@app.route('/api/v1/auth/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    try:
        name = (data.get('name') or '').strip()
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        if not name or not email or not password:
            return jsonify({"error": "name, email, password wajib"}), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email sudah terdaftar"}), 400

        pw_hash = generate_password_hash(password)
        user = User()
        user.name = name
        user.email = email
        user.password = pw_hash
        user.role = 'reporter'
        db.session.add(user)
        db.session.commit()

        token = create_token(user.id)
        return jsonify({"message": "Registrasi berhasil", "token": token, "user": user.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route('/api/v1/auth/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    try:
        email = (data.get('email') or '').strip().lower()
        password = data.get('password') or ''
        if not email or not password:
            return jsonify({"error": "email dan password wajib"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "User tidak ditemukan"}), 404

        if not check_password_hash(user.password, password):
            return jsonify({"error": "Password salah"}), 401

        token = create_token(user.id)
        return jsonify({"message": "Login sukses", "token": token, "user": user.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/')
def serve_index():
    # Serve the frontend index.html
    try:
        return app.send_static_file('index.html')
    except Exception:
        return jsonify({"message": "Frontend not found", "hint": "Ensure /frontend exists and is copied in deployment"}), 404

@app.route('/api')
def api_root():
    return jsonify({
        "message": "Welcome to Lapor Desu API 🚧",
        "status": "Running",
        "database": "Neon PostgreSQL"
    })

@app.route('/api/v1/test-db')
def test_db():
    try:
        report_count = Report.query.count()
        return jsonify({
            "message": "Connection Successful!",
            "total_reports": report_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/reports', methods=['GET'])
def get_reports():
    reports = Report.query.all()
    
    features = []
    for r in reports:
        features.append({
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [r.longitude, r.latitude] 
            },
            "properties": r.to_dict()
        })
    
    return jsonify({
        "type": "FeatureCollection",
        "features": features
    })

@app.route('/api/v1/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@app.route('/api/v1/reports', methods=['POST'])
def create_report():
    # Require any authenticated user (e.g., reporter) to create
    user, err = require_auth()
    if err:
        return err
    is_multipart = (request.content_type or '').startswith('multipart/form-data')
    data = ({k: request.form.get(k) for k in request.form} if is_multipart else (request.get_json(silent=True) or {}))
    try:
        required = ['title', 'latitude', 'longitude', 'category_id']
        missing = [k for k in required if k not in data or data[k] in (None, '')]
        if missing:
            return jsonify({"error": f"Field(s) missing: {', '.join(missing)}"}), 400

        new_report = Report()
        new_report.title = str(data.get('title', '')).strip()
        new_report.description = str(data.get('description', '')).strip()
        new_report.latitude = float(str(data.get('latitude')))
        new_report.longitude = float(str(data.get('longitude')))
        new_report.category_id = int(str(data.get('category_id')))
        new_report.user_id = int(getattr(user, 'id', 1))
        new_report.status = 'pending'

        image_url = None
        if is_multipart:
            file = request.files.get('image')
            if file and getattr(file, 'filename', ''):
                image_url = upload_image_to_supabase(file)
        if not image_url:
            raw = str(data.get('image_url', '')).strip()
            image_url = raw or None
        new_report.image_url = image_url

        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Report successfully created!", "data": new_report.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400


@app.route('/api/v1/reports/<int:id>', methods=['GET'])
def get_report_detail(id):

    report = Report.query.get_or_404(id)

    return jsonify(report.to_dict())


@app.route('/api/v1/reports/<int:id>', methods=['PATCH'])
def update_report(id):
    # Only admin can update status or content
    user, err = require_auth(role='admin')
    if err:
        return err
    report = Report.query.get_or_404(id)
    is_multipart = (request.content_type or '').startswith('multipart/form-data')
    data = ({k: request.form.get(k) for k in request.form} if is_multipart else (request.get_json(silent=True) or {}))

    try:
        if is_multipart:
            file = request.files.get('image')
            if file and getattr(file, 'filename', ''):
                report.image_url = upload_image_to_supabase(file)

        if 'image_url' in data:
            raw = str(data.get('image_url', ''))
            report.image_url = raw.strip() or report.image_url

        if 'title' in data:
            title_raw = data.get('title')
            if isinstance(title_raw, str):
                report.title = title_raw.strip()
        if 'description' in data:
            desc_raw = data.get('description')
            if isinstance(desc_raw, str):
                report.description = desc_raw.strip()
        if 'status' in data and isinstance(data['status'], str):
            if data['status'] in ['pending', 'verified', 'resolved', 'rejected']:
                report.status = data['status']

        report.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({
            "message": "Data successfully updated",
            "data": report.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@app.route('/api/v1/reports/<int:id>', methods=['DELETE'])
def delete_report(id):
    # Only admin can delete
    user, err = require_auth(role='admin')
    if err:
        return err
    report = Report.query.get_or_404(id)
    
    try:
        db.session.delete(report)
        db.session.commit()
        return jsonify({"message": "report successfully deleted"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)