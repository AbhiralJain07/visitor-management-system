# 🏢 AI-Native Visitor Management System (VMS)

Enterprise-level visitor management system with AI-powered face recognition, multi-tenancy, and real-time notifications.

---

## 🚀 Tech Stack

| Component | Technology |
|-----------|-----------|
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| AI/Face Recognition | Python + InsightFace |
| Photo Storage | Cloudinary |
| Notifications | Telegram Bot |
| Authentication | JWT |
| Documentation | Swagger |

---

## 📁 Project Structure

```
visitor-management-system/
├── backend/                 ← Node.js Server
│   ├── models/              ← Database Models
│   │   ├── Tenant.js        ← Companies
│   │   ├── Realm.js         ← Offices/Branches
│   │   ├── User.js          ← All Users
│   │   ├── Visitor.js       ← Visitors
│   │   ├── Visit.js         ← Visit Records
│   │   ├── MasterType.js    ← Data Categories
│   │   └── MasterData.js    ← Master Data
│   ├── routes/              ← API Routes
│   │   ├── auth.js          ← Login/Register
│   │   ├── tenants.js       ← Companies CRUD
│   │   ├── realms.js        ← Offices CRUD
│   │   ├── users.js         ← Users CRUD
│   │   ├── visitors.js      ← Visitors CRUD
│   │   ├── visits.js        ← Visits CRUD
│   │   ├── masterTypes.js   ← MasterTypes CRUD
│   │   └── masterData.js    ← MasterData CRUD
│   ├── middleware/
│   │   └── auth.js          ← JWT + Role Check
│   ├── cloudinary.js        ← Photo Upload
│   ├── telegram.js          ← Notifications
│   ├── faceService.js       ← Face Recognition
│   └── server.js            ← Main Server
└── face-service/            ← Python AI Server
    └── app.py               ← Flask + InsightFace
```

---

## ⚙️ Setup

### Prerequisites
- Node.js v18+
- Python 3.10+
- MongoDB Atlas Account
- Cloudinary Account
- Telegram Bot Token

### Backend Setup

```bash
cd backend
npm install
```

`.env` file banao:
```env
PORT=8080
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
TELEGRAM_BOT_TOKEN=your_bot_token
```

Server start karo:
```bash
npm run dev
```

### Face Recognition Setup

```bash
cd face-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

---

## 📖 API Documentation

Swagger UI:
```
http://localhost:8080/api-docs
```

---

## 👥 User Roles & Permissions

| Feature | Super Admin | Tenant Admin | Receptionist | Employee |
|---------|------------|--------------|--------------|----------|
| Manage Companies | ✅ | ❌ | ❌ | ❌ |
| Manage Offices | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ✅ | ❌ | ❌ |
| Manage Master Data | ✅ | ✅ | ❌ | ❌ |
| Add Visitors | ✅ | ✅ | ✅ | ❌ |
| Face Identify | ✅ | ✅ | ✅ | ❌ |
| Create Visits | ✅ | ✅ | ✅ | ❌ |
| Approve/Reject | ✅ | ✅ | ✅ | ✅ |
| View Own Visits | ✅ | ✅ | ✅ | ✅ |
| Blacklist Visitor | ✅ | ✅ | ❌ | ❌ |
| Global Reports | ✅ | ❌ | ❌ | ❌ |

---

## 🔄 Complete API Flow

### Step 1 — Super Admin Setup

```bash
# 1. Super Admin Register (sirf ek baar!)
POST /api/auth/super-admin/register
{
  "name": "Super Admin",
  "email": "admin@vms.com",
  "password": "securepassword"
}

# 2. Login
POST /api/auth/login
{
  "email": "admin@vms.com",
  "password": "securepassword"
}
# → token milega

# 3. Company banao
POST /api/tenants
Authorization: Bearer <token>
{
  "name": "TCS",
  "code": "TCS",
  "email": "admin@tcs.com",
  "plan": "enterprise"
}

# 4. Office banao
POST /api/realms
{
  "name": "Delhi HQ",
  "code": "DEL",
  "tenant_id": "<tcs_id>",
  "city": "Delhi"
}

# 5. Tenant Admin banao
POST /api/users
{
  "name": "Rahul Sharma",
  "email": "rahul@tcs.com",
  "password": "password",
  "role": "tenant_admin",
  "tenant_id": "<tcs_id>",
  "realm_id": "<delhi_id>"
}

# 6. Master Data setup
POST /api/master-types
{
  "code": "VISIT_PURPOSE",
  "name": "Visit Purpose",
  "is_global": true
}

POST /api/master-data
{
  "master_type_id": "<type_id>",
  "code": "MEETING",
  "name": "Meeting",
  "translations": {
    "hi": "मीटिंग",
    "ta": "சந்திப்பு"
  },
  "is_global": true
}
```

### Step 2 — Tenant Admin Setup

```bash
# Login
POST /api/auth/login
{
  "email": "rahul@tcs.com",
  "password": "password"
}

# Receptionist banao
POST /api/users
{
  "name": "Priya Singh",
  "email": "priya@tcs.com",
  "password": "password",
  "role": "receptionist"
}

# Employee banao
POST /api/users
{
  "name": "Ramesh Kumar",
  "email": "ramesh@tcs.com",
  "password": "password",
  "role": "employee",
  "telegram_id": "7905910620"
}
```

### Step 3 — Receptionist Flow

```bash
# Face scan karo
POST /api/visitors/identify
Content-Type: multipart/form-data
photo: <image_file>

# Naya visitor add karo
POST /api/visitors
Content-Type: multipart/form-data
name: Suresh Sharma
phone: 9876543210
id_number: AADHAR123456
photo: <image_file>

# Visit create karo
POST /api/visits
{
  "visitor_id": "<visitor_id>",
  "host_id": "<employee_id>",
  "purpose": "Meeting"
}
# → Telegram notification jayegi employee ko!
```

### Step 4 — Employee Flow

```bash
# Pending visits dekho
GET /api/visits

# Approve karo
PUT /api/visits/<visit_id>
{
  "status": "approved"
}

# Reject karo
PUT /api/visits/<visit_id>
{
  "status": "rejected"
}
```

### Step 5 — Checkout

```bash
PUT /api/visits/<visit_id>
{
  "status": "exited",
  "check_out": "2026-05-29T17:30:00.000Z"
}
```

---

## 🌍 Localization

Supported Languages:
- 🇬🇧 English (`en`)
- 🇮🇳 Hindi (`hi`)
- 🇮🇳 Tamil (`ta`)
- 🇮🇳 Telugu (`te`)
- 🇮🇳 Marathi (`mr`)

Language change karo:
```bash
PUT /api/users/language
{
  "language": "hi"
}
```

Master Data automatically us language mein aayega:
```bash
GET /api/master-data?type=VISIT_PURPOSE
# → display_name Hindi mein aayega!
```

---

## 🤖 Face Recognition

Python server PORT 5001 pe chalta hai:

```bash
# Face encode karo
POST http://localhost:5001/encode
{
  "image": "<base64_image>"
}

# Faces compare karo
POST http://localhost:5001/compare
{
  "embedding1": [...],
  "embedding2": [...]
}
```

---

## 🏗️ Multi-tenancy Architecture

```
Super Admin
└── Tenant (Company)
    ├── Realm (Office/Branch)
    │   └── Users (Admin/Receptionist/Employee)
    ├── Visitors
    ├── Visits
    └── Custom Master Data
```

**Important:** `tenant_id` aur `realm_id` token se automatically aata hai — frontend se mat bhejo!

---

## 🔒 Security

- JWT tokens 24 ghante mein expire hote hain
- Passwords bcrypt se encrypt hote hain
- Role-based access control (RBAC)
- Tenant data isolation
- Photos Cloudinary pe secure store hoti hain

---

## 🤝 Frontend Integration

### Environment Variables

```env
REACT_APP_API_URL=http://localhost:8080/api
REACT_APP_FACE_SERVICE_URL=http://localhost:5001
```

### Token Management

```javascript
// Login ke baad save karo
localStorage.setItem('token', response.token)
localStorage.setItem('user', JSON.stringify(response.user))

// Har API call mein
headers: {
  'Authorization': `Bearer ${localStorage.getItem('token')}`
}

// Role based routing
const role = JSON.parse(localStorage.getItem('user')).role
if (role === 'super_admin')  navigate('/super-admin')
if (role === 'tenant_admin') navigate('/admin')
if (role === 'receptionist') navigate('/receptionist')
if (role === 'employee')     navigate('/employee')
```

### Face Recognition (Camera)

```javascript
// Camera se photo lo
const stream = await navigator.mediaDevices.getUserMedia({ video: true })

// Frame capture karo
const canvas = document.createElement('canvas')
canvas.drawImage(video, 0, 0)
const blob = await new Promise(resolve => canvas.toBlob(resolve))

// API call karo
const formData = new FormData()
formData.append('photo', blob, 'photo.jpg')

const response = await fetch(`${API_URL}/visitors/identify`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
```

---

## 📞 Support

- Swagger Docs: `http://localhost:8080/api-docs`
- GitHub: `https://github.com/AbhiralJain07/visitor-management-system`