# Atithi VMS (Visitor Management System)

Atithi VMS is an AI-powered, multi-tenant Visitor Management System designed for modern organizations to secure their workplaces, automate visitor check-ins, streamline host approvals, and maintain accurate audit logs.

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Solution](#solution)
- [Features](#features)
- [User Roles](#user-roles)
- [Workflow](#workflow)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Database Design](#database-design)
- [API Documentation](#api-documentation)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Enhancements](#future-enhancements)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

Atithi VMS provides an enterprise-grade solution for managing visitors across multiple locations and departments. It enables front-desk operations to register visitors with face-biometrics, automatically triggers instant notifications to employee hosts via Telegram for real-time approvals, manages blacklist profiles, and generates comprehensive reports and analytics.

---

## Problem Statement

Traditional paper-based visitor logbooks are insecure, hard to search, and prone to data leakage. Front desks often lack real-time mechanisms to verify visitor identities, warn of blacklisted individuals, or notify hosts of a guest's arrival instantly, resulting in security bottlenecks and communication gaps.

---

## Solution

Atithi VMS digitizes and automates the entire check-in workflow. By utilizing AI-powered face recognition, automated Telegram notifications, role-based access control, and tenant data isolation, the system ensures seamless workspace security, quick identity verification, and efficient communication between front desks and hosts.

---

## Features

### 🏢 Multi-Tenancy & Location Support
- **Multi-Tenant Isolation:** Secure data separation ensuring that different companies (tenants) can use the same server instance without cross-access.
- **Office/Branch Management:** Manage multiple offices, branches, and rooms (realms) under a single tenant.

### 👤 Guest Management & Security
- **Biometric Identity Scanning:** AI face recognition that captures and creates face embeddings to identify returning guests or flag blacklisted profiles.
- **Blacklist Restrictions:** Identify and restrict unwanted individuals with direct visual alerts at the reception desk.
- **Custom Master Data:** Configurable fields for visit purposes, departments, and ID card types.

### 💬 Real-Time Workflows
- **Instant Notifications:** Automatic Telegram messages dispatched to host employees when their visitor checks in.
- **Approval Actions:** Hosts can approve or reject visitor access requests with a single click from their dashboard.

### 📈 Reports & Logs
- **Analytics Dashboard:** Graphical widgets showcasing daily traffic volume, hourly check-in frequency, and department breakdowns.
- **Comprehensive Audit Trails:** Automatic logging of user logins, visitor registrations, check-in attempts, and profile modifications.

---

## User Roles

### Super Admin
- Full access to register and manage Tenants (Companies).
- View global system logs and dashboard metrics.
- Configure global Master Data categories.

### Tenant Admin
- Manage offices, branches, and realms.
- Create and edit Employee accounts (Receptionists, Managers, Hosts).
- Manage customized tenant master data (purposes, departments).
- Access tenant-level logs and reports.

### Manager
- View tenant-level analytics and reports.
- Manage employee directories and view visit histories.

### Receptionist
- Register new visitors, capture photos, and run face matching.
- Initiate visit logs and select hosts.
- Perform visitor check-in and check-out.

### Employee (Host)
- View personal dashboard and upcoming appointments.
- Approve or reject pending visits in real-time.
- Update personal profile details (such as Telegram IDs for notifications).

### Security
- View active visitor logs inside the premises.
- Check visitors out at exits.

---

## Workflow

### Step 1: Visitor Arrival & Identification
The visitor arrives at the reception desk, and the receptionist initiates a quick camera scan. The backend uses the face service to extract an embedding and match it against existing profiles.

### Step 2: Form Check-In
If a match is found, guest details are pre-filled; otherwise, a new guest profile is registered. The receptionist selects the host employee and submits the check-in request.

### Step 3: Approval & Notification
The backend creates a pending visit log and dispatches an instant Telegram notification to the host. The host approves or rejects the request. Once approved, the guest enters. When the meeting ends, they check out.

Flow Diagram:

```text
Visitor Arrives
 |
 v
Face Scan (Biometric Recognition)
 |
 +---> Match Found -> Autofill Visitor Details
 |
 +---> New Guest -> Register Profile
 |
 v
Submit Check-In (Select Host & Purpose)
 |
 v
Dispatches Telegram Notification to Host
 |
 +---> Host Approves -> Checked-In (Active)
 |
 +---> Host Rejects  -> Rejected Entry
 |
 v
Check-Out at exit (Visit Ends)
```

---

## Architecture

Atithi VMS is built on a decoupled, microservices-oriented architecture:

```text
       ┌───────────┐
       │  Browser  │ (React.js Frontend SPA)
       └─────┬─────┘
             │ HTTP / JWT
             ▼
     ┌───────────────┐
     │ Node.js Server│ (Express.js REST APIs)
     └───────┬───────┘
             ├──────────────────────┬──────────────────────┐
             ▼                      ▼                      ▼
     ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
     │ MongoDB Atlas │      │ Python Server │      │  Cloudinary   │
     │  (Datastore)  │      │ (InsightFace) │      │(Photo Storage)│
     └───────────────┘      └───────────────┘      └───────────────┘
```

---

## Technology Stack

- **Frontend:** React.js, Tailwind CSS, TanStack Query, Axios, Lucide React, IndexedDB (Dexie)
- **Backend:** Node.js, Express.js, Mongoose, JWT, Swagger Docs
- **AI Service:** Python, Flask, InsightFace, OpenCV, NumPy
- **Third Party Integrations:** Cloudinary (Media storage), Telegram Bot API (Instant alerts)

---

## Database Design

### Tenant Collection
```javascript
{
  name: String,
  code: String,
  email: String,
  plan: String, // 'basic', 'premium', 'enterprise'
  status: String // 'active', 'suspended'
}
```

### Office Collection
```javascript
{
  tenant_id: ObjectId (ref: 'Tenant'),
  name: String,
  city: String,
  address: String,
  is_active: Boolean
}
```

### Employee Collection
```javascript
{
  name: String,
  email: String,
  password: String (bcrypt-hashed),
  phone: String,
  telegram_id: String,
  department: String,
  role: String, // 'admin', 'manager', 'receptionist', 'security', 'employee'
  office_id: ObjectId (ref: 'Office'),
  last_login: Date
}
```

### Visitor Collection
```javascript
{
  name: String,
  phone: String,
  id_number: String,
  photo_url: String,
  face_data: String (JSON stringified array of embeddings),
  is_blacklisted: Boolean,
  blacklist_reason: String,
  email: String,
  company_name: String,
  id_type: String,
  address: String,
  tenant_id: ObjectId (ref: 'Tenant'),
  realm_id: ObjectId (ref: 'Office')
}
```

### Visit Collection
```javascript
{
  visitor_id: ObjectId (ref: 'Visitor'),
  host_id: ObjectId (ref: 'Employee'),
  office_id: ObjectId (ref: 'Office'),
  purpose: String,
  notes: String,
  reason: String,
  check_in: Date,
  check_out: Date,
  status: String, // 'pending', 'approved', 'rejected', 'exited'
  tenant_id: ObjectId (ref: 'Tenant'),
  realm_id: ObjectId (ref: 'Office')
}
```

---

## API Documentation

The project includes an interactive Swagger API playground.

To access Swagger, run the backend server and visit:
```text
http://localhost:8080/api-docs
```

---

## Installation

### 1. Clone the repository
```bash
git clone https://github.com/AbhiralJain07/visitor-management-system.git
cd visitor-management-system
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend
npm install
```

---

## Configuration

### Backend Setup
Create a `.env` file in the `backend/` folder:
```env
PORT=8080
MONGODB_URI=mongodb_srv_uri
JWT_SECRET=super_secret_jwt_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
```

### Frontend Setup
Create a `.env` file in the `frontend/` folder:
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

---

## Usage

### Run Backend
```bash
cd backend
npm run dev
```

### Run Frontend
```bash
cd frontend
npm run dev
```

The React app will be served locally at `http://localhost:5173`.

---

## Screenshots

*(Screenshots to be added here dynamically upon live deployment)*

---

## Future Enhancements

- **OCR Scanning:** Extracting details directly from IDs (Aadhar, driving license, passports).
- **QR Passports:** Generating print or digital QR passes for scanning at smart turnstiles.
- **WhatsApp Alerts:** Sending WhatsApp check-in and approval triggers alongside Telegram notifications.
- **Offline Sync (PWA):** Seamless check-in support when internet is temporarily disconnected.

---

## Contributors

- **Abhiral Jain** - Lead Developer & Architect

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
