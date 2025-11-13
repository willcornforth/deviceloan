# deviceloan-reactapp

The front-end React application for the device loan system.

## Tech Stack

- **Vite** - Build tool and development server
- **React 19** - UI library
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
npm install
```

### Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:5173/`

### Build

Build the application for production:

```bash
npm run build
```

### Lint

Run ESLint to check code quality:

```bash
npm run lint
```

### Preview

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable React components
├── pages/          # Page components for routing
├── assets/         # Static assets
├── App.jsx         # Main application component with routing
├── main.jsx        # Application entry point
└── index.css       # Global styles with Tailwind directives
```

## Available Routes

- `/` - Home page
- `/devices` - Devices listing page
- `/loans` - Loans management page
