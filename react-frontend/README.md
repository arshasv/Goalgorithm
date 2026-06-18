# GOALGORITHM React Frontend

This directory contains the migrated React 18 Single Page Application (SPA) for the GOALGORITHM system. It replaces the legacy Vanilla JS HTML implementation, delivering a robust component-based architecture for managing tournaments, scoring, predictions, and leaderboards.

## Tech Stack
- **Framework**: React 18 (with React Router DOM)
- **Bundler**: Vite
- **Styling**: Vanilla CSS3 custom properties with native Light/Dark themes
- **API Client**: Axios

## Development setup

```bash
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests seamlessly to the FastAPI backend running on port 8000.
