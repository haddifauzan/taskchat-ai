# Product Requirements Document (PRD)

## Product Name

TaskChat AI

Tagline:
"Cukup chat, tugas langsung tercatat."

---

# 1. Overview

TaskChat AI adalah aplikasi pencatatan tugas berbasis AI yang memungkinkan mahasiswa mencatat tugas hanya dengan mengirim pesan melalui Telegram atau WhatsApp.

Sistem akan secara otomatis memahami isi pesan, mengekstrak informasi tugas, menentukan mata kuliah, deadline, dan detail tugas, kemudian menyimpannya ke dalam dashboard tugas yang terorganisir.

Tujuan utama produk ini adalah menghilangkan hambatan dalam mencatat tugas sehingga pengguna dapat mencatat tugas secepat mengirim chat.

---

# 2. Problem Statement

Mahasiswa sering menerima tugas melalui berbagai sumber:

* Dosen saat perkuliahan
* Grup WhatsApp kelas
* Grup Telegram
* Teman sekelas
* LMS kampus

Meskipun mengetahui pentingnya mencatat tugas, banyak mahasiswa tidak melakukannya karena:

* Membuka aplikasi catatan membutuhkan effort
* Harus memilih kategori mata kuliah
* Harus mengisi berbagai field secara manual
* Terlalu banyak langkah sebelum tugas tersimpan

Akibatnya:

* Tugas terlupakan
* Deadline terlewat
* Pengerjaan menjadi mendadak
* Produktivitas menurun

---

# 3. Product Vision

Menjadi asisten akademik yang mampu mengubah pesan sederhana menjadi tugas terstruktur secara otomatis.

---

# 4. Goals

## Business Goals

* Meningkatkan retensi pengguna mahasiswa
* Menjadi solusi pencatatan tugas yang lebih cepat dibanding task manager tradisional

## User Goals

* Menyimpan tugas kurang dari 10 detik
* Tidak perlu membuka aplikasi dashboard saat mencatat tugas
* Tidak perlu mengisi form manual

---

# 5. Success Metrics

## Activation

Pengguna berhasil:

* Login
* Menghubungkan Telegram Bot
* Menambahkan minimal 1 tugas

Target:
80%

---

## Engagement

Rata-rata tugas yang dicatat per minggu

Target:
≥ 5 tugas/minggu

---

## Accuracy

Keakuratan ekstraksi AI

Target:
≥ 90%

---

## Retention

Pengguna kembali menggunakan bot dalam 7 hari

Target:
≥ 60%

---

# 6. Target Users

## Primary User

Mahasiswa

Karakteristik:

* Sering menerima tugas
* Menggunakan Telegram atau WhatsApp setiap hari
* Jarang membuka aplikasi task management

---

## Secondary User

Pelajar SMA

---

# 7. User Personas

## Persona 1

Nama:
Hadi

Umur:
21 Tahun

Jurusan:
Ilmu Komputer

Pain Points:

* Malas buka Notion
* Sering lupa deadline
* Tugas tersebar di berbagai grup

Goals:

* Mencatat tugas secepat mungkin
* Mendapat reminder otomatis

---

# 8. User Journey

## Current Journey

Dosen memberi tugas

↓

Mahasiswa mengingat sendiri

↓

Lupa

↓

Panik saat deadline

---

## Future Journey

Dosen memberi tugas

↓

Mahasiswa copy-paste ke bot

↓

AI memahami tugas

↓

Tugas tersimpan

↓

Reminder otomatis

↓

Tugas selesai tepat waktu

---

# 9. Core Features

## Feature 1

AI Task Capture

Deskripsi:

Pengguna dapat mengirim pesan bebas kepada bot.

Contoh:

"Tugas AI bikin chatbot deadline minggu depan"

Output:

* Mata kuliah
* Judul tugas
* Deadline
* Deskripsi

tersimpan otomatis.

Priority:
P0

---

## Feature 2

Copy-Paste Announcement

Deskripsi:

Pengguna dapat mengirim pengumuman panjang.

AI akan mengekstrak informasi penting.

Priority:
P0

---

## Feature 3

Assignment Dashboard

Deskripsi:

Menampilkan seluruh tugas yang tersimpan.

Priority:
P1

---

## Feature 4

Task Status

Status:

* Pending
* In Progress
* Completed

Priority:
P1

---

## Feature 5

Reminder Notification

Reminder:

* H-7
* H-3
* H-1
* Hari H

Priority:
P0

---

## Feature 6

Assignment Search

Cari tugas berdasarkan:

* Nama tugas
* Mata kuliah
* Deadline

Priority:
P2

---

## Feature 7

Course Management

Mengelompokkan tugas berdasarkan mata kuliah.

Priority:
P1

---

# 10. AI Features

## AI Extraction

Input:

Pesan bebas

Output:

{
title,
course,
deadline,
description
}

---

## AI Summarization

Input:

Pengumuman panjang

Output:

Ringkasan tugas

---

## AI Classification

Kategori:

* Tugas
* Quiz
* Tubes
* Presentasi
* Praktikum

---

## AI Priority Detection

High

Medium

Low

berdasarkan deadline.

---

# 11. Functional Requirements

## Authentication

User dapat:

* Login Google
* Login GitHub

---

## Telegram Integration

User dapat:

* Menghubungkan akun Telegram
* Mengirim pesan ke bot

---

## Task Management

User dapat:

* Membuat tugas
* Melihat tugas
* Mengedit tugas
* Menghapus tugas
* Menyelesaikan tugas

---

## Notification

Sistem dapat:

* Mengirim reminder otomatis
* Mengirim ringkasan tugas mingguan

---

# 12. Non Functional Requirements

Performance:

* Respon bot < 5 detik

Availability:

* 99%

Security:

* Data user terenkripsi
* Auth menggunakan Supabase Auth

Scalability:

* Mendukung ribuan pengguna

---

# 13. MVP Scope

Termasuk:

✅ Login

✅ Telegram Bot

✅ AI Extraction

✅ Penyimpanan Tugas

✅ Dashboard

✅ Reminder

✅ Kalender

Tidak Termasuk:

❌ Kolaborasi

❌ Mobile App

❌ AI Study Assistant

---

# 14. Database Schema

Users

* id
* telegram_id
* name
* email

Courses

* id
* user_id
* name

Assignments

* id
* user_id
* course_id
* title
* description
* deadline
* priority
* status
* source_text
* created_at

Reminders

* id
* assignment_id
* reminder_type
* sent_at

---

# 15. API Requirements

POST /telegram/webhook

Menerima pesan dari Telegram

---

POST /tasks

Membuat tugas baru

---

GET /tasks

Mengambil daftar tugas

---

PATCH /tasks/:id

Update tugas

---

DELETE /tasks/:id

Hapus tugas

---

# 16. Technical Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS

Backend

* Next.js Route Handlers

Database

* PostgreSQL
* Supabase

Authentication

* Supabase Auth

AI

* Groq
* OpenAI

Bot

* Telegram Bot API

Deployment

* Vercel

---

# 17. Future Roadmap

Phase 2

* WhatsApp Bot
* Google Calendar Sync
* Notion Sync

Phase 3

* AI Weekly Planning
* AI Workload Analysis
* AI Semester Dashboard

Phase 4

* Team Assignment Tracking
* Group Project Management
* Mobile Application
