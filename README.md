# Secure Personal Vault 🛡️

**Secure Personal Vault** is a secure, modern, and mobile-first full-stack web application designed to act as a private digital safe. It allows users to encrypt and manage password credentials, draft notes, letters, private diaries, and upload documents. 

🔗 **Live Website:** [https://personal-vault-8rfm.vercel.app/]((https://personal-vault-fawn-five.vercel.app/))

The application is architected with a responsive mobile-first shell (incorporating a Bottom Navigation bar and FAB buttons on mobile viewports) making it ready to be converted into a native Android app using Capacitor, Cordova, or an Android WebView shell.

---

## 🚀 Key Features

### 1. 🔑 Encrypted Password Manager
*   **AES-256-GCM Encryption**: Credentials are cryptographically encrypted before being written to the database and decrypted in-memory only for authorized sessions.
*   **Show/Hide Toggle & One-Click Copy**: Easily reveal or copy credentials.
*   **Strength Indicator**: Visual progress bar analyzing password complexity.
*   **Random Generator**: Customize password generation (set length, toggle letters, digits, and symbols).

### 2. 📝 Personal Notes with Auto-Save
*   **Auto-Save Drafts**: Monitors typing and automatically writes note edits to the database 2 seconds after the user stops typing.
*   **Rich Text Editor**: Custom formatting toolbar (Bold, Italic, Underline, Bullet/Numbered Lists, and Blockquotes).

### 3. 📅 Daily Diary Calendar
*   **Monthly Calendar Grid**: View days of the month; days containing entry records show an amber indicator dot.
*   **Log Editor**: Click any day to compose today's log, edit entries, or search logs.

### 4. ✉️ Personal Letters
*   **Draft Checks**: Write and catalog letters, tracking word count metrics and toggle status between "Draft" or "Completed".

### 5. 📁 Secure Documents Upload
*   **File Previews**: Supports drag-and-drop file uploads up to 10MB (PDF, Images, Text documents) stored as Base64 strings.
*   **Inline Viewer**: View images, read decoded text documents, or view PDFs inline.
*   **Virtual Downloader**: Local generator to download files back to your device.

### 6. ⚙️ Profile & Hardware Locks (Android Ready)
*   **Mock Hardware Locks**: Toggles to simulate native Android Face Unlock, Biometric Fingerprint authentication, and App PIN Code locks.
*   **JSON Exporter/Importer**: One-click full database backup to a local JSON file, and restoration imports.
*   **Theme Switcher**: Supports seamless Light and Dark display mode toggles.

---

## 🛠️ Technology Stack

*   **Frontend**: React, TypeScript, Tailwind CSS v3, Lucide Icons.
*   **Backend**: Node.js, Express.js, Multer (file streams), Bcryptjs (password hashing), Jsonwebtoken (JWT).
*   **Database**: Neon Serverless PostgreSQL.

---

## 💻 Local Setup Instructions

### 1. Database Schema
1. Create a serverless database on [Neon](https://neon.tech/).
2. Copy the SQL commands from `backend/db_schema.sql` and run them inside the Neon **SQL Editor** to initialize the tables.

### 2. Backend Server Setup
1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Configure your credentials inside the `.env` file:
   ```env
   PORT=5000
   NEON_DATABASE_URL=your_neon_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   ENCRYPTION_KEY=your_32_byte_aes_encryption_key
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```

### 3. Frontend Client Setup
1. Navigate to the `frontend` folder:
   ```bash
   cd ../frontend
   ```
2. Install dependencies and start the Vite development server:
   ```bash
   npm install
   npm run dev
   ```
3. Open `http://localhost:5173` in your web browser.

---

## 📱 Mobile Emulation & Android WebView Testing

To preview the Android layout:
1. Open the application in Google Chrome.
2. Open DevTools (`F12`) and toggle the device toolbar (`Ctrl+Shift+M`).
3. Select a mobile device template (e.g., **Pixel 7**).
4. The sidebar navigation will auto-collapse, rendering the **Bottom Navigation Bar** and the bottom-right **Floating Action Buttons (FAB)**.
