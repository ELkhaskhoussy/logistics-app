# CLAUDE.md — Production Server (sendlo.fr / 84.46.254.94)

Copy this file to the directory on the server where `docker-compose.prod.yml` lives (rename it to `CLAUDE.md`). It guides Claude Code when operating this box.

## What This Server Is

The **production host** for the Sendlo transportation marketplace. It runs pre-built Docker images pulled from Docker Hub — **no source code lives here**. Code changes happen in the repos and arrive via CI/CD; never edit code or rebuild images on this server.

## What Runs Here

| Container | Port | Role |
|---|---|---|
| api-gateway | 8080 | Entry point, JWT validation, routes to services |
| user-service | 8081 | Users/auth (`db_user`) |
| catalogue-service | 8082 | Trips catalog (`db_catalog`) |
| reservation-service | 8083 | Bookings (`db_booking`) — image/app name is `booking-service` |
| notification-service | 8084 | Emails (`db_notification`) |
| postgres | 5433 (host) | Single instance, one DB per service |
| frontend (nginx) | 3000 | Static Expo web build |

All backend services are managed by `docker-compose.prod.yml`. Uploads are persisted in `./profile_storage` (bind mount) — never delete it.

## Common Operations

```bash
# Status & health
docker compose -f docker-compose.prod.yml ps
docker stats --no-stream
df -h && free -h

# Logs (always start here for incidents)
docker compose -f docker-compose.prod.yml logs -f --tail=200 [service]
docker compose -f docker-compose.prod.yml logs --since 1h | grep -i error

# Restart one service (safe)
docker compose -f docker-compose.prod.yml up -d [service]

# Deploy latest images (what CD does)
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Rollback to a specific git SHA tag
docker pull <dockerhub-user>/<service>:<sha>
docker tag <dockerhub-user>/<service>:<sha> <dockerhub-user>/<service>:latest
docker compose -f docker-compose.prod.yml up -d [service]

# Database access (read-only investigation by default)
docker exec -it <postgres-container> psql -U <user> -d db_booking
```

## Hard Rules

- **NEVER** run `docker compose down -v` — it destroys database volumes.
- **NEVER** `docker system prune --volumes` or delete `./profile_storage`.
- **NEVER** edit `.env` / compose files without showing the diff and asking first — they hold prod secrets (`JWT_SECRET`, DB and mail credentials).
- **Database:** SELECT freely to investigate; any INSERT/UPDATE/DELETE requires explicit confirmation from the user first.
- **Don't** build images here; images come from Docker Hub via CI. To ship a fix, tell the user to push to the repo instead.
- **Don't** add per-service CORS config — CORS is handled only at the gateway; duplicates caused 403s before.
- Prefer restarting a single service over the whole stack.
- Safe cleanup when disk is low: `docker image prune -af --filter "until=168h"` (keeps volumes untouched).

## Known Context

- JWT is validated at the gateway for `/catalog`, `/bookings`, `/notifications`; user-service enforces its own security for `/users`.
- Schema is Hibernate `ddl-auto: update` — no migration framework; manual changes go in `migration.sql` in the repo, not ad-hoc on the DB.
- Known security backlog (pending hardening): DB port 5433 and service ports exposed publicly, no firewall rules, secrets in git, permissive CORS. Flag anything that touches these.

## Incident Checklist

1. `docker compose ps` — anything restarting/exited?
2. Logs of the failing service, last 200 lines.
3. Check disk (`df -h`) and memory (`free -h`) — common cause of container deaths.
4. Check Postgres is up and reachable before blaming a service.
5. If a bad deploy: roll back via SHA tag (see above), then report findings — don't hot-patch containers.
