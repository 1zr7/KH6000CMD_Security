# HealthCareAlpha (v1_insecure)

**WARNING: THIS APPLICATION IS INTENTIONALLY VULNERABLE. DO NOT DEPLOY TO PRODUCTION.**
This project is a baseline for a Security Evaluation Report. It contains multiple critical security flaws for educational and testing purposes.

## Quick Start

1. **Start the environment**:
   ```bash
   docker-compose up --build
   ```
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API: [http://localhost:4000](http://localhost:4000)
   - Database: localhost:5432

2. **Seed the database**:
   Open a new terminal and run:
   ```bash
   docker-compose exec api npm run seed
   ```
   This will create tables and insert sample users, appointments, and medical records.

## Credentials

| Role      | Username   | Password    |
|-----------|------------|-------------|
| Admin     | admin      | admin123    |
| Doctor    | dr_house   | password    |
| Nurse     | nurse_joy  | password    |
| Patient   | jdoe       | password123 |
| Patient   | asmith     | password123 |

## Intentionally Vulnerable Features

- **SQL Injection (SQLi)**:
  - Login: `SELECT * FROM users WHERE ...`
  - Search: `SELECT * FROM patients WHERE name LIKE ...`
  - Admin Create User: `INSERT INTO users ...`
  - Doctor Assignments: `UPDATE doctors ...`
- **Cross-Site Scripting (XSS)**:
  - **Reflected**: Search query is echoed back in the UI without sanitization.
  - **Stored**: Patient notes/diagnosis could be rendered dangerously (if extended).
- **Broken Authentication**:
  - Passwords stored as MD5 hashes.
  - No rate limiting.
  - Verbose login errors.
- **Broken Access Control**:
  - `/admin` routes have no role checks.
  - Any user can list all patients.
  - IDOR possible on appointment endpoints.
- **Security Misconfiguration**:
  - CORS enabled for `*`.
  - Verbose error stack traces.
  - Sensitive data logged to console.

## API Endpoints & Exploits

### 1. Admin: Create Doctor
```bash
curl -X POST http://localhost:4000/admin/users \
  -H "Content-Type: application/json" \
  -d '{"username":"dr_new","password":"password","role":"doctor","name":"Dr. New","specialty":"Surgery"}'
```

### 2. Doctor: Assign Nurse
```bash
curl -X POST http://localhost:4000/doctor/2/assign-nurse \
  -H "Content-Type: application/json" \
  -d '{"nurseId":3}'
```

### 3. Patient: Create Appointment
```bash
curl -X POST http://localhost:4000/patients/appointments \
  -H "Content-Type: application/json" \
  -d '{"patientId":4,"doctorId":2,"reason":"Checkup"}'
```

### 4. SQL Injection (Search)
**Payload**: `' OR '1'='1`
```bash
curl "http://localhost:4000/patients/search?q='%20OR%20'1'='1"
```

### 5. Stored XSS (via Patient Name/Notes)
If a user registers with a name like `<script>alert(1)</script>`, it may execute when viewed by an admin or doctor if not sanitized.

## Project Structure
- `api/`: Express.js backend
- `frontend/`: React frontend (Tailwind CSS)
- `db/`: PostgreSQL
