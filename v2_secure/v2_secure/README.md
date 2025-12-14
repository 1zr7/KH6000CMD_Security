# HealthCareAlpha Security Showcase

This project demonstrates the evolution of a healthcare application from a **vulnerable baseline (v1)** to a **secure, hardened system (v2)**. It serves as a Security Evaluation Report capability demonstration.

---

## 🚦 How to Run the Applications

### Option A: Run v1_insecure (The Vulnerable App)
*Use this version to demonstrate exploits like SQL Injection, XSS, and Broken Access Control.*

1.  **Navigate to the directory**:
    Users typically find this in the sibling folder `v1_insecure/v1_insecure`.
    ```bash
    cd ../v1_insecure/v1_insecure
    ```

2.  **Start with Docker**:
    ```bash
    docker-compose up --build
    ```
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **API**: [http://localhost:4000](http://localhost:4000)

3.  **Seed Database**:
    ```bash
    docker-compose exec api npm run seed
    ```

4.  **Credentials (v1)**:
    *   Admin: `admin` / `admin123`
    *   Doctor: `dr_house` / `password`

---

### Option B: Run v2_secure (The Hardened App)
*Use this version to demonstrate defense mechanisms like Encryption, 2FA, RBAC, and IDOR protection.*

1.  **Navigate to the directory**:
    ```bash
    cd v2_secure/v2_secure
    ```

2.  **Start with Docker**:
    ```bash
    # Stop any running v1 containers first to avoid port conflicts (if mapping to same ports)
    # v2 uses Port 4001 for API to minimize conflict, but Frontend is 3000
    docker-compose down -v 
    
    docker-compose up --build
    ```
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **API**: [http://localhost:4001](http://localhost:4001)

3.  **Seed Database (CRITICAL)**:
    Required for Encryption keys to match.
    ```bash
    docker-compose exec api node src/seed.js
    ```

4.  **Credentials (v2)**:
    *   **Admin**: `admin` / `admin123`
    *   **Doctor**: `dr_house` / `password`
    *   **Nurse**: `nurse_joy` / `password`
    *   **Patient**: `jdoe` / `password123` (Mohamed Ali)

---

## 🛡️ Security Comparison

### 1. **Authentication & Identity**
| Feature | v1 (Insecure) | v2 (Secure) |
| :--- | :--- | :--- |
| **Passwords** | MD5 Hash (Weak) | **Bcrypt** (Salt Rounds: 10) |
| **Session** | LocalStorage (XSS Vulnerable) | **HttpOnly, Secure Cookies** |
| **MFA** | None | **2FA via Email OTP** |
| **Permissions** | None (Broken Access Control) | **Strict RBAC** (Middleware) |

### 2. **Data Protection**
| Feature | v1 (Insecure) | v2 (Secure) |
| :--- | :--- | :--- |
| **PHI Data** | Plaintext | **AES-256 Encrypted** (At Rest) |
| **Direct Access** | IDOR Vulnerable (e.g. `/appointments/5`) | **IDOR Protected** (Ownership Checks) |
| **Input** | Unsanitized (SQLi Possible) | **Validated & Parameterized** |
| **SQL Queries** | String Concatenation | **Parameterized Queries** ($1, $2) |

### 3. **Infrastructure**
| Feature | v1 (Insecure) | v2 (Secure) |
| :--- | :--- | :--- |
| **Rate Limiting** | None | **Global + Auth Limiter** |
| **Headers** | Default | **Helmet (HSTS, CSP)** |
| **Audit** | None | **Audit Logging** with Actor/Action tracking |

---

## 🛠️ v2_secure Technical Details

### Architecture
*   **Backend**: Node.js / Express
*   **Database**: PostgreSQL
*   **Frontend**: React
*   **Containerization**: Docker Compose

### Key Security Implementations
*   **Encryption**: `crypto.createCipheriv` used for sensitive fields (email, address, diagnosis).
*   **Validation**: `express-validator` middleware on all inputs.
*   **Logging**: Custom `audit.js` utility logging to a dedicated database table.
*   **SQL Protection**: 
    *   **Parameterized Queries**: All user inputs are passed as parameters (`$1`, `$2`) to `pg` library, never concatenated.
    *   **Validation**: `express-validator` ensures inputs match expected types (e.g., `isEmail`, `isInt`) before reaching the query.
