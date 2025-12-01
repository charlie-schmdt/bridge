# Bridge

A video conferencing app focused on simplicity, fluidity, and ease of collaboration.

## Prerequisites

Before running the project locally, ensure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **pnpm** - Install via `npm install -g pnpm`
- **Go** (version 1.21 or higher) - [Download here](https://go.dev/dl/)
- **PostgreSQL** (version 12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Redis** - Install via `brew install redis` (macOS) or see [Redis installation guide](https://redis.io/docs/getting-started/installation/)

## Running Locally (Without Docker)

### 1. Backend (Node.js)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file and configure
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migrate

# Start development server (with auto-reload)
npm run dev

# Or for production
npm start
```

The backend server will run on `http://localhost:3000` by default.

See [backend/README.md](./backend/README.md) for detailed database setup and configuration.

### 2. SFU (Selective Forwarding Unit - Go)

```bash
# Navigate to SFU directory
cd sfu

# Download Go dependencies
go mod download

# Build the SFU server
go build -o sfu ./cmd/sfu

# Run the SFU server
./sfu
```

The SFU server will run on `http://localhost:50051`.

### 3. Frontend (Electron App)

```bash
# Navigate to frontend directory
cd electron-src

# Install dependencies
pnpm install

# Build the application
pnpm build

# Start the Electron app
pnpm start
```

## Running with Docker

Alternatively, you can use Docker Compose to run the backend and SFU services:

```bash
docker-compose up --build
```

This will start:
- Backend on port 50031 (mapped from container port 8080)
- SFU on port 50051

> **Note**: When running locally without Docker, the backend uses port 3000 by default (configurable via `PORT` in `.env`). Docker Compose maps different ports for containerized deployment.

## Project Structure

```
bridge/
├── backend/          # Node.js Express backend
├── electron-src/     # Electron + React frontend
├── sfu/              # Go-based SFU (Selective Forwarding Unit)
└── compose.yaml      # Docker Compose configuration
```

## Development Workflow

For local development, run all three services:

1. **Terminal 1 - Backend**: `cd backend && npm run dev`
2. **Terminal 2 - SFU**: `cd sfu && go run ./cmd/sfu`
3. **Terminal 3 - Frontend**: `cd electron-src && pnpm build && pnpm start`

> **Tip**: Use `go run ./cmd/sfu` for quick development iteration. For production, build first with `go build -o sfu ./cmd/sfu` then run `./sfu`.

## Contributing

See individual README files in each subdirectory for detailed setup and contribution guidelines.