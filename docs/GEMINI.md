# Project Overview

This project, "Reporty", is a sophisticated incident reporting and management system. It consists of two main parts: a React-based frontend and a Next.js backend service named "SafeReport".

**Frontend (`/`):**

*   **Technology:** React, Vite
*   **Purpose:** Provides the user interface for the application. The details of the UI are not fully clear from the file structure alone, but it appears to be a single-page application.

**Backend (`/safereport-phase1-v11`):**

*   **Technology:** Next.js, Neon (Postgres), Drizzle ORM, AWS S3, AWS Lambda, QStash
*   **Purpose:** This is the core of the application, providing a comprehensive system for:
    *   Anonymous report intake.
    *   An admin dashboard for managing reports and tenants.
    *   A partner dashboard for viewing tenant status.
    *   A secure evidence chain with HMAC-based integrity checks.
    *   A PDF generation pipeline using a Lambda function to convert HTML to PDF.
    *   PII (Personally Identifiable Information) protection with encryption at rest.

# Building and Running

## Frontend

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set environment variables:**
    Create a `.env.local` file and add your `GEMINI_API_KEY`.
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## Backend (SafeReport)

1.  **Install dependencies:**
    ```bash
    cd safereport-phase1-v11
    npm install
    ```
2.  **Set environment variables:**
    Copy `.env.example` to `.env.local` and fill in the required values, including your `DATABASE_URL` from Neon, `ADMIN_API_KEY`, `QSTASH_TOKEN`, `PDF_LAMBDA_FUNCTION_URL`, and R2 credentials.
3.  **Database setup:**
    ```bash
    npm run db:setup
    ```
4.  **Generate keys:**
    ```bash
    npm run keys:gen
    ```
    Copy the generated keys into your `.env.local` file.
5.  **Run the development server:**
    ```bash
    npm run dev
    ```

# Development Conventions

*   **Database:** The project uses Drizzle ORM with Neon Postgres. Migrations are generated locally using `drizzle-kit`.
*   **Security:**
    *   Evidence integrity is maintained using an HMAC chain.
    *   Sensitive data is encrypted at rest using AES-256-GCM.
    *   A PII guard is in place to prevent sensitive data from being stored in plaintext metadata fields.
*   **PDF Generation:** A pipeline involving QStash and an AWS Lambda function is used to generate PDFs from HTML.
*   **Authentication:** A minimal, stubbed authentication system is in place for development, using an `x-admin-key` header for admin endpoints.
