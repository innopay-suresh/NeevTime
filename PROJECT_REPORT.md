# TimeNexa/AMS Project Report

## 1. Executive Summary
TimeNexa (formerly EasyTime Pro) is a comprehensive Attendance Management System (AMS) designed to streamline workforce management. It integrates real-time biometric data, advanced shift planning, and detailed reporting into a modern, responsive web application. This report outlines the technical architecture, key features, and system requirements.

## 2. Technical Architecture
The application follows a modern 3-tier architecture:

### Frontend (Client)
*   **Framework:** React 18 with Vite (SPA).
*   **Styling:** Tailwind CSS with a custom "Saffron & Slate" design system.
*   **State Management:** React Hooks (`useState`, `useEffect`).
*   **Routing:** React Router v6.
*   **Visualization:** Recharts for analytics.
*   **Icons:** Lucide React.
*   **Communication:** Axios (HTTP), Socket.IO Client (Real-time).

### Backend (Server)
*   **Runtime:** Node.js (Express framework).
*   **Database Interface:** `pg` (node-postgres) for raw SQL queries.
*   **Device Communication:** `node-zklib` and custom ADMS (Automatic Data Master Server) implementation for push-based biometrics.
*   **Real-time:** Socket.IO Server.
*   **Security:** JWT (JSON Web Tokens) for authentication.

### Database
*   **System:** PostgreSQL 15+.
*   **Schema:** Relational schema managing `employees`, `attendance_logs`, `devices`, `shifts`, `users`, and `departments`.

## 3. Key Modules

### A. Dashboard
*   **Real-time Monitoring:** Live stream of employee punches.
*   **Analytics:** Visual breakdown of Present, Absent, Late, and Early leavers.
*   **Device Status:** Live online/offline status of biometric terminals.

### B. Personnel Management
*   **Employee Master:** Comprehensive CRUD for employee data including biometric flags.
*   **Organization Structure:** Hierarchical management of Departments, Areas, and Positions.

### C. Device Management
*   **Command Center:** Remote reboot, clear logs, and data sync commands.
*   **ADMS Integration:** Devices push data to the server automatically over HTTP.

### D. Attendance & Reports
*   **Shift Management:** Flexible shift rules and rostering.
*   **Reporting:** Exportable reports (CSV/PDF) for attendance summaries and daily logs.

## 4. System Requirements
*   **OS:** Linux (Ubuntu 20.04+ recommended), Windows Server, or macOS.
*   **Runtime:** Node.js v18+.
*   **Database:** PostgreSQL v13+.
*   **Hardware:** Minimum 2 vCPU, 4GB RAM (scales with user count).
*   **Network:** Static IP recommended for the server to allow device callbacks.

## 5. Security Features
*   **Authentication:** Secure Password Hashing (Bcrypt) and JWT Sessions.
*   **Network:** CORS protection and IP-based filtering capabilities.
