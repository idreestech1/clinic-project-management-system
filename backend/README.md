# Doctor Backend

Node/Express API for the doctor appointment project.

## Setup

```bash
npm install
npm run dev
```

Required environment variables:

- `MONGODB_URI`
- `CLIENT_ORIGIN`
- `PORT`

For Render/Railway, set `NODE_ENV=production`, `MONGODB_URI`, and `CLIENT_ORIGIN` to the deployed frontend URL. The server binds to `0.0.0.0` by default for hosted platforms.

## Endpoints

- `GET /api/health`
- `GET /api/appointments`
- `POST /api/appointments`
- `GET /api/slots?date=YYYY-MM-DD`
