# Bridge Backend

A Node.js backend for the Bridge video conferencing application, built with Express.js and PostgreSQL.

## Prerequisites

Before setting up the project, make sure you have the following installed:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **PostgreSQL** (version 12 or higher) - [Download here](https://www.postgresql.org/download/)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start for Team Members

### 1. Clone the Repository

```bash
git clone https://github.com/charlie-schmdt/bridge.git
cd bridge/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
copy .env.example .env
```

**Important**: Edit the `.env` file and update the database credentials with your own:
- `DB_PASSWORD` - Use your PostgreSQL password
- `JWT_SECRET` - Generate a secure secret key

### 4. Set Up PostgreSQL Database

Open PostgreSQL command line (psql) as the postgres superuser:

```bash
psql -U postgres
```

Run these commands in the PostgreSQL console:

```sql
-- Create the database
CREATE DATABASE bridge_db;

-- Create a user for the application
CREATE USER bridge_user WITH PASSWORD 'bridge_password';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON DATABASE bridge_db TO bridge_user;

-- Grant schema permissions
GRANT ALL PRIVILEGES ON SCHEMA public TO bridge_user;
GRANT USAGE ON SCHEMA public TO bridge_user;
GRANT CREATE ON SCHEMA public TO bridge_user;

-- Grant privileges on future tables and sequences
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bridge_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO bridge_user;

-- Exit PostgreSQL
\q
```

### 5. Run Database Migrations

This will create all the necessary tables:

```bash
npm run migrate
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with auto-reload |
| `npm start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run migrate:undo` | Undo the last migration |
| `npm run seed` | Run database seeders |
| `npm run setup` | Install dependencies and run migrations |

## Project Structure

```
backend/
├── config/
│   └── config.js           # Sequelize database configuration
├── migrations/
│   └── *.js                # Database migration files
├── src/
│   ├── app.js              # Main application entry point
│   ├── config/
│   │   └── database.js     # Database connection setup
│   ├── controllers/
│   │   └── index.js        # Route handlers and business logic
│   ├── middleware/
│   │   └── index.js        # Custom middleware functions
│   ├── models/
│   │   ├── index.js        # Model exports
│   │   └── User.js         # User model definition
│   ├── routes/
│   │   └── index.js        # API route definitions
│   └── utils/
│       └── index.js        # Utility functions
├── .env                    # Environment variables (DO NOT COMMIT)
├── .env.example            # Environment variables template
├── .sequelizerc            # Sequelize configuration
└── package.json            # Project dependencies and scripts
```

## API Endpoints

Once the server is running, you can test these endpoints:

- `GET /` - API welcome message
- `GET /api/` - API routes information
- `GET /api/health` - Health check endpoint
- `GET /api/users` - Users endpoint (placeholder)

## Database Schema

### Users Table

The users table supports both regular authentication and OAuth:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| email | STRING | User email (unique) |
| password | STRING | Hashed password (nullable for OAuth) |
| name | STRING | User display name |
| picture | STRING | Profile picture URL |
| provider | ENUM | Authentication provider (local, google, github, microsoft) |
| providerId | STRING | OAuth provider user ID |
| isVerified | BOOLEAN | Email verification status |
| lastLogin | DATE | Last login timestamp |
| createdAt | DATE | Account creation timestamp |
| updatedAt | DATE | Last update timestamp |

## Environment Variables

The following environment variables are required:

| Variable | Description | Example |
|----------|-------------|---------|
| `DB_HOST` | Database host | `localhost` |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `bridge_db` |
| `DB_USER` | Database username | `bridge_user` |
| `DB_PASSWORD` | Database password | `your_password` |
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |

## Troubleshooting

### PostgreSQL Connection Issues

1. **"psql is not recognized"**: Add PostgreSQL to your system PATH
   - Windows: Add `C:\Program Files\PostgreSQL\15\bin` to PATH
   - Restart your terminal after adding to PATH

2. **"permission denied for schema public"**: Run the database setup commands above to grant proper permissions

3. **"database does not exist"**: Make sure you created the `bridge_db` database

### Environment Variables Not Loading

1. Make sure your `.env` file is in the backend root directory
2. Check that there are no spaces around the `=` signs in `.env`
3. Restart the development server after changing `.env`

### Migration Errors

1. **"relation already exists"**: The table might already exist. Use `npm run migrate:undo` to rollback
2. **"No migrations were executed"**: Check that migration files exist in the `migrations/` folder

## Development Workflow

1. **Pull latest changes**: `git pull origin main`
2. **Install new dependencies**: `npm install`
3. **Run any new migrations**: `npm run migrate`
4. **Start development**: `npm run dev`

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature-name`
2. Make your changes and test them
3. Run migrations if you added any: `npm run migrate`
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to your branch: `git push origin feature/your-feature-name`
6. Create a Pull Request

## Need Help?

If you encounter any issues during setup:

1. Check this README for troubleshooting steps
2. Make sure all prerequisites are installed
3. Verify your `.env` file has correct database credentials
4. Ask in the team chat or create an issue

## Security Notes

- **Never commit the `.env` file** - it contains sensitive credentials
- **Use strong passwords** for database users in production
- **Generate secure JWT secrets** for production environments
- **Keep dependencies updated** regularly for security patches