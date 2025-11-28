from app import app
from models import db, User, Category, Report
from werkzeug.security import generate_password_hash
import random

def seed_data():
    with app.app_context():
        print("🌱 Start Seeding...")
        
        # 1. Reset Database (Hapus semua data dulu biar bersih)
        db.drop_all()
        db.create_all()
        print("🧹 Database bersih & Table dibuat ulang!")

        # 2. Create Users
        # Password default: 'password123'
        pw_hash = generate_password_hash('password123')
        
        admin = User(name="Admin Desu", email="admin@desu.com", password=pw_hash, role="admin")
        warga1 = User(name="Ujang Lapor", email="ujang@warga.com", password=pw_hash, role="reporter")
        warga2 = User(name="Siti Netizen", email="siti@warga.com", password=pw_hash, role="reporter")
        
        db.session.add_all([admin, warga1, warga2])
        db.session.commit()
        print("👤 Users created!")

        # 3. Create Categories
        # Kita kasih icon path (nanti di frontend kita siapin gambarnya)
        cat_jalan = Category(name="Jalan Rusak", icon_url="/icons/road-marker.png")
        cat_banjir = Category(name="Banjir", icon_url="/icons/flood-marker.png")
        cat_lampu = Category(name="Lampu Mati", icon_url="/icons/lamp-marker.png")
        cat_sampah = Category(name="Sampah Liar", icon_url="/icons/trash-marker.png")
        
        db.session.add_all([cat_jalan, cat_banjir, cat_lampu, cat_sampah])
        db.session.commit()
        print("📂 Categories created!")

        # 4. Create Dummy Reports (Lokasi: Bandung Kota)
        reports = [
            Report(
                title="Lubang Besar Depan Gedung Sate",
                description="Bahaya banget buat motor, tolong segera diperbaiki desu!",
                latitude=-6.902481, longitude=107.618810, # Gedung Sate
                image_url="https://placehold.co/600x400?text=Jalan+Rusak",
                status="pending",
                user_id=warga1.id,
                category_id=cat_jalan.id
            ),
            Report(
                title="Banjir di Pagarsih",
                description="Air sudah naik setinggi lutut orang dewasa.",
                latitude=-6.924652, longitude=107.595460, # Pagarsih
                image_url="https://placehold.co/600x400?text=Banjir",
                status="verified",
                user_id=warga2.id,
                category_id=cat_banjir.id
            ),
            Report(
                title="Lampu PJU Mati di Dago",
                description="Gelap gulita rawan begal.",
                latitude=-6.886071, longitude=107.615206, # Simpang Dago
                image_url="https://placehold.co/600x400?text=Lampu+Mati",
                status="resolved",
                user_id=warga1.id,
                category_id=cat_lampu.id
            ),
            Report(
                title="Tumpukan Sampah Alun-Alun",
                description="Bau menyengat ganggu turis.",
                latitude=-6.921851, longitude=107.604829, # Alun-alun
                image_url="https://placehold.co/600x400?text=Sampah",
                status="pending",
                user_id=warga2.id,
                category_id=cat_sampah.id
            )
        ]

        db.session.add_all(reports)
        db.session.commit()
        print("📍 Reports created (Bandung Area)!")
        print("✅ Seeding Complete! Lapor Desu siap digunakan.")

if __name__ == '__main__':
    seed_data()