models/
├── Visitor.js    ✅ (name, phone, photo, face_data, blacklist)
├── Employee.js   ✅ (name, email, password, role, telegram_id)
├── Visit.js      ✅ (visitor, host, office, status, check_in/out)
└── Office.js     ✅ (name, city, address, is_active)

routes/
├── auth.js       ✅ (register, login + JWT)
├── visitors.js   ✅ (CRUD + face identify + blacklist)
├── visits.js     ✅ (CRUD + Telegram notification)
├── employees.js  ✅ (CRUD)
└── offices.js    ✅ (CRUD)

middleware/
└── auth.js       ✅ (JWT verify + Role check)

Other:
├── server.js     ✅ (Express + MongoDB + Swagger)
├── cloudinary.js ✅ (Photo upload)
├── telegram.js   ✅ (Notifications)
├── faceService.js✅ (Face recognition API call)
└── .env          ✅ (All secrets)