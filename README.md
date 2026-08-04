# CollegeDB — College Management Dashboard

A full-stack college management system built with Next.js and PostgreSQL, with **self-hosted authentication** (no third-party auth service) and four role-based dashboards: Admin, Teacher,and Student.

## Features

- **Custom authentication** — username/password login handled entirely by this app (Auth.js Credentials provider + Prisma + bcrypt password hashing). No external auth service; you own the user data and password hashes.
- **Role-based access control** — middleware restricts every route by role, and each role sees a different set of menu items and dashboard.
- **Admin-provisioned accounts** — there is no public sign-up. Admins create Teacher/Student/Parent accounts (with an initial password); users can change their own password afterward from Settings.
- **Full CRUD** across every entity: Teachers, Students, Departments, Subjects, Lessons, Exams, Assignments, Results, Attendance, Events, and Announcements.
- **Self-service password change** from the Settings page.
- **Profile page** — reachable from the round avatar menu in the top bar, shows the logged-in user's own details.
- **Weekly class schedule** (react-big-calendar) per teacher/student, correctly laid out by day and time.

### What each role can do

| | Admin | Teacher | Student |
|---|---|---|---|---|
| Manage Teachers / Students / Parents / Departments / Subjects / Lessons | ✅ | view only | ❌ |
| Manage Exams / Assignments / Results / Attendance (own lessons only for teachers) | ✅ | ✅ | view own |
| Manage Events / Announcements | ✅ | ❌ | view relevant | 
| Change own password | ✅ | ✅ | ✅ |

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** Auth.js (NextAuth v5) with a Credentials provider, `bcryptjs` for password hashing
- **Forms/validation:** react-hook-form + zod
- **UI:** Tailwind CSS, react-big-calendar, react-calendar, recharts
- **Image uploads:** Cloudinary (`next-cloudinary`)

## Getting Started

### Prerequisites

- Node.js 18+
- A running PostgreSQL instance (Docker is the easiest way — see below)

### 1. Install dependencies

```bash
npm install
```

### 2. Start a database

```bash
docker run -d --name school_custom_postgres \
  -e POSTGRES_USER=customdev \
  -e POSTGRES_PASSWORD=customdev123 \
  -e POSTGRES_DB=school \
  -p 5434:5432 \
  postgres:15
```

(Already have a container from a previous run? Just `docker start school_custom_postgres`.)

### 3. Configure environment variables

Create `.env` in the project root:

```bash
DATABASE_URL="postgresql://customdev:customdev123@localhost:5434/school"

AUTH_SECRET="<generate with: openssl rand -base64 32>"

NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
NEXT_PUBLIC_CLOUDINARY_API_KEY=<your-cloudinary-api-key>
```

### 4. Run migrations and seed the database

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the schema and populates it with a realistic Indian-college dataset: 6 departments (Computer Science, Mechanical Engineering, Electronics & Communication, Civil Engineering, Information Technology, Business Administration), department-specific subjects, 15 teachers, 50 students, 25 parents, plus lessons, exams, assignments, results, attendance, events, and announcements.

> Re-seeding wipes existing data. Use `npx prisma migrate reset` to drop, re-migrate, and re-seed in one step during development.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or whichever port Next.js picks if 3000 is taken).

## Logging In

There is no sign-up page. Every seeded account uses the password:

```
password123
```

Sample usernames: `admin1`, `admin2` · `teacher1`–`teacher15` · `student1`–`student50` · `parentId1`–`parentId25`.

After logging in, change your password from **Settings** in the sidebar.

## Project Structure

```
prisma/
  schema.prisma        # Data model (Admin, Teacher, Student, Parent, Class, Subject, Lesson, ...)
  seed.ts               # Seed script — generates realistic department/teacher/student/lesson data
src/
  auth.ts                # Auth.js config: Credentials provider, session callbacks
  auth.config.ts          # Edge-safe subset of the auth config, used by middleware
  middleware.ts            # Role-based route protection
  lib/
    actions.ts             # Server actions — create/update/delete for every entity
    auth-compat.ts          # auth()/currentUser() helpers used across pages
    formValidationSchemas.ts# zod schemas for every form
    settings.ts              # routeAccessMap (which roles can access which routes)
  app/(dashboard)/          # All authenticated pages: role dashboards + /list/* CRUD pages
  components/
    forms/                   # One form component per entity
    FormModal.tsx / FormContainer.tsx  # Generic create/update/delete modal wiring
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the codebase |
| `npx prisma studio` | Browse the database in a GUI |
| `npx prisma migrate reset` | Drop, re-migrate, and re-seed the database |

