# Student Portal Backend

This is the Node.js + Express backend for the Student Portal, using Turso (libSQL) as the database.

## Setup

1.  **Install Dependencies** (Already done):
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Open `.env` and fill in your Turso credentials:
    ```env
    TURSO_DATABASE_URL=libsql://pr-prudhviraj.aws-ap-south-1.turso.io
    TURSO_AUTH_TOKEN=your-turso-auth-token
    jwt_secret=your-secret-key
    ```
    *You can get the token by running `turso db tokens create student_portal` in your terminal if you have the CLI installed.*

3.  **Initialize Database**:
    Run the schema script to create tables:
    ```bash
    node init_db.js
    ```

4.  **Start Server**:
    ```bash
    node index.js
    ```
    The server will run on `http://localhost:5000`.

## API Endpoints

-   **Auth**: `/api/auth/register`, `/api/auth/login`
-   **Courses**: `/api/courses` (GET, POST)
-   **Students**: `/api/students/profile`, `/api/students/assignments/submit`, etc.
-   **Admin**: `/api/admin/certificates/approve/:id`
