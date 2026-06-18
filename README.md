# Atithi VMS

AI-powered Visitor Management System for organizations to manage visitor check-in, employee approvals, visitor history, and security tracking.

## Features

- Visitor Check-In / Check-Out
- Employee Directory
- Host Approval Workflow
- Face Recognition (Planned)
- Telegram Notifications
- Audit Logs
- Role-Based Access Control (RBAC)
- Multi-Location Support
- Visitor Reports & Analytics

## Tech Stack

Frontend:
- React.js
- Tailwind CSS

Backend:
- Node.js
- Express.js

Database:
- MongoDB Atlas

Other Services:
- Cloudinary
- Telegram Bot API
- Swagger

## Architecture

Visitor
→ Receptionist
→ Employee Approval
→ Check-In
→ Check-Out
→ Reports & Audit Logs

## Roles

### Super Admin
- Manage locations
- Manage users
- View analytics

### Location Admin
- Manage employees
- View reports
- Configure location settings

### Receptionist
- Register visitors
- Check-In / Check-Out visitors

### Employee
- Approve / Reject visitors
- View visit details

## Project Structure

```bash
visitor-management-system/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── routes/
│   │   └── utils/
│   │
│   └── public/
│
├── backend/
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── visitors/
│   │   │   ├── employees/
│   │   │   ├── visits/
│   │   │   ├── offices/
│   │   │   ├── notifications/
│   │   │   └── audit-logs/
│   │   │
│   │   ├── shared/
│   │   │   ├── middlewares/
│   │   │   ├── utils/
│   │   │   └── constants/
│   │   │
│   │   ├── config/
│   │   └── app.js
│   │
│   └── server.js
│
├── face-service/
│   ├── models/
│   ├── recognition/
│   └── app.py
│
├── docs/
├── .env.example
├── package.json
└── README.md
```

## Future Enhancements

- OCR ID Scanning
- QR Based Pass
- WhatsApp Integration
- Offline Mode
- HRMS Integration
- AI Visitor Analytics

## Status

Currently under development.

## Recent UI & Architecture Improvements (June 2026)

- **Consolidated Master Data**: Merged "Master Categories" and "Master Records" under a single, unified "Master Data" sidebar item. Management of both schemas is now handled via a high-performance tabbed interface inside the Super Admin dashboard.
- **Premium Design Upgrade**:
  - Re-themed the system typography with the **Plus Jakarta Sans** Google Font, providing a modern, sleek sans-serif style.
  - Implemented interactive glassmorphism-style card structures with hover lift micro-animations.
  - Embedded real-time SVG sparkline visualizers inside metric blocks to represent multi-day data trends directly.
  - Refactored dashboard charts (Recharts) with sleek visual gradients, custom Tooltip components, and clean grid alignment.
  - Added a premium segmented date-range pill selector (7 Days / 30 Days / 90 Days) for filtering dashboard metrics.
