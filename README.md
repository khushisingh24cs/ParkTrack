# ParkTrack 🚗

### Parking Violation Reporting & Enforcement Management System

ParkTrack is a web-based application designed to simplify parking violation reporting, validation, tracking, and enforcement management. It uses automata-based validation and classification to support efficient violation processing and handler assignment.

## 🌐 Live Application

**[Click here to visit ParkTrack](https://parktrack-client.onrender.com)**

## 📂 GitHub Repository

[View the ParkTrack source code](https://github.com/khushisingh24cs/ParkTrack)

## ✨ Features

- **Violation Reporting** – Submit parking violation reports.
- **Report Tracking** – View and track submitted reports.
- **Automata-Based Validation** – Validate vehicle numbers and violation codes using a Python service.
- **Violation Classification** – Classify violations and identify unmapped codes.
- **Handler Dashboard** – Manage enforcement handlers and their availability.
- **Routing Management** – Configure zone coverage and handler assignments.
- **Auto-Dispatch** – Assign pending reports to suitable handlers.
- **Analytics Dashboard** – View report and enforcement statistics.
- **Validation Lab** – Test automata validation, classification, and comparison.

## 🛠️ Technologies Used

| Component | Technology |
|---|---|
| Frontend | React, Vite |
| Styling | Tailwind CSS |
| Backend | Node.js, Express |
| Automata Service | Python, Flask |
| Database | MongoDB Atlas / In-Memory fallback |
| Deployment | Render |

## 🏗️ System Architecture

ParkTrack consists of three main services:

1. **React Frontend** – Provides the user interface.
2. **Express Backend** – Handles API requests, reports, handlers, routing, and dispatch.
3. **Python Automata Service** – Performs vehicle number validation, violation-code validation, and classification.

The frontend communicates with the Express backend, which communicates with the Python Automata service when validation or classification is required.

## 📁 Project Structure

```text
ParkTrack/
├── client/              # React frontend
├── server/              # Express backend
├── automata-service/    # Python Flask service
├── README.md
└── .gitignore
```

## 🚀 Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/khushisingh24cs/ParkTrack.git
cd ParkTrack
```

### 2. Start the Python Automata Service

```bash
cd automata-service
pip install -r requirements.txt
python app.py
```

### 3. Start the Express Backend

Open another terminal:

```bash
cd server
npm install
npm start
```

### 4. Start the React Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the local URL displayed by Vite in your browser.

## ☁️ Deployment

The application is deployed using Render.

- Frontend: Render Static Site
- Express Backend: Render Web Service
- Python Automata: Render Web Service

Environment variables are used to configure service URLs and database connectivity.

## 🎯 Project Objective

The objective of ParkTrack is to provide a centralized platform for parking violation reporting and enforcement management, combining web technologies with automata-based validation to improve the efficiency and reliability of violation processing.

## 👩‍💻 Developed as an Academic Project

ParkTrack was developed as an academic project to demonstrate full-stack web development, backend API integration, automata-based validation, and deployment of interconnected services.
