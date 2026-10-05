# NexusSpace

NexusSpace is a responsive React/Vite project workspace with Supabase Auth, a Django REST API, Supabase Postgres (via the Supabase REST API), Supabase Storage, and Row Level Security.

## How requests flow

- React uses Supabase Auth for sign-up, sign-in, session refresh, and sign-out.
- React sends project, task, profile, and file requests to Django with the signed-in user's Supabase access token.
- Django verifies that token with Supabase Auth and forwards requests using the anon key plus the user's JWT. It does not use a service-role key, so Supabase RLS is enforced for database and Storage operations.
- Project tasks and uploaded-file records are related to projects with foreign keys. Creating and listing data use Supabase, not browser local storage.
- `supabase/schema.sql` creates the tables, auth profile trigger, Storage buckets, indexes, and RLS policies.

## Local development

1. Create a `.env` from `.env.example` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Supabase project's URL and anon/publishable key. The frontend intentionally has no local-data fallback.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). Run it against your existing project before testing. New Supabase Auth accounts receive a `Member` profile through the trigger.
3. Install and start the Django API in one PowerShell terminal:

   ```powershell
   py -m venv backend\.venv
   backend\.venv\Scripts\Activate.ps1
   pip install -r backend\requirements.txt
   $env:SUPABASE_URL = "https://your-project-id.supabase.co"
   $env:SUPABASE_ANON_KEY = "your-supabase-anon-key"
   $env:DJANGO_DEBUG = "true"
   $env:CORS_ALLOWED_ORIGINS = "http://localhost:3000"
   python backend\manage.py runserver 127.0.0.1:8000
   ```

4. In a second terminal, install and start React:

   ```powershell
   npm install
   npm run dev
   ```

   Vite serves the frontend at `http://localhost:3000` and proxies `/api` to Django at `http://127.0.0.1:8000`.

5. Register a user in the app. If Supabase email confirmation is enabled, confirm the email before signing in. Create a project, add tasks, and upload files; the corresponding rows and objects should appear in the Supabase `projects`, `tasks`, `project_files`, and Storage views.

To grant an account workspace administrator access, first register it, then run this in the Supabase SQL Editor, replacing the email with the account's email:

```sql
UPDATE public.profiles
SET role = 'Admin'
WHERE email = 'admin@example.com';
```

Do not expose or set an administrator role through the profile form. Only the SQL administrator or an existing workspace administrator can assign roles.

## Supabase PostgreSQL MCP

The MCP configuration in [`.agents/mcp_config.json`](./.agents/mcp_config.json) reads `SUPABASE_DATABASE_URL` from the environment instead of storing a database password in the repository. Set it in the environment used to launch the MCP server. Use the database connection URI from Supabase, URL-encode any reserved characters in the password, and require SSL. The app backend itself uses the anon key plus each user's JWT; it does not need the database password.

The previously checked-in MCP configuration contained a database credential. Rotate the Supabase database password before using the new environment-based configuration.

## Vercel and Django deployment

Vercel hosts the React frontend. Django is a separate WSGI service; deploy the `backend` directory to a Python host that supports Django/Gunicorn, then configure:

- **Vercel:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_API_BASE_URL` (the public Django API origin, without a trailing slash).
- **Django host:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, a strong `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=false`, `DJANGO_ALLOWED_HOSTS`, and `CORS_ALLOWED_ORIGINS` (the Vercel site origin).
- The Django start command is `gunicorn nexus_api.wsgi:application --bind 0.0.0.0:$PORT` with the working directory set to `backend`.

Do not add the Supabase service-role key or database password to Vercel frontend variables. The browser only receives the anon key; the API forwards the user's access token so database policies remain in force.

## API endpoints

All endpoints except `GET /api/v1/health/` require a valid Supabase bearer token.

| Method | Endpoint | Purpose |
|---|---|---|
| GET, PATCH | `/api/v1/profiles/me/` | Read or update the signed-in user's profile |
| GET | `/api/v1/profiles/` | Admin-only profile directory |
| GET, POST | `/api/v1/projects/` | List or create projects |
| PATCH, DELETE | `/api/v1/projects/{id}/` | Update or delete an owned project |
| GET, POST | `/api/v1/tasks/` | List or create tasks |
| PATCH, DELETE | `/api/v1/tasks/{id}/` | Update or delete an owned task |
| GET | `/api/v1/files/` | List accessible project-file records |
| POST | `/api/v1/files/upload/` | Upload a project file and create its database record |
| DELETE | `/api/v1/files/{id}/` | Delete an owned project file and its Storage object |
| POST | `/api/v1/storage/upload/` | Upload a project cover image or avatar |

## Validation

Run `npm run build` to validate the React production bundle. Django dependencies are listed in [`backend/requirements.txt`](./backend/requirements.txt). Validate API behavior against your configured Supabase project after applying the SQL schema; this requires valid Supabase credentials and a reachable Django service.

The Django API unit tests can be run after installing the backend requirements:

```powershell
$env:DJANGO_DEBUG = "true"
python backend\manage.py test
```

They mock Supabase HTTP calls and cover token enforcement, database-backed listing, and ownership-field validation; a live CRUD/upload check still requires the configured Supabase project.
