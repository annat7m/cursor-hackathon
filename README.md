# 🛡️ Sentinel-Isolate

**The Zero-Trust Execution Layer for AI Agents.** *Built on Cloudflare Dynamic Workers & V8 Isolates*

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Cloudflare](https://img.shields.io/badge/Platform-Cloudflare_Workers-F38020?logo=cloudflare)](https://blog.cloudflare.com/dynamic-workers/)
[![Speed](https://img.shields.io/badge/Execution-~5ms-brightgreen)](#)

---

## 🚀 The Vision
AI Agents are powerful, but running the code they generate is a security nightmare. **Sentinel-Isolate** solves the "Untrusted Code" problem. By leveraging **Cloudflare Dynamic Workers**, we provide an ephemeral, secure sandbox that boots in milliseconds—not seconds—allowing AI to write and execute logic without risking your underlying infrastructure.

## 🛠️ Technical Architecture
Unlike traditional Docker-based sandboxes, Sentinel-Isolate uses **V8 Isolate-level virtualization**:

1.  **Pre-Flight Audit:** A specialized AI "Critic" scans the generated code for malicious intent or data exfiltration patterns.
2.  **Ephemeral Spawning:** A Dynamic Worker is spawned with **Zero Permissions** by default.
3.  **Just-In-Time Bindings:** Permissions (DB access, KV stores) are granted dynamically only if the code passes the audit.
4.  **Outbound Interception:** All network requests are intercepted by a parent worker to inject API keys and scrub sensitive data before it hits the internet.

---

## 👥 The Team & Roles

| Role | Focus | Core Responsibilities |
| :--- | :--- | :--- |
| **AI Security Architect** | **The Brain** | Building the "Guardian Agent" logic; prompt engineering for code auditing; risk-scoring heuristics. |
| **Cloud Infra Engineer** | **The Walls** | Managing the Dynamic Worker lifecycle; implementing Outbound Interception; configuring secure Bindings. |
| **UX & DX Engineer** | **The Face** | Building the high-fidelity dashboard (v0/Shadcn); real-time execution monitoring; latency visualization. |

---

## 🏗️ Project Structure
```text
├── .wrangler/          # Cloudflare configuration & environment
├── src/
│   ├── sentinel/       # The "Parent" Worker (The Gatekeeper)
│   ├── isolates/       # Logic for spawning Dynamic Workers via API
│   ├── interceptors/   # Outbound request handling & secret injection
│   └── security/       # AI-driven code analysis & sanitization logic
├── dashboard/          # Frontend Command Center (React + Tailwind)
└── README.md

---

## 🏃‍♂️ Build & Run

Follow these steps to set up and run the project locally:

### 1. Clone the repository
```bash
git clone <repo-url>
cd cursor-hackathon
```

### 2. Backend Setup
```bash
cd backend
npm install
# For development
npm run dev
# For production build
npm run build
npm start
```

### 3. Frontend Setup
Open a new terminal and run:
```bash
cd frontend
npm install
# For development
npm run dev
# For production build
npm run build
npm start
```

### 4. Access the App
- Backend API: http://localhost:8080
- Frontend: http://localhost:3000

---