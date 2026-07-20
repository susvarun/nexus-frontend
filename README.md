# Nexus Blog Platform - Frontend

This is the frontend for the Nexus Blog Platform, built with React, TypeScript, Vite, and Tailwind CSS.

## 🚀 Tech Stack

- **Framework**: React (via Vite)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **Editor**: `@uiw/react-md-editor`
- **Other**: Axios, date-fns, jwt-decode, react-hot-toast

## 🛠️ Setup & Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root of the `frontend` directory and add your API URL:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## 📜 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run build`: Builds the app for production.
- `npm run lint`: Runs oxlint for linting.
- `npm run preview`: Previews the production build locally.
