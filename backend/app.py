import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
from models import db, User, Category, Report

load_dotenv()

app = Flask(__name__)
CORS(app) 

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

@app.route('/')
def index():
    return jsonify({
        "message": "Welcome to Lapor Desu API 🚧",
        "status": "Running",
        "database": "Neon PostgreSQL"
    })

@app.route('/api/test-db')
def test_db():
    try:
        report_count = Report.query.count()
        return jsonify({
            "message": "Connection Successful!",
            "total_reports": report_count
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.route('/api/reports', methods=['GET'])
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

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories])

@app.route('/api/reports', methods=['POST'])
def create_report():
    data = request.get_json(silent=True) or {}
    try:
        required = ['title', 'latitude', 'longitude', 'category_id']
        missing = [k for k in required if k not in data or data[k] in (None, '')]
        if missing:
            return jsonify({"error": f"Field(s) missing: {', '.join(missing)}"}), 400

        new_report = Report()
        new_report.title = str(data['title']).strip()
        new_report.description = str(data.get('description', '')).strip()
        new_report.latitude = float(data['latitude'])
        new_report.longitude = float(data['longitude'])
        new_report.category_id = int(data['category_id'])
        new_report.user_id = 1  
        new_report.image_url = (str(data.get('image_url', '')).strip() or None)
        new_report.status = 'pending'
        db.session.add(new_report)
        db.session.commit()
        return jsonify({"message": "Laporan diterima desu!", "data": new_report.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    app.run(debug=True, port=5000)