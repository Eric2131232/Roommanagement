# 🏢 RoomManager Pro

A complete **Room Rental Management System** for **168 rooms across Wings A–H**.

## ✅ Features

- **Dashboard** — Occupancy stats, revenue, overdue rooms
- **Room Map** — Visual grid of all 168 rooms (Wings A, B, C, D, E, F, G, H)
- **Tenant Profiles** — Full profile with photo, ID, contacts, payment history, documents, notes
- **Payments** — Track paid / pending / overdue, mark paid, record payment method
- **Invoices** — Generate monthly invoices, print individual invoices
- **Reports** — Occupancy rate, collection rate, wing-by-wing summary
- **Settings** — Building info, payment due day, late fee, data export/import
- **💾 Auto-save** — All data saved in browser localStorage automatically

## 🏗 Room Structure

| Wing | Rooms | Count |
|------|-------|-------|
| A | A-01 → A-14 | 14 |
| B | B-01 → B-31 | 31 |
| C | C-01 → C-22 | 22 |
| D | D-01 → D-12 | 12 |
| E | E-01 → E-05 | 5 |
| F | F-01 → F-28 | 28 |
| G | G-01 → G-28 | 28 |
| H | H-01 → H-28 | 28 |
| **Total** | | **168** |

## 🚀 How to Use

### Option 1 — GitHub Pages (Free Online Hosting)

1. Upload this folder to a GitHub repository
2. Go to **Settings → Pages → Branch: main → Save**
3. Your site will be live at `https://YOUR-USERNAME.github.io/room-manager`

### Option 2 — Open Locally

Just open `index.html` in any browser. No server needed.

## 📁 File Structure

```
room-manager/
├── index.html    ← Main page (HTML structure)
├── style.css     ← All styles
├── data.js       ← Data layer + localStorage save/load
├── app.js        ← All UI logic and interactions
└── README.md     ← This file
```

## 💾 Data Storage

All data is stored in **browser localStorage** — it saves automatically and persists after closing/refreshing.

- Use **Settings → Export Backup** to download a `.json` backup
- Use **Settings → Import Backup** to restore from a backup file
- Data is stored per-browser (not shared between computers)

## 📱 Responsive

Works on desktop, tablet, and mobile.

---

Built with plain HTML, CSS, and JavaScript. No frameworks, no dependencies, no server required.
