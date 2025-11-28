from app import app
from models import db, User, Category, Report
from werkzeug.security import generate_password_hash

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

        admin = User()
        admin.name = "Admin Desu"
        admin.email = "admin@desu.com"
        admin.password = pw_hash
        admin.role = "admin"

        warga1 = User()
        warga1.name = "Ujang Lapor"
        warga1.email = "ujang@warga.com"
        warga1.password = pw_hash
        warga1.role = "reporter"

        warga2 = User()
        warga2.name = "Siti Netizen"
        warga2.email = "siti@warga.com"
        warga2.password = pw_hash
        warga2.role = "reporter"

        db.session.add_all([admin, warga1, warga2])
        db.session.commit()
        print("👤 Users created!")

        # 3. Create Categories
        # Kita kasih icon path (nanti di frontend kita siapin gambarnya)
        cat_jalan = Category()
        cat_jalan.name = "Jalan Rusak"
        cat_jalan.icon_url = "/icons/road-marker.png"

        cat_banjir = Category()
        cat_banjir.name = "Banjir"
        cat_banjir.icon_url = "/icons/flood-marker.png"

        cat_lampu = Category()
        cat_lampu.name = "Lampu Mati"
        cat_lampu.icon_url = "/icons/lamp-marker.png"

        cat_sampah = Category()
        cat_sampah.name = "Sampah Liar"
        cat_sampah.icon_url = "/icons/trash-marker.png"

        db.session.add_all([cat_jalan, cat_banjir, cat_lampu, cat_sampah])
        db.session.commit()
        print("📂 Categories created!")

        # 4. Create Dummy Reports (Lokasi: Bandung Kota)
        reports = []

        r1 = Report()
        r1.title = "Lubang Besar Depan Gedung Sate"
        r1.description = "Bahaya banget buat motor, tolong segera diperbaiki desu!"
        r1.latitude = -6.902481
        r1.longitude = 107.618810  # Gedung Sate
        r1.image_url = "https://placehold.co/600x400?text=Jalan+Rusak"
        r1.status = "pending"
        r1.user_id = warga1.id
        r1.category_id = cat_jalan.id
        reports.append(r1)

        r2 = Report()
        r2.title = "Banjir di Pagarsih"
        r2.description = "Air sudah naik setinggi lutut orang dewasa."
        r2.latitude = -6.924652
        r2.longitude = 107.595460  # Pagarsih
        r2.image_url = "https://placehold.co/600x400?text=Banjir"
        r2.status = "verified"
        r2.user_id = warga2.id
        r2.category_id = cat_banjir.id
        reports.append(r2)

        r3 = Report()
        r3.title = "Lampu PJU Mati di Dago"
        r3.description = "Gelap gulita rawan begal."
        r3.latitude = -6.886071
        r3.longitude = 107.615206  # Simpang Dago
        r3.image_url = "https://placehold.co/600x400?text=Lampu+Mati"
        r3.status = "resolved"
        r3.user_id = warga1.id
        r3.category_id = cat_lampu.id
        reports.append(r3)

        r4 = Report()
        r4.title = "Tumpukan Sampah Alun-Alun"
        r4.description = "Bau menyengat ganggu turis."
        r4.latitude = -6.921851
        r4.longitude = 107.604829  # Alun-alun
        r4.image_url = "https://placehold.co/600x400?text=Sampah"
        r4.status = "pending"
        r4.user_id = warga2.id
        r4.category_id = cat_sampah.id
        reports.append(r4)

        db.session.add_all(reports)
        db.session.commit()
        print("📍 Reports created (Bandung Area)!")
        print("✅ Seeding Complete! Lapor Desu siap digunakan.")

if __name__ == '__main__':
    seed_data()