# ParkTrack — Parking Violation Reporting & Enforcement Management System

ParkTrack is a full-stack parking violation reporting, validation, dispatch, and analytics platform integrating **Formal Languages & Automata Theory (DFA + Regular Expressions)**.

## Architecture

1. **Frontend (`client/`, port `5173`)** — React 18, Vite, Tailwind CSS, Recharts, Axios, React Router
   - Overview Dashboard, Report Submission, Track Reports (plus Rejected DFA Log), Handler Dashboard, Routing Management, Analytics, and Validation Lab.
2. **Main Backend (`server/`, port `5000`)** — Node.js, Express, Mongoose
   - REST APIs, automated zone/capacity-based handler dispatch, MongoDB Atlas persistence (with automatic seeded in-memory fallback when `MONGO_URI` is not set).
3. **Automata Microservice (`automata-service/`, port `5001`)** — Python Flask
   - Hand-coded DFAs and equivalent Regular Expressions for Indian vehicle registration numbers (`^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$`) and violation codes (`^PV[0-9]{2}$`), plus category mapping (`PV10–PV59` and `UNMAPPED`).

