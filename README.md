# Mini Clinic Information System - Boilerplate Monorepo

Boilerplate aplikasi full-stack monorepo untuk technical test **Mini Clinic Information System** menggunakan Docker Compose, Node.js Express, PostgreSQL, dan React (Vite + Tailwind CSS).

---

## Tech Stack
- **Database**: PostgreSQL 15 Alpine (`db`)
- **Backend**: Node.js 20 Express.js (`backend`)
  - Modular architecture (`routes`, `controllers`, `config`, `middlewares`)
  - PostgreSQL Driver: `pg` (Pool)
  - Security & Auth: `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`
- **Frontend**: React 18 SPA (`frontend`)
  - Build Tool: Vite
  - Styling: Tailwind CSS
  - Routing: React Router DOM (v6)
  - Web Server: Nginx Alpine (Multi-stage Docker build dengan fallback SPA routing)

---

## Struktur Direktori
```
mini-clinic-information-system/
├── docker-compose.yml          # Konfigurasi 3 service (db, backend, frontend)
├── .env.example                # Template variabel environment
├── .env                        # Environment file aktif
├── .gitignore                  # Git ignore root
├── init.sql                    # DDL schema awal & seed data PostgreSQL
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── package.json
│   └── src/
│       ├── config/
│       │   └── db.js           # PostgreSQL connection pool
│       ├── controllers/
│       │   └── health.controller.js
│       ├── routes/
│       │   └── health.routes.js # /api/health
│       ├── middlewares/
│       │   └── errorHandler.js
│       └── index.js            # Server entrypoint
└── frontend/
    ├── Dockerfile              # Multi-stage build (Node build -> Nginx)
    ├── .dockerignore
    ├── nginx.conf              # Nginx try_files SPA config
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── index.html
    └── src/
        ├── index.css
        ├── App.jsx             # UI Dashboard & API connectivity check
        └── main.jsx
```

---

## Akun Bawaan (Default Seed Users)
Semua akun bawaan menggunakan password: `password123`

| Peran (Role) | Nama Lengkap | Email | Password |
|---|---|---|---|
| `admin` | Administrator Klinik | `admin@clinic.com` | `password123` |
| `doctor` | dr. Budi Santoso, Sp.PD | `dr.budi@clinic.com` | `password123` |
| `receptionist` | Siti Rahmawati | `resepsionis@clinic.com` | `password123` |

---

## Skema Database (`init.sql`)
1. **`users`**: Akun user, role (`admin`, `doctor`, `receptionist`), password hash bcrypt.
2. **`patients`**: Data induk pasien (No. RM unik, NIK unik, nama, jenis kelamin `L`/`P`, tanggal lahir, alamat).
3. **`registrations`**: Pendaftaran kunjungan ke poli, dokter pemeriksa, penjamin (`BPJS`/`Umum`/`Asuransi`), status (`Menunggu`, `Check In`, `Pemeriksaan`, `Selesai`, `Batal`).
4. **`queues`**: Antrean pendaftaran (`A001`, `A002`), relasi ke `registrations`.
5. **`medical_records`**: Pemeriksaan SOAP dokter (Subjective, Objective tanda vital, Assessment, Plan, Tindakan medis, Resep obat).
6. **`prescriptions`**: Rincian resep obat terstruktur (Nama obat, dosis, frekuensi, kuantitas, instruksi minum) relasi ke `medical_records(id)`.

---

## Standar Format JSON Response API (`backend/src/utils/response.js`)
Seluruh endpoint backend menggunakan format seragam:
- **Success (HTTP 200/201)**:
  ```json
  {
    "success": true,
    "message": "Pesan sukses",
    "data": {}
  }
  ```
- **Error (HTTP 4xx/5xx)**:
  ```json
  {
    "success": false,
    "message": "Pesan error",
    "errors": {}
  }
  ```

---

## Cara Menjalankan

Cukup jalankan satu perintah berikut di dalam direktori `mini-clinic-information-system`:

```bash
docker compose up -d --build
```

Setelah container berjalan:
- **Frontend**: Buka di browser [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: Buka di browser / curl [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Database PostgreSQL**: Terbuka di `localhost:5432` (User: `postgres`, Password: `postgres`, DB: `mini_clinic_db`)

### Mematikan Service
```bash
docker compose down
```

Untuk mereset database beserta volumenya (sehingga `init.sql` dieksekusi ulang):
```bash
docker compose down -v
```

