# Shepherd Church Management System

## Project Overview

Shepherd is a web-based church management system built with React, TypeScript, and Vite. It uses Firebase for its backend, including Firestore for the database, Firebase Authentication for user management, and Firebase Storage for file storage. The application is designed to be a comprehensive solution for managing church membership, events, and other related activities.

The project is structured with a clear separation of concerns, with a `src` directory containing the majority of the application code. This includes components, pages, services, hooks, and contexts. The application is styled with TailwindCSS and uses `react-router-dom` for routing.

## Building and Running

### Prerequisites

*   Node.js 18+
*   Firebase account (free tier)
*   Git

### Quick Start

1.  **Clone Repository**
    ```bash
    git clone https://github.com/PLyons/shepherd-church-management.git
    cd shepherd-church-management
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Firebase**
    *   Create a Firebase project at https://console.firebase.google.com
    *   Enable Authentication (Email/Password and Email Link)
    *   Enable Firestore Database
    *   Enable Storage
    *   Copy `.env.example` to `.env.local` and add your Firebase config.

4.  **Start Development Server**
    ```bash
    npm run dev
    ```

### Available Scripts

*   `npm run dev`: Start the development server.
*   `npm run build`: Build the application for production.
*   `npm run lint`: Run ESLint to check for code quality issues.
*   `npm run format`: Format code with Prettier.
*   `npm run preview`: Preview the production build locally.
*   `npm run seed`: Seed the Firebase database with sample data.
*   `npm run setup-admin`: Create an initial admin user.
*   `npm run typecheck`: Run the TypeScript compiler to check for type errors.
*   `npm test`: Run tests using Vitest.

## Development Conventions

*   **Coding Style**: The project uses Prettier for code formatting and ESLint for linting. The configuration for these tools can be found in `.prettierrc` and `.eslintrc.cjs` respectively.
*   **Testing**: The project uses Vitest for unit and integration testing. Test files are located alongside the files they are testing and have a `.test.ts` or `.test.tsx` extension.
*   **Commits**: Commit messages should follow the Conventional Commits specification.
*   **Branching**: The project uses a GitFlow branching model. Feature branches should be created from the `develop` branch.
*   **Architecture**: The project follows a service layer architecture, with a clear separation between UI components and backend services. Firebase services are located in the `src/services/firebase` directory.
