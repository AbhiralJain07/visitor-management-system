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

server/
├── controllers/
├── routes/
├── models/
├── middlewares/
├── services/

client/
├── components/
├── pages/
├── services/

## Future Enhancements

- OCR ID Scanning
- QR Based Pass
- WhatsApp Integration
- Offline Mode
- HRMS Integration
- AI Visitor Analytics

## Status

Currently under development.
