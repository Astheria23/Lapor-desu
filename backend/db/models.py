from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False) 
    role = db.Column(db.String(20), default='reporter') 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    reports = db.relationship('Report', backref='reporter', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role
        }


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False) 
    icon_url = db.Column(db.String(255)) 
    
    reports = db.relationship('Report', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'icon_url': self.icon_url
        }


class Report(db.Model):
    __tablename__ = 'reports'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text)

    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    
    image_url = db.Column(db.String(255)) 
    status = db.Column(db.String(20), default='pending')
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)

    def to_dict(self):
        """Serialize the report to a dict.

        Relationship attributes (reporter, category) are accessed defensively to
        avoid errors if the instance is detached from a session or the related
        rows are missing. This helps prevent DetachedInstanceError or AttributeError
        during JSON serialization outside an active request context.
        """
        reporter = getattr(self, 'reporter', None)
        category = getattr(self, 'category', None)

        # Safe extraction helpers
        def safe_attr(obj, attr, default=None):
            try:
                return getattr(obj, attr) if obj is not None else default
            except Exception:
                return default

        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'image_url': self.image_url,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user_id': self.user_id,
            'category_id': self.category_id,
            'reporter_name': safe_attr(reporter, 'name', 'Anonymous'),
            'category_name': safe_attr(category, 'name', 'General'),
            'category_icon': safe_attr(category, 'icon_url', None)
        }