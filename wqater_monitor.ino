/*
 * ============================================================
 * Sistem Monitoring Level Air Tanah Berbasis IoT
 * ============================================================
 * Konsep Pipa:
 *   Sensor JSN-SR04T dipasang di puncak pipa vertikal.
 *   Pipa: 15cm di bawah tanah + 45cm di atas tanah = 60cm total.
 *   Sensor mengukur jarak ke permukaan air di dalam pipa.
 *
 *   Sensor (0cm)
 *   │  45cm di atas tanah
 *   ├── Permukaan Tanah (45cm dari sensor)
 *   │  15cm di bawah tanah
 *   └── Dasar Pipa (60cm dari sensor)
 *
 * Status:
 *   KELEBIHAN AIR : Jarak sensor ≤ 35cm (air > 10cm di atas tanah)
 *   AMAN          : Jarak sensor 35-55cm (air ±10cm dari tanah)
 *   KEKERINGAN    : Jarak sensor ≥ 55cm atau tidak ada echo
 *
 * Hardware:
 *   - ESP32 DevKit
 *   - JSN-SR04T Waterproof Ultrasonic Sensor
 *   - SIM800C GSM/GPRS Module
 *   - Panel Surya 100W + LiFePO4 12V + LM2596
 *
 * Wiring:
 *   JSN-SR04T:
 *     Trigger -> GPIO 5
 *     Echo    -> GPIO 18
 *     VCC     -> 5V
 *     GND     -> GND
 *
 *   SIM800C (via HardwareSerial2):
 *     TX (SIM800C) -> GPIO 16 (RX2 ESP32)
 *     RX (SIM800C) -> GPIO 17 (TX2 ESP32)
 *     VCC          -> 5V/2A dedicated supply
 *     GND          -> Common GND
 *
 *
 * Libraries:
 *   - TinyGSM (https://github.com/vshymanskyy/TinyGSM)
 *   - ArduinoHttpClient
 *   - ArduinoJson
 * ============================================================
 */

// ==================== CONFIGURATION ====================

// -- Modem Configuration --
#define TINY_GSM_MODEM_SIM800
#define TINY_GSM_RX_BUFFER 1024

#include <TinyGsmClient.h>
#include <ArduinoHttpClient.h>
#include <ArduinoJson.h>

// -- Pin Definitions --
#define TRIGGER_PIN       5     // D5       
#define ECHO_PIN          18    // D18
#define SIM800_TX_PIN     17    // ESP32 TX -> SIM800C RX
#define SIM800_RX_PIN     16    // ESP32 RX <- SIM800C TX

// -- Serial Configuration --
#define SerialMon         Serial
#define SerialAT          Serial2
#define GSM_BAUD          9600
#define MONITOR_BAUD      115200

// -- Network Configuration --
const char APN[]          = "internet";          // Ganti sesuai provider (Telkomsel: "internet", Indosat: "indosatgprs")
const char APN_USER[]     = "";
const char APN_PASS[]     = "";

// -- Server Configuration (ThingSpeak Proxy) --
const char SERVER_HOST[]  = "api.thingspeak.com";
const int  SERVER_PORT    = 80;
const char API_ENDPOINT[] = "/apps/thinghttp/send_request?api_key=2YJ86N4P6BTSOBRK";

// -- ThingHTTP untuk membaca config kalibrasi dari Firebase --
// Buat ThingHTTP baru di thingspeak.com/apps/thinghttp:
//   URL: https://water-monitoring-iot-9046e-default-rtdb.asia-southeast1.firebasedatabase.app/config.json
//   Method: GET
// Lalu ganti API key di bawah ini:
const char CONFIG_ENDPOINT[] = "/apps/thinghttp/send_request?api_key=8BDN3RI0XZDFLXYG";

// -- Device Configuration --
const char DEVICE_ID[]    = "flood-node-01";

// -- Sensor & Pipe Configuration --
const float SPEED_OF_SOUND        = 0.0343;  // cm/µs (at ~20°C)
const float PIPE_ABOVE_GROUND_CM  = 45.0;    // Panjang pipa di atas tanah (cm)
const float PIPE_BELOW_GROUND_CM  = 15.0;    // Panjang pipa di bawah tanah (cm)
const float PIPE_TOTAL_CM         = 60.0;    // Total pipa (45 + 15)

// -- Threshold berdasarkan JARAK dari sensor (cm) --
const float THRESHOLD_KELEBIHAN_AIR = 35.0;  // Jarak ≤ 35cm = KELEBIHAN AIR
const float THRESHOLD_KEKERINGAN    = 55.0;  // Jarak ≥ 55cm = KEKERINGAN

// -- Timing: Mode Kalibrasi vs Normal --
const unsigned long CALIBRATION_INTERVAL_MS  = 5 * 1000;           // 5 detik (kalibrasi)
const unsigned long NORMAL_INTERVAL_MS       = 3UL * 60 * 60 * 1000; // 3 jam (normal)
const unsigned long CONFIG_CHECK_INTERVAL_MS = 5UL * 60 * 1000;   // Cek config tiap 5 menit
const bool USE_DEEP_SLEEP = false;  // Set true untuk hemat daya

// ==================== GLOBAL OBJECTS ====================

TinyGsm modem(SerialAT);
TinyGsmClient gsmClient(modem);
HttpClient http(gsmClient, SERVER_HOST, SERVER_PORT);

// Calibration globals (dibaca dari Firebase)
bool calibrationMode = false;
float calibrationOffset = 0.0; // Offset kalibrasi sensor (cm)

// ==================== SETUP ==

void setup() {
  // Initialize Serial Monitor
  SerialMon.begin(MONITOR_BAUD);
  delay(100);

  SerialMon.println();
  SerialMon.println(F("========================================"));
  SerialMon.println(F(" Sistem Monitoring Level Air Tanah v2.0"));
  SerialMon.println(F("========================================"));

  // Initialize sensor pins
  pinMode(TRIGGER_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Initialize SIM800C Serial
  SerialAT.begin(GSM_BAUD, SERIAL_8N1, SIM800_RX_PIN, SIM800_TX_PIN);
  delay(3000);  // Wait for SIM800C to boot

  // Initialize modem
  SerialMon.println(F("[MODEM] Initializing..."));
  if (!modem.restart()) {
    SerialMon.println(F("[MODEM] Restart failed, trying init..."));
    modem.init();
  }

  String modemInfo = modem.getModemInfo();
  SerialMon.print(F("[MODEM] Info: "));
  SerialMon.println(modemInfo);

  // Wait for network
  SerialMon.println(F("[MODEM] Waiting for network..."));
  if (!modem.waitForNetwork(60000L)) {
    SerialMon.println(F("[MODEM] Network connection failed!"));
    handleError();
    return;
  }
  SerialMon.println(F("[MODEM] Network connected."));

  // Connect GPRS
  SerialMon.print(F("[GPRS] Connecting to APN: "));
  SerialMon.println(APN);
  if (!modem.gprsConnect(APN, APN_USER, APN_PASS)) {
    SerialMon.println(F("[GPRS] Connection failed!"));
    handleError();
    return;
  }
  SerialMon.println(F("[GPRS] Connected."));
}

// ==================== MAIN LOOP ====================

void loop() {
  // 1. Ukur jarak sensor ke permukaan air (mentah)
  float rawDistance = measureDistance();
  
  // Terapkan offset kalibrasi (bisa plus atau minus)
  float distance = rawDistance + calibrationOffset;
  if (distance < 0) distance = 0; // Cegah nilai negatif dari offset

  // 2. Hitung level air relatif terhadap permukaan tanah
  //    Positif = di atas tanah, Negatif = di bawah tanah
  float waterLevel = calculateWaterLevel(distance);

  // 3. Tentukan status berdasarkan jarak sensor
  String status = determineStatus(distance);

  // 4. Baca data pendukung
  int signalStrength = modem.getSignalQuality();

  // 5. Log to Serial Monitor
  printData(distance, waterLevel, signalStrength, status);

  // 6. Send data to server
  bool sent = sendDataToServer(waterLevel, signalStrength, status);

  if (sent) {
    SerialMon.println(F("[THINGHTTP] Data sent successfully!"));
  } else {
    SerialMon.println(F("[THINGHTTP] Failed to send data."));
    reconnectGPRS();
  }

  // 7. Baca mode kalibrasi dari Firebase
  calibrationMode = readCalibrationMode();
  SerialMon.print(F("[CONFIG] Mode Kalibrasi: "));
  SerialMon.println(calibrationMode ? "AKTIF (5 detik)" : "NONAKTIF (3 jam)");

  // 8. Sleep/delay berdasarkan mode
  if (USE_DEEP_SLEEP) {
    SerialMon.println(F("[POWER] Entering deep sleep..."));
    modem.gprsDisconnect();
    unsigned long sleepUs = calibrationMode ? (5 * 1000000ULL) : (3UL * 60 * 60 * 1000000ULL);
    esp_deep_sleep(sleepUs);
  } else {
    if (calibrationMode) {
      // Mode kalibrasi: kirim setiap 5 detik
      delay(CALIBRATION_INTERVAL_MS);
    } else {
      // Mode normal: tunggu 3 jam, tapi cek config tiap 5 menit
      // agar bisa deteksi jika mode kalibrasi diaktifkan
      waitWithConfigCheck();
    }
  }
}

/**
 * Tunggu selama NORMAL_INTERVAL_MS (3 jam),
 * tapi cek config setiap CONFIG_CHECK_INTERVAL_MS (5 menit).
 * Jika mode kalibrasi terdeteksi aktif, langsung keluar dari delay.
 */
void waitWithConfigCheck() {
  unsigned long totalWait = NORMAL_INTERVAL_MS;     // 3 jam total
  unsigned long checkInterval = CONFIG_CHECK_INTERVAL_MS; // 5 menit per cek
  unsigned long waited = 0;

  while (waited < totalWait) {
    delay(checkInterval);
    waited += checkInterval;

    // Cek config dari Firebase
    SerialMon.println(F("[CONFIG] Cek mode kalibrasi..."));
    bool newMode = readCalibrationMode();

    if (newMode) {
      SerialMon.println(F("[CONFIG] Mode kalibrasi AKTIF! Keluar dari delay."));
      calibrationMode = true;
      return;  // Keluar, loop() akan kirim data dalam 5 detik
    }

    SerialMon.print(F("[CONFIG] Masih mode normal. Sudah tunggu: "));
    SerialMon.print(waited / 60000);
    SerialMon.print(F(" / "));
    SerialMon.print(totalWait / 60000);
    SerialMon.println(F(" menit"));
  }
}

// ==================== SENSOR FUNCTIONS ====================

/**
 * Mengukur jarak menggunakan ultrasonic sensor JSN-SR04T
 * Melakukan 5 pembacaan, buang outlier, hitung rata-rata
 * Return: jarak dalam cm (0 jika tidak ada echo)
 */
float measureDistance() {
  float readings[5];
  int validCount = 0;

  for (int i = 0; i < 5; i++) {
    // Send trigger pulse
    digitalWrite(TRIGGER_PIN, LOW);
    delayMicroseconds(2);
    digitalWrite(TRIGGER_PIN, HIGH);
    delayMicroseconds(10);
    digitalWrite(TRIGGER_PIN, LOW);

    // Read echo pulse
    long duration = pulseIn(ECHO_PIN, HIGH, 30000);  // Timeout 30ms

    if (duration > 0) {
      float dist = (duration * SPEED_OF_SOUND) / 2.0;
      // Filter: hanya terima jarak dalam range pipa (0 - PIPE_TOTAL_CM + margin)
      if (dist > 0 && dist <= PIPE_TOTAL_CM + 10) {
        readings[validCount] = dist;
        validCount++;
      }
    }
    delay(60);  // JSN-SR04T butuh min ~60ms antar pembacaan
  }

  if (validCount == 0) {
    return 0;  // Tidak ada echo valid
  }

  // Hitung rata-rata dari pembacaan valid
  float sum = 0;
  for (int i = 0; i < validCount; i++) {
    sum += readings[i];
  }
  return sum / validCount;
}

/**
 * Menghitung level air relatif terhadap permukaan tanah
 * Return: cm (positif = di atas tanah, negatif = di bawah tanah)
 *
 * Contoh:
 *   distance = 35cm → waterLevel = 45 - 35 = +10cm (10cm di atas tanah)
 *   distance = 45cm → waterLevel = 45 - 45 =   0cm (tepat di permukaan)
 *   distance = 55cm → waterLevel = 45 - 55 = -10cm (10cm di bawah tanah)
 */
float calculateWaterLevel(float distance) {
  if (distance == 0) {
    // Tidak ada pantulan → air sangat rendah atau tidak ada
    return -(PIPE_BELOW_GROUND_CM);  // Return -15 (dasar pipa)
  }
  return PIPE_ABOVE_GROUND_CM - distance;
}

// ==================== STATUS FUNCTIONS ====================

/**
 * Menentukan status berdasarkan jarak sensor ke air
 *
 * KELEBIHAN AIR : distance ≤ 35cm (air > 10cm di atas tanah)
 * AMAN          : distance 35-55cm (air ±10cm dari permukaan tanah)
 * KEKERINGAN    : distance ≥ 55cm atau tidak ada echo (air terlalu rendah)
 */
String determineStatus(float distance) {
  if (distance == 0) {
    return "KEKERINGAN";  // Tidak ada pantulan = tidak ada air
  }
  if (distance <= THRESHOLD_KELEBIHAN_AIR) {
    return "KELEBIHAN AIR";
  }
  if (distance >= THRESHOLD_KEKERINGAN) {
    return "KEKERINGAN";
  }
  return "AMAN";
}

// ==================== CALIBRATION CONFIG ====================

/**
 * Membaca mode kalibrasi dari Firebase via ThingHTTP
 * Firebase path: /config.json → { "node-01": {calibration_mode, offset_cm}, "node-02": {...} }
 * Setiap device membaca config miliknya berdasarkan DEVICE_ID
 * Return: true jika mode kalibrasi aktif
 */
bool readCalibrationMode() {
  // Pastikan GPRS masih terhubung
  if (!modem.isGprsConnected()) {
    SerialMon.println(F("[CONFIG] GPRS disconnected, skipping config read"));
    return calibrationMode;  // Kembalikan mode terakhir
  }

  SerialMon.println(F("[CONFIG] Membaca config dari Firebase..."));

  http.beginRequest();
  http.get(CONFIG_ENDPOINT);
  http.endRequest();

  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  SerialMon.print(F("[CONFIG] Response code: "));
  SerialMon.println(statusCode);
  SerialMon.print(F("[CONFIG] Response: "));
  SerialMon.println(response);

  if (statusCode != 200) {
    SerialMon.println(F("[CONFIG] Gagal baca config, gunakan mode terakhir"));
    return calibrationMode;
  }

  // Parse JSON response (bisa berisi config banyak device)
  StaticJsonDocument<512> doc;
  DeserializationError error = deserializeJson(doc, response);

  if (error) {
    SerialMon.print(F("[CONFIG] JSON parse error: "));
    SerialMon.println(error.c_str());
    return calibrationMode;
  }

  // Ambil config untuk device ini berdasarkan DEVICE_ID
  JsonObject myConfig = doc[DEVICE_ID];
  if (myConfig.isNull()) {
    SerialMon.println(F("[CONFIG] Config untuk device ini belum ada, gunakan default"));
    return false;
  }

  bool mode = myConfig["calibration_mode"] | false;
  calibrationOffset = myConfig["offset_cm"] | 0.0f;

  SerialMon.print(F("[CONFIG] Offset: "));
  SerialMon.print(calibrationOffset);
  SerialMon.println(F(" cm"));

  return mode;
}

// ==================== NETWORK FUNCTIONS ====================

/**
 * Mengirim data langsung ke Firebase Realtime Database (HTTPS)
 *
 * Alur: ESP32/SIM800C → HTTPS → Firebase
 */
bool sendDataToServer(float waterLevel, int signalStrength, String status) {
  // Build JSON payload
  StaticJsonDocument<256> doc;
  doc["device_id"]        = DEVICE_ID;
  doc["water_level_cm"]   = round(waterLevel * 10.0) / 10.0;
  doc["signal_strength"]  = signalStrength;
  doc["status"]           = status;
  
  // Request Firebase untuk mengisi waktu saat ini secara otomatis
  JsonObject ts = doc.createNestedObject("created_at");
  ts[".sv"] = "timestamp";

  String payload;
  serializeJson(doc, payload);

  SerialMon.print(F("[FIREBASE] Sending: "));
  SerialMon.println(payload);

  // Check GPRS connection
  if (!modem.isGprsConnected()) {
    SerialMon.println(F("[GPRS] Not connected, reconnecting..."));
    if (!reconnectGPRS()) {
      return false;
    }
  }

  // Format request body untuk ThingHTTP (x-www-form-urlencoded)
  String requestBody = "message=" + payload;

  // Send HTTP POST ke ThingSpeak (Port 80)
  http.beginRequest();
  http.post(API_ENDPOINT);
  http.sendHeader("Content-Type", "application/x-www-form-urlencoded");
  http.sendHeader("Content-Length", requestBody.length());
  http.beginBody();
  http.print(requestBody);
  http.endRequest();

  // Check response
  int statusCode = http.responseStatusCode();
  String response = http.responseBody();

  SerialMon.print(F("[THINGHTTP] Response code: "));
  SerialMon.println(statusCode);
  SerialMon.print(F("[THINGHTTP] Response: "));
  SerialMon.println(response);

  return (statusCode >= 200 && statusCode < 300);
}

/**
 * Reconnect GPRS jika terputus
 */
bool reconnectGPRS() {
  SerialMon.println(F("[GPRS] Attempting reconnection..."));

  modem.gprsDisconnect();
  delay(1000);

  if (!modem.waitForNetwork(30000L)) {
    SerialMon.println(F("[MODEM] Network reconnection failed."));
    return false;
  }

  if (!modem.gprsConnect(APN, APN_USER, APN_PASS)) {
    SerialMon.println(F("[GPRS] Reconnection failed."));
    return false;
  }

  SerialMon.println(F("[GPRS] Reconnected."));
  return true;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Print data ke Serial Monitor
 */
void printData(float distance, float waterLevel, int signalStrength, String status) {
  SerialMon.println(F("----------------------------------------"));
  SerialMon.print(F("[DATA] Jarak Sensor: "));
  SerialMon.print(distance, 1);
  SerialMon.println(F(" cm"));
  SerialMon.print(F("[DATA] Level Air   : "));
  SerialMon.print(waterLevel, 1);
  SerialMon.println(F(" cm (relatif tanah)"));
  SerialMon.print(F("[DATA] Signal      : "));
  SerialMon.println(signalStrength);
  SerialMon.print(F("[DATA] Status      : "));
  SerialMon.println(status);
  SerialMon.println(F("----------------------------------------"));
}

/**
 * Handle error - restart modem dan coba lagi
 */
void handleError() {
  SerialMon.println(F("[ERROR] Critical error, restarting in 30s..."));
  delay(30000);
  ESP.restart();
}
