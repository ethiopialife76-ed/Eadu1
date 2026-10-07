# ProjectMarket DBU

Web platform for Debre Berhan University academic projects, built from:

- `DBU-SRS-001` Software Requirements Specification
- `DBU-SDD-001` Software Design Document
- `DBU-RE-001` Requirements Engineering document

## What you can do

- Register and sign in as Student, Instructor, Industry partner, or Admin (JWT, 24h)
- Post, search, filter, approve, and complete project ideas
- Form teams, join with leader approval, instructor/admin team approval
- Request a supervisor, submit weekly reports with files, team chat, live notifications
- **Selam**, an AI voice agent on every page: visitors and signed-in users can speak or type for help (Chrome/Edge microphone + spoken replies)

## Run on this machine

You need Node.js 18+.

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### Demo accounts (password `Password@123`)

| Role | Email |
| --- | --- |
| Student | student@dbu.edu.et |
| Instructor | instructor@dbu.edu.et |
| Admin | admin@dbu.edu.et |
| Industry | industry@partner.et |

A second student (`mikiyas@dbu.edu.et`) is seeded so you can test join requests.

## Voice agent

1. Click the green sparkle button (bottom right) on any page, including the public home page.
2. Allow the microphone, then speak, or type.
3. Selam answers from ProjectMarket knowledge. If you set `OPENAI_API_KEY` in `backend/.env`, answers can use that model as well.

## Production notes (from the SDD)

- Swap SQLite for Neon PostgreSQL by changing Prisma `provider` and `DATABASE_URL`
- Set Cloudinary keys for production file storage (local `/uploads` is used when keys are empty)
- Deploy frontend on Vercel and API on Render as specified in the design document
