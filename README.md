# Employee ID Card Generator

Full-stack admin panel to generate corporate ID cards from a CSV / Excel upload.
Layout & styling are a pixel-exact port of `corporate_id_card_gold.html`.

## Stack

- **Frontend**: React + Vite, React Router, `qrcode`, `html-to-image`, `lucide-react`
- **Backend**: Node.js + Express + Multer + `xlsx` (parses `.xlsx` / `.xls` / `.csv`)
- **Env**: `.env` lives inside `backend/`

## Project Structure

```
Employee_ID_Card/
├── corporate_id_card_gold.html        # original reference design
├── backend/
│   ├── .env                           # PORT, CORS_ORIGIN, UPLOAD_DIR
│   ├── server.js
│   ├── routes/employees.js            # POST /api/employees/upload, GET /api/employees/template
│   └── package.json
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx, App.jsx
│       ├── styles/global.css          # admin shell styling
│       ├── styles/card.css            # exact port of card layout
│       ├── components/
│       │   ├── Sidebar.jsx
│       │   ├── IDCard.jsx             # front + back card (exact layout)
│       │   ├── Dialog.jsx
│       │   ├── UploadDialog.jsx
│       │   └── ThemeDialog.jsx        # colour palette + custom picker + preview
│       └── pages/
│           ├── Dashboard.jsx
│           └── IDGenerator.jsx
└── sample_employees.csv               # ready-to-test dataset
```

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm run dev          # http://localhost:5000
```

### 2. Frontend (new terminal)

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so the frontend
calls work out of the box.

## How to Use

1. Open the admin panel and go to **ID Generator**.
2. Click the round **+** button (top-right) to open the upload dialog.
3. Drop or pick a CSV/XLSX file. (Use `sample_employees.csv` or download the
   template from inside the dialog.)
4. The parsed rows show in a table + a live preview grid.
5. Click **Generate Cards** → choose a colour palette (or use the custom
   colour pickers) → review the live preview → **Confirm & Generate**.
6. Each employee's card (front + back) is exported as a high-resolution PNG and
   auto-downloaded one by one.

## Required Columns (exact or close-match accepted)

| Header in file | Maps to |
|---|---|
| `Full_Name` / `Full Name` / `Name` | `fullName` |
| `Role` / `Designation` | `role` |
| `Department` / `Dept` | `department` |
| `Employee ID` / `Employee_ID` / `EmpID` | `employeeId` |
| `Card Type` / `Card_Type` / `Type` | `cardType` |
| `image URL` / `Image_URL` / `Photo` | `imageUrl` |
| `Organisation` / `Company` *(optional)* | `organisation` |
| `Valid Until` *(optional)* | `validUntil` |
| `Blood Group` *(optional)* | `bloodGroup` |
| `Contact` / `Phone` *(optional)* | `contact` |

Header matching is case-insensitive and ignores spaces/underscores/dashes.

## Image URLs & Export Notes

- For images to be embedded in the downloaded PNG, the host must allow CORS
  (`Access-Control-Allow-Origin: *`). Hosts like `i.pravatar.cc`,
  `picsum.photos`, S3 public buckets, GitHub raw content, etc. work fine.
- If an image fails CORS or 404s, the card falls back to a "PHOTO" placeholder
  and continues — generation never stalls.

## QR Codes

The QR encodes a JSON payload of the employee's identity:

```json
{ "id": "EMP-2024-0391", "name": "...", "role": "...", "dept": "...", "org": "..." }
```

Generated dynamically per card via the `qrcode` library — real, scannable codes.

## Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/employees/upload` | multipart `file` field; returns parsed `employees[]` |
| GET  | `/api/employees/template` | downloads a sample `.xlsx` |
| GET  | `/api/stats` | dashboard counters |
| POST | `/api/stats/increment` | bumps `totalGenerated` |
| GET  | `/api/health` | health check |

## Deployment

### Backend → Render

1. Push this repo to GitHub.
2. On [Render](https://render.com) → **New +** → **Web Service** → connect the repo.
3. Render auto-detects `backend/render.yaml`. Otherwise set manually:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
4. Environment variables:
   - `CORS_ORIGIN` = `https://<your-vercel-app>.vercel.app` (comma-separate to allow multiple)
   - `UPLOAD_DIR` = `./uploads`
   - `MAX_UPLOAD_MB` = `10`
5. Note the deployed URL, e.g. `https://employee-id-card-backend.onrender.com`.

### Frontend → Vercel

1. On [Vercel](https://vercel.com) → **Add New** → **Project** → import the repo.
2. **Root Directory**: `frontend`
3. Framework preset: **Vite** (auto-detected). Build command `npm run build`, output `dist`.
4. Environment variables:
   - `VITE_API_URL` = the Render backend URL from above (no trailing slash)
5. Deploy. SPA routing (`/view`, `/dashboard`, `/id-generator`) is handled by
   `frontend/vercel.json`.

### After both are live

- Visit the Vercel URL → admin panel loads, talks to the Render backend.
- QR codes generated by the app encode `<vercel-url>/view#<data>` automatically
  (uses `window.location.origin`), so phone scans open the public card preview.
- Update `CORS_ORIGIN` on Render to the exact Vercel URL for stricter security.
