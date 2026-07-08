# Product Requirements Document (PRD)

## Judul Proyek

Sistem Monitoring Level Air Tanah Berbasis IoT Menggunakan ESP32, SIM800C, dan Dashboard Web

## 1. Latar Belakang

Pemantauan level air tanah sangat penting untuk irigasi pertanian, deteksi kekeringan, dan pencegahan kelebihan air. Dibutuhkan sistem pemantauan yang dapat bekerja secara mandiri menggunakan tenaga surya dan mengirimkan data secara real-time ke dashboard web sehingga kondisi air tanah dapat dipantau dari mana saja.

### Konsep Pipa

Sistem menggunakan pipa vertikal yang ditanam sebagian di bawah tanah:

```
Sensor JSN-SR04T (puncak pipa)
│  ← 0 cm dari sensor
│
│  45 cm di atas tanah
│
├──── Permukaan Tanah ──── ← 45 cm dari sensor
│
│  15 cm di bawah tanah
│
└──── Dasar Pipa ──────── ← 60 cm dari sensor
```

Sensor ultrasonik di puncak pipa mengukur jarak ke permukaan air. Level air dihitung relatif terhadap permukaan tanah (positif = di atas tanah, negatif = di bawah tanah).

---

## 2. Tujuan Produk

Membangun perangkat IoT yang mampu:

* Mengukur level air tanah secara berkala menggunakan pipa vertikal.
* Mengirim data ke server menggunakan jaringan GSM/GPRS.
* Menampilkan data secara real-time pada dashboard web.
* Memberikan informasi status ketika level air berada di kondisi kekeringan atau kelebihan air.
* Beroperasi mandiri menggunakan panel surya dan baterai LiFePO4.

---

## 3. Target Pengguna

* Petani dan pengelola lahan pertanian.
* Masyarakat sekitar daerah rawan kekeringan atau banjir.
* Pemerintah desa atau kelurahan.
* Peneliti dan akademisi.
* Instansi pengelola sumber daya air.

---

## 4. Komponen Hardware

### Sensor

* JSN-SR04T Waterproof Ultrasonic Sensor

### Mikrokontroler

* ESP32

### Komunikasi

* SIM800C GSM/GPRS Module

### Sistem Daya

* Panel surya 100W
* Solar Charge Controller PWM
* Baterai LiFePO4 12V
* LM2596 Step Down Converter

### Pipa

* Pipa PVC vertikal 60cm total (45cm di atas tanah + 15cm di bawah tanah)

---

## 5. Fitur Utama

### 5.1 Monitoring Level Air Tanah

* Sensor mengukur jarak ke permukaan air setiap interval tertentu.
* Data dikonversi menjadi level air relatif terhadap permukaan tanah.
* Level air positif = di atas tanah, negatif = di bawah tanah.

### 5.2 Pengiriman Data

* Data dikirim melalui jaringan GSM menggunakan GPRS.
* Interval pengiriman dapat diatur.

### 5.3 Dashboard Web

Dashboard menampilkan:

* Level air terkini (relatif terhadap permukaan tanah).
* Grafik histori pergerakan air.
* Status kondisi air (AMAN / KEKERINGAN / KELEBIHAN AIR).
* Indikator gauge level pipa.
* Log pengiriman data dalam bentuk teks.
* Waktu pembaruan terakhir.
* Tegangan baterai perangkat.
* Kualitas sinyal GSM.

---

## 6. Status Level Air

| Level Air (relatif tanah) | Jarak Sensor  | Status         |
| ------------------------- | ------------- | -------------- |
| > +10 cm (di atas tanah)  | ≤ 35 cm       | KELEBIHAN AIR  |
| -10 s/d +10 cm            | 35 – 55 cm    | AMAN           |
| < -10 cm (di bawah tanah) | ≥ 55 cm / N/A | KEKERINGAN     |

Nilai ambang dapat diubah sesuai kondisi lapangan.

---

## 7. Data yang Dikirim ke Server

```json
{
  "device_id": "flood-node-01",
  "water_level_cm": 5.2,
  "battery_voltage": 13.1,
  "signal_strength": 14,
  "status": "AMAN",
  "timestamp": "2026-06-27T12:30:00Z"
}
```

Catatan: `water_level_cm` bisa bernilai negatif (air di bawah tanah).

---

## 8. Struktur Database

### Tabel: water_monitoring

| Field           | Tipe Data |
| --------------- | --------- |
| id              | bigint    |
| device_id       | text      |
| water_level_cm  | float     |
| battery_voltage | float     |
| signal_strength | integer   |
| status          | text      |
| created_at      | timestamp |

Status valid: `AMAN`, `KEKERINGAN`, `KELEBIHAN AIR`

---

## 9. Arsitektur Sistem

Sensor JSN-SR04T (dalam pipa)
↓
ESP32
↓
SIM800C (GPRS)
↓
API Backend
↓
Database PostgreSQL
↓
Dashboard Web

---

## 10. Non Functional Requirements

* Sistem berjalan 24 jam.
* Konsumsi daya rendah.
* Tahan terhadap kondisi luar ruangan.
* Data tersimpan minimal selama 1 tahun.
* Dashboard dapat diakses melalui perangkat mobile dan desktop.

---

## 11. Tahapan Pengembangan

### Fase 1

* Pengujian sensor ultrasonik dengan pipa.
* Pengujian komunikasi GSM.

### Fase 2

* Pengiriman data menggunakan GPRS.
* Pembuatan API backend.
* Integrasi database.

### Fase 3

* Pembuatan dashboard web.
* Pengujian lapangan.
* Optimasi konsumsi daya.

---

## 12. Kriteria Keberhasilan

* Data level air berhasil dikirim ke server minimal 95%.
* Dashboard menampilkan data kurang dari 30 detik setelah pengukuran.
* Sistem dapat beroperasi secara mandiri menggunakan tenaga surya.
* Status KEKERINGAN dan KELEBIHAN AIR terdeteksi dengan akurat.
