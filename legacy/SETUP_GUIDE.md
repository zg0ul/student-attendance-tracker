# Employability Readiness — QR Attendance: Setup Guide

A free, self-hosted attendance system. It runs entirely on Google (Sheets +
Apps Script), writes straight to your spreadsheet, and needs no server, no
hosting bill, and no app install for students — they just scan a QR with the
phone camera.

---

## What you get in the spreadsheet

Each check-in adds one row:

`Timestamp | Session Number | Day | Period | Student ID | Student Name | Professor | Device ID | Distance (m) | Status`

- **Student Name** is filled automatically from a Roster sheet (students never type it).
- **Status** flags `ID NOT IN ROSTER` if a typed ID isn't recognised, so you can spot bad entries.
- **Professor** is whatever the professor selected on the projection screen — students can't choose or change it.

---

## One-time setup (about 15 minutes)

1. **Create the spreadsheet.** In Google Drive: New → Google Sheets. Name it
   e.g. *Employability Attendance*.

2. **Open the script editor.** In the sheet: **Extensions → Apps Script**.

3. **Add the three files.**
   - The default `Code.gs` is already open — delete its contents and paste in **Code.gs** from this package.
   - Click the **+** next to *Files* → **HTML** → name it exactly `Display` → paste **Display.html**.
   - **+** → **HTML** → name it exactly `Checkin` → paste **Checkin.html**.
   - Save (the disk icon).

4. **Edit the CONFIG block** at the top of `Code.gs`:
   - `SHARED_SECRET`: replace with a long random string (40+ characters). Keep it private.
   - `PROFESSORS`: list the exact names you want in the pull-down.
   - Set `DAYS` and `PERIODS` if different from 10 × 3.
   - (Optional) For the geofence, set `REQUIRE_GEO = true`, then set
     `CLASS_LAT` / `CLASS_LNG` to your classroom coordinates (get them from
     Google Maps — right-click the building → the lat,lng at the top) and a
     sensible `GEO_RADIUS_M`.

5. **Run `setupSheets` once.** In the editor, choose the function
   `setupSheets` from the dropdown and click **Run**. Approve the permissions
   prompt (it's your own account). This creates the **Attendance** and
   **Roster** sheets.

6. **Paste your roster.** Open the **Roster** sheet → put Student IDs in
   column A and names in column B, starting row 2. (Remove the placeholder row.)

7. **Deploy as a Web App.**
   - **Deploy → New deployment → Type: Web app.**
   - Execute as: **Me**.
   - Who has access: **Anyone** (this is required so students can open the
     link without logging in). The link is unguessable; access is still gated
     by the rotating signed token.
   - Click **Deploy**, authorise, and **copy the Web App URL**.

8. **Bookmark the URL** on the classroom computer. That URL opens the
   professor's projection page.

> If you later edit the code, use **Deploy → Manage deployments → Edit (pencil)
> → Version: New version → Deploy** so the live URL updates.

---

## Running a class

1. On the classroom computer, open the Web App URL and **project it**.
2. Select your **name**, the **Day**, and the **Class/Period** → click
   **Show QR for this class**.
3. A large QR appears and **auto-refreshes**. Students scan it with their phone
   camera, enter their Student ID, and tap *Mark me present*.
4. The live counter shows arrivals in real time. When done, click
   **End / change class** (or reload) to switch to the next session.

That's it — rows appear in the **Attendance** sheet instantly.

---

## How it resists proxy attendance

- **Rotating signed token.** The QR encodes a token that is cryptographically
  signed and tied to that session. It is valid only ~1–2 minutes, so a
  screenshot taken at the start of class is useless minutes later, and a code
  from one session can never be reused in another.
- **One phone, one student, per session.** A single device can't mark several
  people present in the same session — this stops the common "I'll sign in for
  my friends" move from one phone.
- **One ID per session.** Duplicate check-ins for the same ID are rejected.
- **Roster names.** Students can't invent names; the name comes from your list.
- **Optional geofence.** With `REQUIRE_GEO` on, a check-in from outside the
  room is rejected — this is the strongest lever against an absent friend
  scanning a relayed code, though indoor GPS is imperfect (see Limitations).

### Honest limitations
No scan-based system is bulletproof. A student in the room can still photograph
the live QR and send it to an absent friend who scans it within the ~1–2 minute
window. To do that they must coordinate in real time, every session — which is
usually more effort than it's worth for a summer course. If you need to fully
close that gap, turn on the geofence, and/or have a TA spot-check the room
against the live counter a couple of times per class.

---

## Scale & reliability notes (500+ students)

- Check-ins are de-duplicated using Google's fast cache (per session), so the
  system doesn't slow down as the sheet grows over the 10 days.
- The main load is the *rush* when a class starts. To smooth it, reveal the QR
  a couple of minutes into the session rather than before students settle — or
  leave it up for the first 10 minutes. The student page auto-retries on a
  transient error.
- If your University of Jordan account is **Google Workspace for Education**
  (very likely), execution quotas are comfortably higher than a personal Gmail
  account. Build it on your UJ account if you can.
