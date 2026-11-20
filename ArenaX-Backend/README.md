# ArenaX Backend

ArenaX is a REST API for running university e-sports tournaments. Players form teams, captains register them, organizers approve entries, generate brackets and submit results, and anyone can follow matches and standings.

Course: 00930 Advance Programming in Web Technology, AIUB, Fall 2026-2027, Section D, Team 6.

## Team

| Member | ID | Part |
|---|---|---|
| Augnkon Chandra Datta | 23-51903-2 | Admin role and shared infrastructure: config, database, migrations, login, JWT, guards, decorators, exception filter, response wrapper, logger, Swagger, users and roles, games, audit log, mail, seed |
| Md. Shahed Hossan Sarkar | 23-52636-2 | Organizer role: tournaments, registration review, bracket generation, matches, scheduling, result transaction |
| Ahsan Habib Shawon | 23-51870-2 | Player role: sign up, own profile, teams and members, tournament registration with slot locking, withdrawal, standings |

## Tech stack

NestJS 11, TypeScript, PostgreSQL, TypeORM, Passport JWT, bcrypt (bcryptjs), class-validator, Swagger, Nodemailer with Mailtrap.

## Requirements

- Node.js 20 or newer
- PostgreSQL 14 or newer running locally
- Git

## Setup

1. Clone the repository and install packages.

   ```
   git clone <repository-url>
   cd arenax-backend
   npm install
   ```

2. Create a database named `arenax` in PostgreSQL (pgAdmin or `psql`).

   ```
   CREATE DATABASE arenax;
   ```

3. Copy `.env.example` to `.env` and set your own PostgreSQL username and password. Mailtrap values are optional. When `MAIL_USER` is empty, emails are skipped and written to the console.

4. Start the API. Migrations run automatically on start.

   ```
   npm run start:dev
   ```

5. Load sample data.

   ```
   npm run seed
   ```

6. Open Swagger UI at http://localhost:3000/api/docs

## Sample accounts (after seed)

| Role | Email | Password |
|---|---|---|
| Admin | admin@arenax.local | Admin@123 |
| Organizer | organizer@arenax.local | Organizer@123 |
| Player | player1@arenax.local to player8@arenax.local | Player@123 |

The seed also creates the games Valorant (5 players), PUBG Mobile (4 players) and eFootball (1 player), four one-player teams (Team Alpha, Bravo, Charlie, Delta) captained by player1 to player4, and an open single elimination tournament called AIUB eFootball Cup.

## Demo flow in Swagger

1. Log in as player1 with `POST /auth/login`, copy `accessToken`, click Authorize and paste it.
2. Register Team Alpha with `POST /tournaments/1/register` and body `{ "teamId": 1 }`. Repeat with player2, player3 and player4 for teams 2, 3 and 4.
3. Log in as the organizer. List entries with `GET /tournaments/1/registrations` and approve each one with `PATCH /registrations/{id}` and body `{ "status": "APPROVED" }`.
4. Generate the bracket with `POST /tournaments/1/generate-bracket`. Four teams create three linked matches.
5. Schedule a match with `PATCH /matches/{id}/schedule` and submit a score with `PATCH /matches/{id}/result`.
6. Open `GET /tournaments/1/matches` and `GET /tournaments/1/standings` without a token to see the public view.
7. Log in as admin and read `GET /audit-logs` to see every change.

## Response format

Successful responses:

```
{ "success": true, "statusCode": 200, "data": { } }
```

Errors:

```
{ "success": false, "statusCode": 403, "error": "FORBIDDEN", "message": "...", "path": "/teams/1", "timestamp": "..." }
```

## Main endpoints

| Module | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login` |
| Profile | `GET /users/me`, `PATCH /users/me` |
| Users (Admin) | `POST /users`, `GET /users`, `GET /users/:id`, `PATCH /users/:id/role`, `DELETE /users/:id` |
| Games | `GET /games`, `GET /games/:id`, `POST /games`, `PATCH /games/:id`, `DELETE /games/:id` |
| Teams | `POST /teams`, `GET /teams`, `GET /teams/:id`, `PATCH /teams/:id`, `DELETE /teams/:id`, `POST /teams/:id/members`, `DELETE /teams/:id/members/:userId`, `GET /teams/:id/registrations` |
| Tournaments | `GET /tournaments`, `GET /tournaments/:id`, `POST /tournaments`, `PATCH /tournaments/:id`, `DELETE /tournaments/:id`, `POST /tournaments/:id/generate-bracket` |
| Registrations | `POST /tournaments/:id/register`, `GET /tournaments/:id/registrations`, `PATCH /registrations/:id`, `DELETE /registrations/:id` |
| Matches | `GET /tournaments/:id/matches`, `GET /matches/:id`, `POST /tournaments/:id/matches`, `PATCH /matches/:id/schedule`, `PATCH /matches/:id/result`, `DELETE /matches/:id` |
| Standings | `GET /tournaments/:id/standings` |
| Audit | `GET /audit-logs` |
