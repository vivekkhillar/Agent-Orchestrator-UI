# PostgreSQL Service Startup Instructions

### 1. Build and Run PostgreSQL Container

You can start the PostgreSQL container using either standard Docker or Docker Compose:

#### Option A: Using Docker Compose (Recommended)
```bash
docker compose -f docker-compose.db.yml up -d
```

#### Option B: Using Docker CLI Directly
```bash
# Build the image with init.sql pre-loaded
docker build -t banking-postgres -f Dockerfile.postgres .

# Run the container
docker run -d --name banking_postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgrespassword banking-postgres
```

---

### 2. Database Connection URL

Once the container is running, the endpoint in your `.env` file will be:

```env
DATABASE_URL="postgresql://postgres:postgrespassword@localhost:5432/banking_db"
```

- **Host**: `localhost` (or `postgres` if running inside a Docker network)
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `postgrespassword`
- **Database**: `banking_db`
- **Initialization**: `init.sql` runs automatically on first boot, creating the `accounts`, `transactions`, `intent_classifications`, and `audit_logs` tables with initial records in Indian Rupees (`₹` / INR).
