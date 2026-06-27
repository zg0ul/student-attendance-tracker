/******************************************************************************
 * EMPLOYABILITY READINESS — QR ATTENDANCE  (Google Apps Script web app)
 * Writes attendance to a Google Sheet. Anti-proxy measures:
 *   1) Rotating, signed (HMAC) QR token — cannot be reused across sessions
 *      and expires after ~1-2 minutes, so screenshots go stale fast.
 *   2) One check-in per device per session — stops one phone marking many.
 *   3) One check-in per Student ID per session — stops double recording.
 *   4) (Optional) Geofence — rejects check-ins far from the classroom.
 *   5) Names looked up from a Roster sheet — students cannot type fake names.
 ******************************************************************************/

/********************  CONFIG — EDIT THIS BLOCK  ******************************/

// A long random string. Generate one (e.g. mash the keyboard 40+ chars) and
// keep it secret. It signs the QR tokens. If you change it, old QRs die.
const SHARED_SECRET = '1a34dmzZ09061969unijosoeemplo20252026unijordan2026';

const PROFESSORS = [        // Names that appear in the Display pull-down.
  'Dr. Moudar Zgoul',
  'Dr. Samah Rahamneh',
  'Dr Hani Jamleh',
  'Dr Ahlam Harahsheh',
  'Dr Diala Tarawneh',
  'Prof Ghaleb Sweis',
  'Dr Linda Hmoud',
  'Dr Mohannad Jreissat',
  'Dr Sahban Naser',
  'Dr Nanci Assaf',
  
];

const DAYS    = 10;         // course length
const PERIODS = 3;          // classes per day  -> 30 sessions total

const TOKEN_WINDOW_SECONDS = 60;   // QR rotates every N seconds
const TOKEN_GRACE_WINDOWS  = 1;    // also accept previous window (slow scanners)

const MAX_CHECKINS_PER_DEVICE_PER_SESSION = 1;  // raise to allow shared phones

// ---- Optional geofence (set REQUIRE_GEO = true to enforce) ----
const REQUIRE_GEO  = false;
const CLASS_LAT    = 31.9421;   // <- set to your classroom / campus latitude
const CLASS_LNG    = 35.8730;   // <- set to your classroom / campus longitude
const GEO_RADIUS_M = 200;       // allowed distance in metres

/********************  END CONFIG  *******************************************/

const ATT_SHEET    = 'Attendance';
const ROSTER_SHEET = 'Roster';

const ATT_HEADERS = ['Timestamp','Session Number','Day','Period',
                     'Student ID','Student Name','Professor',
                     'Device ID','Distance (m)','Status'];

/* ---------- One-time setup: run this once from the editor ---------- */
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let att = ss.getSheetByName(ATT_SHEET) || ss.insertSheet(ATT_SHEET);
  if (att.getLastRow() === 0) {
    att.appendRow(ATT_HEADERS);
    att.getRange(1,1,1,ATT_HEADERS.length).setFontWeight('bold');
    att.setFrozenRows(1);
  }
  let rost = ss.getSheetByName(ROSTER_SHEET) || ss.insertSheet(ROSTER_SHEET);
  if (rost.getLastRow() === 0) {
    rost.appendRow(['Student ID','Student Name']);
    rost.getRange(1,1,1,2).setFontWeight('bold');
    rost.setFrozenRows(1);
    rost.appendRow(['0123456','Paste your enrolment list here (ID in col A, Name in col B)']);
  }
  return 'Sheets ready. Now paste your roster, then deploy as a Web App.';
}

/* ---------- Web routing ---------- */
function doGet(e) {
  const page = (e && e.parameter && e.parameter.page) || 'display';

  if (page === 'checkin') {
    const t = HtmlService.createTemplateFromFile('Checkin');
    const s = parseInt(e.parameter.s, 10);
    const p = parseInt(e.parameter.p, 10);
    t.session   = s;
    t.day       = Math.ceil(s / PERIODS);
    t.period    = ((s - 1) % PERIODS) + 1;
    t.profName  = (PROFESSORS[p] || 'Unknown');
    t.profIndex = p;
    t.token     = e.parameter.t || '';
    return t.evaluate()
      .setTitle('Attendance Check-in')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
  }

  const d = HtmlService.createTemplateFromFile('Display');
  d.professors = PROFESSORS;
  d.days       = DAYS;
  d.periods    = PERIODS;
  d.webappUrl  = ScriptApp.getService().getUrl();
  return d.evaluate()
    .setTitle('Attendance Display')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/* ---------- Token: HMAC( session | profIndex | timeBucket ) ---------- */
function currentBucket_() {
  return Math.floor(Date.now() / 1000 / TOKEN_WINDOW_SECONDS);
}
function sign_(session, p, bucket) {
  const msg = session + '|' + p + '|' + bucket;
  const raw = Utilities.computeHmacSha256Signature(msg, SHARED_SECRET);
  const hex = raw.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
  return hex.substring(0, 20);          // 80-bit truncation — fine for short-lived tokens
}
// Called by the Display page every ~25s to refresh the QR.
function getToken(session, p) {
  const b = currentBucket_();
  return b + '.' + sign_(session, p, b);
}
function tokenValid_(session, p, token) {
  if (!token || token.indexOf('.') < 0) return false;
  const parts  = token.split('.');
  const bucket = parseInt(parts[0], 10);
  const sig    = parts[1];
  const cur    = currentBucket_();
  if (bucket > cur || bucket < cur - TOKEN_GRACE_WINDOWS) return false;   // too old / future
  return sig === sign_(session, p, bucket);
}

/* ---------- Roster lookup (cached) ---------- */
function lookupName_(id) {
  const cache = CacheService.getScriptCache();
  const hit = cache.get('name|' + id);
  if (hit !== null) return hit;                       // '' means "not in roster"
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rost = ss.getSheetByName(ROSTER_SHEET);
  let name = '';
  if (rost && rost.getLastRow() > 1) {
    const data = rost.getRange(2, 1, rost.getLastRow() - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) { name = String(data[i][1]).trim(); break; }
    }
  }
  cache.put('name|' + id, name, 21600);               // 6h
  return name;
}

/* ---------- The check-in (called from the student page) ---------- */
function recordAttendance(payload) {
  try {
    const session  = parseInt(payload.session, 10);
    const p        = parseInt(payload.prof, 10);
    const id       = String(payload.id || '').trim();
    const deviceId = String(payload.deviceId || '').trim();
    const lat      = payload.lat, lng = payload.lng;

    if (!id)                         return { ok:false, code:'NO_ID',     msg:'Please enter your Student ID.' };
    if (!tokenValid_(session, p, payload.token))
                                     return { ok:false, code:'EXPIRED',  msg:'This QR code has expired. Please scan the live code on screen again.' };

    const cache = CacheService.getScriptCache();

    // one ID per session
    if (cache.get('stu|' + session + '|' + id))
                                     return { ok:false, code:'DUP',      msg:'You are already marked present for this session.' };

    // one device per session
    const devKey = 'dev|' + session + '|' + deviceId;
    const devCount = parseInt(cache.get(devKey) || '0', 10);
    if (devCount >= MAX_CHECKINS_PER_DEVICE_PER_SESSION)
                                     return { ok:false, code:'DEVICE',   msg:'This phone has already been used to check in for this session.' };

    // geofence
    let dist = '';
    if (REQUIRE_GEO || (lat && lng)) {
      if (lat && lng) {
        dist = Math.round(distMeters_(lat, lng, CLASS_LAT, CLASS_LNG));
        if (REQUIRE_GEO && dist > GEO_RADIUS_M)
                                     return { ok:false, code:'GEO',      msg:'You appear to be outside the classroom. Please check in from inside the room.' };
      } else if (REQUIRE_GEO) {
                                     return { ok:false, code:'NO_GEO',   msg:'Please allow location access to check in.' };
      }
    }

    const name = lookupName_(id);
    const day    = Math.ceil(session / PERIODS);
    const period = ((session - 1) % PERIODS) + 1;
    const status = name ? 'OK' : 'ID NOT IN ROSTER';

    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATT_SHEET).appendRow([
      new Date(), session, day, period, id, name, (PROFESSORS[p] || ''),
      deviceId, dist, status
    ]);

    cache.put('stu|' + session + '|' + id, '1', 21600);
    cache.put(devKey, String(devCount + 1), 21600);

    return { ok:true, name: name || '(name not found — recorded by ID)', status:status };
  } catch (err) {
    return { ok:false, code:'ERR', msg:'Server busy, please tap submit again.' };
  }
}

/* live counter for the Display page */
function getCount(session) {
  const ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(ATT_SHEET);
  if (!ss || ss.getLastRow() < 2) return 0;
  const col = ss.getRange(2, 2, ss.getLastRow() - 1, 1).getValues();   // Session column
  let n = 0; for (let i = 0; i < col.length; i++) if (parseInt(col[i][0],10) === session) n++;
  return n;
}

function distMeters_(lat1, lng1, lat2, lng2) {
  const R = 6371000, toR = function (x) { return x * Math.PI / 180; };
  const dLat = toR(lat2 - lat1), dLng = toR(lng2 - lng1);
  const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
            Math.cos(toR(lat1))*Math.cos(toR(lat2))*Math.sin(dLng/2)*Math.sin(dLng/2);
  return 2 * R * Math.asin(Math.sqrt(a));
}
