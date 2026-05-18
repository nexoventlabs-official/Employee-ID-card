const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
const maxMb = Number(process.env.MAX_UPLOAD_MB || 10);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-z0-9.\-_]/gi, '_');
    cb(null, `${Date.now()}_${safe}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(xlsx|xls|csv)$/i.test(file.originalname);
    cb(ok ? null : new Error('Only .xlsx, .xls, .csv files allowed'), ok);
  },
});

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Format any date-like input into "MMM YYYY" (e.g. "Dec 2025").
// Falls back to the trimmed string if it can't be parsed.
function formatMonthYear(v) {
  if (v == null || v === '') return '';
  if (v instanceof Date && !isNaN(v)) return `${MONTHS[v.getMonth()]} ${v.getFullYear()}`;
  const s = String(v).trim();
  // already short like "Dec 2025" or "December 2025" — leave as is
  if (/^[A-Za-z]{3,9}\s+\d{4}$/.test(s)) return s;
  const d = new Date(s);
  if (!isNaN(d)) return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return s;
}

function asString(v) {
  if (v == null) return '';
  if (v instanceof Date && !isNaN(v)) return formatMonthYear(v);
  return String(v).trim();
}

// normalise headers to canonical keys
function normaliseRow(row) {
  const out = {};
  for (const key of Object.keys(row)) {
    const k = key.trim().toLowerCase().replace(/[\s_\-]+/g, '');
    const v = row[key];
    if (k === 'fullname' || k === 'name') out.fullName = asString(v);
    else if (k === 'role' || k === 'designation') out.role = asString(v);
    else if (k === 'department' || k === 'dept') out.department = asString(v);
    else if (k === 'employeeid' || k === 'empid' || k === 'id') out.employeeId = asString(v);
    else if (k === 'cardtype' || k === 'type') out.cardType = asString(v);
    else if (k === 'imageurl' || k === 'photo' || k === 'image' || k === 'photourl') out.imageUrl = asString(v);
    else if (k === 'organisation' || k === 'organization' || k === 'company') out.organisation = asString(v);
    else if (k === 'validuntil' || k === 'valid') out.validUntil = formatMonthYear(v);
    else if (k === 'bloodgroup' || k === 'blood') out.bloodGroup = asString(v);
    else if (k === 'contact' || k === 'phone' || k === 'mobile') out.contact = asString(v);
    else if (k === 'email') out.email = asString(v);
    else out[key] = v;
  }
  return out;
}

module.exports = (stats) => {
  const router = express.Router();

  router.post('/upload', upload.single('file'), (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const filePath = req.file.path;
      const wb = xlsx.readFile(filePath, { cellDates: true });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rawRows = xlsx.utils.sheet_to_json(sheet, { defval: '' });

      const employees = rawRows
        .map(normaliseRow)
        .filter((r) => r.fullName || r.employeeId);

      if (stats) {
        stats.totalUploads += 1;
        stats.lastBatch = {
          fileName: req.file.originalname,
          count: employees.length,
          at: new Date().toISOString(),
        };
      }

      // remove the file after parsing to keep disk clean
      fs.unlink(filePath, () => {});

      res.json({
        success: true,
        count: employees.length,
        employees,
      });
    } catch (err) {
      next(err);
    }
  });

  router.get('/template', (_req, res) => {
    const headers = [
      ['Full_Name', 'Role', 'Department', 'Employee ID', 'Card Type', 'image URL', 'Organisation', 'Valid Until', 'Blood Group', 'Contact'],
      ['Alcide Piccio', 'Senior Designer', 'Creative Division', 'EMP-2024-0391', 'Employee', 'https://i.pravatar.cc/200?img=12', 'Acme Corp International', 'Dec 2025', 'O +ve', '+91 98765 43210'],
    ];
    const ws = xlsx.utils.aoa_to_sheet(headers);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Employees');
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="employee_template.xlsx"');
    res.send(buf);
  });

  return router;
};
