// ============================================================
//  LYFA – App.jsx
//  Features: Multi-language · Multiple Caregivers · Snooze
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase/config";
import { getUserProfile, listenMedications, listenSOSAlerts, addMedication, updateMedicationStatus, deleteMedication, logSOSAlert, acknowledgeSOSAlert } from "./firebase/db";
import { sendSOSEmail } from "./firebase/emailService";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import RespondPage from "./pages/RespondPage";
import { LANGUAGES, T } from "./i18n";

// ─── URL-based routing for caregiver response page ────────
const urlParams        = new URLSearchParams(window.location.search);
const RESPOND_UID      = urlParams.get("uid");
const RESPOND_ALERT_ID = urlParams.get("alertId");
const IS_RESPOND_PAGE  = urlParams.get("respond") === "true" && RESPOND_UID && RESPOND_ALERT_ID;

// ─── SOUND ENGINE ─────────────────────────────────────────
function playMedicationAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.38, 0.76].forEach((t) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(740, ctx.currentTime + t);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + t + 0.18);
      gain.gain.setValueAtTime(0, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + t + 0.06);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.32);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.36);
    });
  } catch (e) {}
}
function playSOSSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.25, 0.5, 0.75].forEach((t) => {
      const osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "square";
      osc.frequency.setValueAtTime(t % 0.5 === 0 ? 880 : 660, ctx.currentTime + t);
      gain.gain.setValueAtTime(0.3, ctx.currentTime + t);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + t + 0.22);
      osc.start(ctx.currentTime + t); osc.stop(ctx.currentTime + t + 0.24);
    });
  } catch (e) {}
}

// ─── FONTS ────────────────────────────────────────────────
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800;900&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');`;

const css = `
* { box-sizing:border-box; margin:0; padding:0; }
body { font-family:'Nunito',sans-serif; }
:root {
  --sky:#4a9eff; --sky-l:#e8f3ff; --sky-d:#1a6fd4;
  --green:#34c97b; --green-l:#e6f9f0;
  --red:#ff5a5a; --red-l:#fff0f0;
  --orange:#ff9a3c; --orange-l:#fff4e8;
  --purple:#8b5cf6; --purple-l:#f0ebff;
  --text:#1e293b; --muted:#64748b; --border:#e2e8f0; --white:#fff;
  --shadow:0 4px 20px rgba(0,0,0,.08);
  --shadow-lg:0 8px 40px rgba(0,0,0,.14);
}
.app { min-height:100vh; background:linear-gradient(160deg,#e8f3ff 0%,#f0f4f8 40%,#e6f9f0 100%); }

/* BANNERS */
.notif-banner { background:linear-gradient(135deg,#fff8e8,#fff3d4); border-bottom:2px solid rgba(255,154,60,.3); padding:10px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.notif-banner p { font-size:13px; font-weight:700; color:#92540a; display:flex; align-items:center; gap:8px; }
.btn-allow { padding:7px 16px; background:var(--orange); color:#fff; border:none; border-radius:9px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:800; cursor:pointer; }
.btn-dismiss { padding:7px 12px; background:transparent; color:#92540a; border:1.5px solid rgba(255,154,60,.4); border-radius:9px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:800; cursor:pointer; }
.notif-on { display:flex; align-items:center; gap:8px; padding:8px 20px; background:var(--green-l); border-bottom:2px solid rgba(52,201,123,.2); font-size:13px; font-weight:700; color:#1a8a52; }
.snooze-bar { background:linear-gradient(135deg,#fff4e8,#fff0d4); border-bottom:2px solid rgba(255,154,60,.25); padding:10px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.snooze-bar-l { display:flex; align-items:center; gap:10px; font-size:13px; font-weight:700; color:#92540a; }
.snooze-timer { font-size:18px; font-weight:900; color:var(--orange); font-family:'Lora',serif; min-width:44px; }
.snooze-cancel { padding:6px 14px; background:transparent; color:#92540a; border:1.5px solid rgba(255,154,60,.4); border-radius:9px; font-family:'Nunito',sans-serif; font-size:12px; font-weight:800; cursor:pointer; }
.snooze-cancel:hover { background:var(--orange); color:#fff; }

/* HEADER */
.hdr { background:var(--white); border-bottom:2px solid var(--border); padding:14px 24px; display:flex; align-items:center; justify-content:space-between; box-shadow:0 2px 12px rgba(74,158,255,.1); position:sticky; top:0; z-index:100; }
.hdr-l { display:flex; align-items:center; gap:12px; }
.hdr-logo { width:52px; height:52px; border-radius:14px; background:#ffffff; border:2px solid var(--border); display:flex; align-items:center; justify-content:center; overflow:hidden; padding:4px; }
.hdr-brand h1 { font-size:20px; font-weight:900; color:var(--text); letter-spacing:-.5px; }
.hdr-brand p { font-size:11px; color:var(--muted); font-weight:700; }
.hdr-r { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.hdr-time .t { font-size:22px; font-weight:600; color:var(--sky-d); font-family:'Lora',serif; }
.hdr-time .d { font-size:11px; color:var(--muted); text-align:right; }
.hdr-user { display:flex; align-items:center; gap:8px; padding:6px 12px; background:var(--sky-l); border-radius:20px; font-size:13px; font-weight:700; color:var(--sky-d); cursor:pointer; border:none; font-family:'Nunito',sans-serif; }
.hdr-user img { width:24px; height:24px; border-radius:50%; }
.lang-select { padding:6px 10px; border:2px solid var(--border); border-radius:10px; font-family:'Nunito',sans-serif; font-size:13px; font-weight:700; color:var(--text); background:var(--white); cursor:pointer; outline:none; }

/* TABS */
.tabs { display:flex; background:var(--white); border-bottom:2px solid var(--border); padding:0 20px; overflow-x:auto; }
.tab { padding:13px 22px; border:none; background:transparent; font-family:'Nunito',sans-serif; font-size:14px; font-weight:700; color:var(--muted); cursor:pointer; border-bottom:3px solid transparent; margin-bottom:-2px; transition:all .2s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
.tab:hover { color:var(--sky); }
.tab.on { color:var(--sky-d); border-bottom-color:var(--sky); }
.badge { background:var(--red); color:#fff; border-radius:10px; font-size:11px; font-weight:800; padding:1px 7px; }

/* MAIN */
.main { max-width:860px; margin:0 auto; padding:24px 18px; }

/* CARDS */
.card { background:var(--white); border-radius:20px; padding:22px; margin-bottom:18px; box-shadow:var(--shadow); border:1.5px solid var(--border); }
.ch { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.ct { font-size:17px; font-weight:800; color:var(--text); display:flex; align-items:center; gap:10px; }
.ci { width:34px; height:34px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:17px; }
.ci-b{background:var(--sky-l);} .ci-g{background:var(--green-l);} .ci-r{background:var(--red-l);} .ci-p{background:var(--purple-l);}

/* FORM */
.frow { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px; }
.fg { display:flex; flex-direction:column; gap:5px; }
.fl { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; }
.fi { padding:11px 14px; border:2px solid var(--border); border-radius:12px; font-family:'Nunito',sans-serif; font-size:15px; color:var(--text); transition:border-color .2s; background:#fafbfc; outline:none; }
.fi:focus { border-color:var(--sky); background:var(--white); }

/* BUTTONS */
.btn { padding:11px 22px; border:none; border-radius:12px; font-family:'Nunito',sans-serif; font-size:15px; font-weight:800; cursor:pointer; transition:all .18s; display:inline-flex; align-items:center; gap:7px; }
.btn-p { background:linear-gradient(135deg,var(--sky),var(--sky-d)); color:#fff; box-shadow:0 4px 14px rgba(74,158,255,.35); }
.btn-p:hover { transform:translateY(-2px); }
.btn-g { background:linear-gradient(135deg,var(--green),#27ae74); color:#fff; box-shadow:0 4px 14px rgba(52,201,123,.3); }
.btn-g:hover { transform:translateY(-2px); }
.btn-r { background:var(--red-l); color:var(--red); border:2px solid rgba(255,90,90,.2); }
.btn-r:hover { background:var(--red); color:#fff; }
.btn-sm { padding:7px 14px; font-size:13px; border-radius:9px; }
.btn-full { width:100%; justify-content:center; }
.btn:disabled { opacity:.6; cursor:not-allowed; }

/* MED LIST */
.ml { display:flex; flex-direction:column; gap:10px; }
.mi { display:flex; align-items:center; gap:12px; padding:14px; border-radius:14px; border:2px solid var(--border); background:#fafbfc; transition:all .2s; }
.mi:hover { border-color:var(--sky); background:var(--sky-l); }
.mdot { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
.mdot-p{background:var(--orange);box-shadow:0 0 0 3px rgba(255,154,60,.2);}
.mdot-t{background:var(--green);box-shadow:0 0 0 3px rgba(52,201,123,.2);}
.mdot-m{background:var(--red);box-shadow:0 0 0 3px rgba(255,90,90,.2);}
.mn { font-size:15px; font-weight:800; color:var(--text); }
.mt2 { font-size:12px; color:var(--muted); font-weight:600; margin-top:2px; }
.ms { font-size:11px; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }
.ms-p{background:var(--orange-l);color:var(--orange);}
.ms-t{background:var(--green-l);color:#1a8a52;}
.ms-m{background:var(--red-l);color:var(--red);}
.mac { display:flex; gap:7px; flex-shrink:0; }

/* SOS */
.sos-wrap { display:flex; flex-direction:column; align-items:center; gap:20px; padding:10px 0; }
.sos-ring { position:relative; display:flex; align-items:center; justify-content:center; }
.sos-p1,.sos-p2 { position:absolute; border-radius:50%; animation:sosPulse 2s infinite; }
.sos-p1 { width:190px; height:190px; background:rgba(255,90,90,.14); }
.sos-p2 { width:152px; height:152px; background:rgba(255,90,90,.2); animation-delay:.5s; }
@keyframes sosPulse { 0%{transform:scale(.9);opacity:1} 100%{transform:scale(1.4);opacity:0} }
.sos-btn { position:relative; width:126px; height:126px; border-radius:50%; background:linear-gradient(145deg,#ff7070,#e03030); border:none; cursor:pointer; font-family:'Nunito',sans-serif; color:#fff; font-size:26px; font-weight:900; letter-spacing:2px; box-shadow:0 8px 30px rgba(255,60,60,.5),inset 0 -4px 0 rgba(0,0,0,.15); transition:all .15s; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; }
.sos-btn:hover { transform:scale(1.05); }
.sos-btn:active { transform:scale(.96); }
.sos-sub { font-size:10px; font-weight:700; letter-spacing:1px; opacity:.9; }
.sos-txt { text-align:center; font-size:14px; color:var(--muted); font-weight:600; max-width:280px; line-height:1.6; }
.sos-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; width:100%; }
.sos-ic { background:var(--red-l); border-radius:14px; padding:14px; border:1.5px solid rgba(255,90,90,.15); text-align:center; }
.sos-ic .n { font-size:24px; font-weight:900; color:var(--red); }
.sos-ic .l { font-size:12px; color:var(--muted); font-weight:700; margin-top:2px; }
.sos-ok { background:linear-gradient(135deg,#fff0f0,#ffe4e4); border:2px solid rgba(255,90,90,.25); border-radius:16px; padding:22px; text-align:center; animation:flash .5s 3; }
@keyframes flash { 0%,100%{background:linear-gradient(135deg,#fff0f0,#ffe4e4)} 50%{background:linear-gradient(135deg,#ffd0d0,#ffb8b8)} }
.sos-ok h3 { font-size:18px; font-weight:900; color:var(--red); margin-bottom:6px; }
.sos-ok p { font-size:14px; color:var(--muted); }

/* CAREGIVER LIST in SOS tab */
.cg-list { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
.cg-item { display:flex; align-items:center; gap:12px; padding:11px 14px; background:var(--sky-l); border-radius:12px; border:1.5px solid rgba(74,158,255,.2); }
.cg-item .cg-av { width:32px; height:32px; border-radius:50%; background:linear-gradient(135deg,var(--sky),var(--sky-d)); display:flex; align-items:center; justify-content:center; font-size:15px; color:#fff; font-weight:800; flex-shrink:0; }
.cg-item .cg-n { font-size:14px; font-weight:800; color:var(--sky-d); }
.cg-item .cg-rel { font-size:12px; color:var(--muted); font-weight:600; }

/* STATS */
.stats { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:18px; }
.sc { border-radius:16px; padding:16px; text-align:center; border:1.5px solid transparent; }
.sc .sn { font-size:34px; font-weight:900; line-height:1; }
.sc .sl { font-size:12px; font-weight:700; margin-top:4px; }
.sc-b{background:var(--sky-l);border-color:rgba(74,158,255,.2);} .sc-b .sn,.sc-b .sl{color:var(--sky-d);}
.sc-g{background:var(--green-l);border-color:rgba(52,201,123,.2);} .sc-g .sn,.sc-g .sl{color:#1a8a52;}
.sc-r{background:var(--red-l);border-color:rgba(255,90,90,.2);} .sc-r .sn,.sc-r .sl{color:var(--red);}

/* HISTORY */
.hl { display:flex; flex-direction:column; gap:8px; }
.hi { display:flex; align-items:center; gap:11px; padding:11px 14px; border-radius:12px; background:#fafbfc; border:1.5px solid var(--border); }
.hic { font-size:19px; width:30px; text-align:center; }
.hin { font-size:14px; font-weight:700; color:var(--text); }
.hit { font-size:12px; color:var(--muted); font-weight:600; }
.hb { font-size:11px; font-weight:800; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:.5px; white-space:nowrap; }

/* MODAL */
.mo { position:fixed; inset:0; background:rgba(0,0,0,.5); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px; backdrop-filter:blur(4px); animation:fadeIn .2s; }
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.md { background:var(--white); border-radius:24px; padding:30px; max-width:420px; width:100%; box-shadow:var(--shadow-lg); animation:slideUp .25s; }
@keyframes slideUp{from{transform:translateY(30px);opacity:0}to{transform:translateY(0);opacity:1}}
.md-ico { text-align:center; font-size:52px; margin-bottom:14px; animation:bounce .6s ease infinite alternate; }
@keyframes bounce{from{transform:scale(1)}to{transform:scale(1.12)}}
.md-t { font-size:21px; font-weight:900; color:var(--text); text-align:center; margin-bottom:8px; }
.md-b { font-size:15px; color:var(--muted); text-align:center; line-height:1.6; margin-bottom:22px; }
.md-act { display:flex; gap:10px; }
.md-act .btn { flex:1; justify-content:center; }

/* SNOOZE */
.snooze-options { display:flex; gap:8px; margin-top:10px; flex-wrap:wrap; }
.btn-snooze { padding:9px 16px; border:2px solid rgba(255,154,60,.3); border-radius:10px; background:var(--orange-l); color:#92540a; font-family:'Nunito',sans-serif; font-size:13px; font-weight:800; cursor:pointer; transition:all .18s; flex:1; }
.btn-snooze:hover { background:var(--orange); color:#fff; border-color:var(--orange); transform:translateY(-1px); }

/* TOAST */
.toasts { position:fixed; top:18px; right:18px; z-index:2000; display:flex; flex-direction:column; gap:9px; }
.toast { background:var(--white); border-radius:13px; padding:12px 16px; box-shadow:var(--shadow-lg); border-left:4px solid var(--sky); min-width:260px; animation:toastIn .3s; display:flex; align-items:flex-start; gap:9px; }
@keyframes toastIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
.toast-sos{border-left-color:var(--red);} .toast-t{border-left-color:var(--green);} .toast-m{border-left-color:var(--orange);}
.toast-title { font-size:13px; font-weight:800; color:var(--text); }
.toast-msg { font-size:12px; color:var(--muted); margin-top:2px; }

.empty { text-align:center; padding:30px; color:var(--muted); font-size:14px; font-weight:600; }
.empty .ei { font-size:38px; margin-bottom:8px; }
.spin { display:flex; align-items:center; justify-content:center; height:100vh; font-size:14px; color:var(--muted); font-family:'Nunito',sans-serif; }

/* SETTINGS */
.settings-section { margin-bottom:10px; }
.settings-label { font-size:12px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:.5px; margin-bottom:6px; }
.cg-edit-card { background:#fafbfc; border:1.5px solid var(--border); border-radius:14px; padding:14px 14px 8px; margin-bottom:10px; }
.cg-edit-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.cg-edit-num { font-size:13px; font-weight:800; color:var(--sky); }
.cg-remove-btn { font-size:12px; font-weight:800; color:var(--red); background:var(--red-l); border:1.5px solid rgba(255,90,90,.2); border-radius:8px; padding:3px 10px; cursor:pointer; font-family:'Nunito',sans-serif; }
.add-cg-btn { width:100%; padding:10px; background:var(--sky-l); color:var(--sky-d); border:2px dashed var(--sky); border-radius:11px; font-size:14px; font-weight:800; cursor:pointer; font-family:'Nunito',sans-serif; margin-bottom:16px; }
.settings-msg { padding:10px 14px; border-radius:10px; font-size:13px; font-weight:700; margin-bottom:12px; }
.settings-msg.ok { background:var(--green-l); color:#1a8a52; }
.settings-msg.err { background:var(--red-l); color:var(--red); }

@media(max-width:600px){
  .frow{grid-template-columns:1fr;}
  .stats{grid-template-columns:1fr;}
  .sos-grid{grid-template-columns:1fr;}
  .main{padding:14px 10px;}
  .hdr{padding:10px 12px;}
  .hdr-time .t{font-size:18px;}
}
`;

// ─── HELPERS ──────────────────────────────────────────────
function fmt(date)     { return new Date(date).toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" }); }
function fmtFull(date) { return new Date(date).toLocaleString("en-IN", { dateStyle:"medium", timeStyle:"short" }); }
function fmtDate(date) { return date.toLocaleDateString([], { weekday:"long", month:"long", day:"numeric" }); }
function fmtTime(date) { return date.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit", second:"2-digit" }); }
let _toastId = 0;

// ─── APP ──────────────────────────────────────────────────
export default function App() {
  const [authState, setAuthState]         = useState("loading");
  const [firebaseUser, setFirebaseUser]   = useState(null);
  const [profile, setProfile]             = useState(null);
  const [lang, setLang]                   = useState("en");
  const [tab, setTab]                     = useState("medications");
  const [medications, setMedications]     = useState([]);
  const [sosAlerts, setSosAlerts]         = useState([]);
  const [medName, setMedName]             = useState("");
  const [medTime, setMedTime]             = useState("");
  const [toasts, setToasts]               = useState([]);
  const [now, setNow]                     = useState(new Date());
  const [reminderModal, setReminderModal] = useState(null);
  const [sosModal, setSosModal]           = useState(false);
  const [sosActivated, setSosActivated]   = useState(false);
  const [checkedReminders, setCheckedReminders] = useState(new Set());
  const [adding, setAdding]               = useState(false);
  const [sosSending, setSosSending]       = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [showNotifBanner, setShowNotifBanner] = useState(false);
  const [snoozedMeds, setSnoozedMeds]         = useState({});
  const [snoozeCountdown, setSnoozeCountdown] = useState(null);
  const [showSettings, setShowSettings]       = useState(false);
  const [settingsCaregivers, setSettingsCaregivers] = useState([]);
  const [settingsName, setSettingsName]       = useState("");
  const [settingsSaving, setSettingsSaving]   = useState(false);
  const [settingsMsg, setSettingsMsg]         = useState("");

  const t = T[lang] || T["en"];

  // ── Show caregiver response page if URL matches ────────
  if (IS_RESPOND_PAGE) {
    return <RespondPage uid={RESPOND_UID} alertId={RESPOND_ALERT_ID} />;
  }

  // ── Auth ───────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) { setAuthState("guest"); return; }
      setFirebaseUser(fbUser);
      const p = await getUserProfile(fbUser.uid);
      if (p?.onboardingDone) {
        setProfile(p);
        setLang(p.language || "en");
        setAuthState("user");
      } else { setAuthState("onboarding"); }
    });
    return unsub;
  }, []);

  // ── Notification banner ────────────────────────────────
  useEffect(() => {
    if (authState === "user" && typeof Notification !== "undefined" && Notification.permission === "default") {
      setTimeout(() => setShowNotifBanner(true), 2000);
    }
  }, [authState]);

  // ── Firestore listeners ────────────────────────────────
  useEffect(() => {
    if (authState !== "user" || !firebaseUser) return;
    const u1 = listenMedications(firebaseUser.uid, setMedications);
    const u2 = listenSOSAlerts(firebaseUser.uid, setSosAlerts);
    return () => { u1(); u2(); };
  }, [authState, firebaseUser]);

  // ── Clock ──────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Reminder check with snooze ─────────────────────────
  useEffect(() => {
    const cur = now.toTimeString().slice(0, 5);
    const nowMs = now.getTime();
    medications.forEach((med) => {
      const snoozeUntil  = snoozedMeds[med.id];
      const isSnoozed    = snoozeUntil && nowMs < snoozeUntil;
      const snoozeReady  = snoozeUntil && nowMs >= snoozeUntil;
      const isScheduled  = med.status === "pending" && med.time === cur && !checkedReminders.has(med.id);
      const isSnoozeOver = med.status === "pending" && snoozeReady;

      if (isScheduled || isSnoozeOver) {
        if (isScheduled)  setCheckedReminders((s) => new Set([...s, med.id]));
        if (isSnoozeOver) setSnoozedMeds((s) => { const n = {...s}; delete n[med.id]; return n; });
        playMedicationAlert();
        setReminderModal(med);
        setSnoozeCountdown(null);
        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification("💊 " + t.reminderTitle, {
            body: `${t.reminderBody} ${med.name}`,
            requireInteraction: true,
          });
        }
      }
      // Live countdown
      if (isSnoozed && reminderModal === null) {
        const secsLeft = Math.ceil((snoozeUntil - nowMs) / 1000);
        setSnoozeCountdown({ medId: med.id, secondsLeft: secsLeft, medName: med.name });
      }
    });
  }, [now, medications, checkedReminders, snoozedMeds, lang]);

  // ── Request notifications ──────────────────────────────
  const requestNotifPermission = async () => {
    const result = await Notification.requestPermission();
    setNotifPermission(result);
    setShowNotifBanner(false);
    if (result === "granted") toast("🔔 " + t.notifsOn, "", "t");
  };

  // ── Toast ──────────────────────────────────────────────
  const toast = useCallback((title, msg, type = "") => {
    const id = ++_toastId;
    setToasts((p) => [...p, { id, title, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 4500);
  }, []);

  // ── Add medication ─────────────────────────────────────
  const handleAddMed = async () => {
    if (!medName.trim() || !medTime) return;
    setAdding(true);
    try {
      await addMedication(firebaseUser.uid, { name: medName.trim(), time: medTime });
      toast("✅ " + t.addBtn, `${medName.trim()} ${medTime}`, "t");
      setMedName(""); setMedTime("");
    } catch { toast("❌ Error", "Could not add.", "m"); }
    finally { setAdding(false); }
  };

  // ── Mark taken/missed ──────────────────────────────────
  const markMed = async (id, status) => {
    const med = medications.find((m) => m.id === id);
    setReminderModal(null);
    try {
      await updateMedicationStatus(firebaseUser.uid, id, status);
      toast(status === "taken" ? "💊 " + t.taken : "⚠️ " + t.missed, med?.name || "", status === "taken" ? "t" : "m");
    } catch { toast("❌ Error", ""); }
  };

  // ── Snooze ─────────────────────────────────────────────
  const snoozeMed = (med, minutes) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    setSnoozedMeds((s) => ({ ...s, [med.id]: snoozeUntil }));
    setReminderModal(null);
    toast(`⏰ ${minutes} ${t.snoozeMin}`, med.name, "m");
  };

  // ── Delete medication ──────────────────────────────────
  const handleDelete = async (id) => {
    try { await deleteMedication(firebaseUser.uid, id); }
    catch { toast("❌ Error", ""); }
  };

  // ── Mark SOS as responded ─────────────────────────────
  const markResponded = async (alertId) => {
    try {
      await acknowledgeSOSAlert(firebaseUser.uid, alertId, "Caregiver");
      toast("✅ Marked as responded!", "", "t");
    } catch { toast("❌ Error", "Could not update."); }
  };
  const confirmSOS = async () => {
    setSosSending(true); setSosModal(false); playSOSSound();
    try {
      const caregivers = profile.caregivers || [{ name: profile.caregiverName, email: profile.caregiverEmail, relation: "" }];
      const alertId = await logSOSAlert(firebaseUser.uid, profile.elderName, caregivers.map((c) => c.email).join(", "));
      const respondUrl = `${window.location.origin}/?respond=true&uid=${firebaseUser.uid}&alertId=${alertId}`;
      const result = await sendSOSEmail(caregivers, profile.elderName, respondUrl);
      toast("🚨 SOS", result.success ? `Sent to ${result.sent} caregiver(s)!` : "Logged. Check email config.", "sos");
      setSosActivated(true);
      setTimeout(() => setSosActivated(false), 10000);
    } catch { toast("❌ Error", "SOS failed."); }
    finally { setSosSending(false); }
  };

  // ── Language change (save to Firestore) ───────────────
  const handleLangChange = async (newLang) => {
    setLang(newLang);
    if (firebaseUser) {
      const { saveUserProfile } = await import("./firebase/db");
      await saveUserProfile(firebaseUser.uid, { language: newLang });
    }
  };

  // ── Open settings — pre-fill with current profile ─────
  const openSettings = () => {
    setSettingsName(profile?.elderName || "");
    setSettingsCaregivers(
      caregivers.length > 0
        ? caregivers.map((c) => ({ ...c }))
        : [{ name: "", email: "", relation: "" }]
    );
    setSettingsMsg("");
    setTab("settings");
  };

  // ── Save settings to Firestore ─────────────────────────
  const saveSettings = async () => {
    if (!settingsName.trim()) return setSettingsMsg("❌ Please enter your name.");
    const filled = settingsCaregivers.filter((c) => c.name.trim() || c.email.trim());
    if (filled.length === 0) return setSettingsMsg("❌ Add at least one caregiver.");
    for (const c of filled) {
      if (!c.email.includes("@")) return setSettingsMsg(`❌ Invalid email for ${c.name || "caregiver"}.`);
    }
    setSettingsSaving(true);
    try {
      const { saveUserProfile } = await import("./firebase/db");
      const cleanCaregivers = filled.map((c) => ({ name: c.name.trim(), email: c.email.trim().toLowerCase(), relation: c.relation.trim() }));
      await saveUserProfile(firebaseUser.uid, {
        elderName:      settingsName.trim(),
        caregivers:     cleanCaregivers,
        caregiverName:  cleanCaregivers[0].name,
        caregiverEmail: cleanCaregivers[0].email,
      });
      setProfile((p) => ({ ...p, elderName: settingsName.trim(), caregivers: cleanCaregivers, caregiverName: cleanCaregivers[0].name, caregiverEmail: cleanCaregivers[0].email }));
      setSettingsMsg("✅ Saved successfully!");
      toast("✅ Settings saved!", "", "t");
    } catch { setSettingsMsg("❌ Could not save. Try again."); }
    finally { setSettingsSaving(false); }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setAuthState("guest");
      setProfile(null);
      setFirebaseUser(null);
    } catch (e) { console.error("Sign out error", e); }
  };

  const missedCount    = medications.filter((m) => m.status === "missed").length;
  const takenCount     = medications.filter((m) => m.status === "taken").length;
  const pendingCount   = medications.filter((m) => m.status === "pending").length;
  const caregivers     = profile?.caregivers || (profile?.caregiverName ? [{ name: profile.caregiverName, email: profile.caregiverEmail, relation: "" }] : []);

  if (authState === "loading") return <div className="spin">🌸 Loading LYFA...</div>;
  if (authState === "guest")   return <Login />;
  if (authState === "onboarding") return (
    <Onboarding user={firebaseUser} onComplete={(p) => { setProfile(p); setLang(p.language || "en"); setAuthState("user"); }} />
  );

  return (
    <>
      <style>{FONTS}{css}</style>
      <div className="app">

        {/* NOTIFICATION BANNER */}
        {showNotifBanner && notifPermission === "default" && (
          <div className="notif-banner">
            <p>{t.notifBanner}</p>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn-allow" onClick={requestNotifPermission}>{t.allowNotifs}</button>
              <button className="btn-dismiss" onClick={() => setShowNotifBanner(false)}>{t.notNow}</button>
            </div>
          </div>
        )}
        {notifPermission === "granted" && !showNotifBanner && (
          <div className="notif-on">🔔 {t.notifsOn}</div>
        )}

        {/* SNOOZE COUNTDOWN BAR */}
        {snoozeCountdown && (
          <div className="snooze-bar">
            <div className="snooze-bar-l">
              <span>⏰</span>
              <strong>{snoozeCountdown.medName}</strong>
              <span>{t.snoozeBar}</span>
              <span className="snooze-timer">
                {Math.floor(snoozeCountdown.secondsLeft / 60)}:{String(snoozeCountdown.secondsLeft % 60).padStart(2,"0")}
              </span>
            </div>
            <button className="snooze-cancel" onClick={() => { setSnoozedMeds((s) => { const n={...s}; delete n[snoozeCountdown.medId]; return n; }); setSnoozeCountdown(null); }}>
              {t.cancelSnooze}
            </button>
          </div>
        )}

        {/* HEADER */}
        <header className="hdr">
          <div className="hdr-l">
            <div className="hdr-logo">
              <img src="/logo.png" alt="LYFA" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
            </div>
            <div className="hdr-brand">
              <h1>LYFA</h1>
              <p>{t.appTagline}</p>
            </div>
          </div>
          <div className="hdr-r">
            {/* Language switcher */}
            <select className="lang-select" value={lang} onChange={(e) => handleLangChange(e.target.value)} title={t.language}>
              {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
            </select>
            <div className="hdr-time">
              <div className="t">{fmtTime(now).slice(0,-3)}</div>
              <div className="d">{fmtDate(now)}</div>
            </div>
            <button className="hdr-user" onClick={openSettings} title="Settings">
              {firebaseUser.photoURL ? <img src={firebaseUser.photoURL} alt="" /> : "👤"}
              {profile?.elderName?.split(" ")[0]}
            </button>
          </div>
        </header>

        {/* TABS */}
        <nav className="tabs">
          {[
            { id:"medications", label: t.tabMedications, badge: pendingCount },
            { id:"sos",         label: t.tabSOS,          badge: 0 },
            { id:"dashboard",   label: t.tabDashboard,    badge: sosAlerts.length },
            { id:"settings",    label: "⚙️ Settings",      badge: 0 },
          ].map((tb) => (
            <button key={tb.id} className={`tab${tab === tb.id ? " on" : ""}`} onClick={() => tb.id === "settings" ? openSettings() : setTab(tb.id)}>
              {tb.label}{tb.badge > 0 && <span className="badge">{tb.badge}</span>}
            </button>
          ))}
        </nav>

        <main className="main">

          {/* ── MEDICATIONS ─────────────────────── */}
          {tab === "medications" && (<>
            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-b">💊</div>{t.addMedication}</div></div>
              <div className="frow">
                <div className="fg">
                  <label className="fl">{t.medicineName}</label>
                  <input className="fi" placeholder={t.medPlaceholder} value={medName} onChange={(e) => setMedName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleAddMed()} />
                </div>
                <div className="fg">
                  <label className="fl">{t.scheduledTime}</label>
                  <input type="time" className="fi" value={medTime} onChange={(e) => setMedTime(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-p btn-full" onClick={handleAddMed} disabled={adding}>
                {adding ? t.adding : t.addBtn}
              </button>
            </div>

            <div className="card">
              <div className="ch">
                <div className="ct"><div className="ci ci-g">📋</div>{t.todaySchedule}</div>
                <span style={{ fontSize:12, color:"var(--muted)", fontWeight:700 }}>{medications.length} {t.meds}</span>
              </div>
              {medications.length === 0
                ? <div className="empty"><div className="ei">💊</div>{t.noMeds}</div>
                : <div className="ml">
                    {[...medications].sort((a,b) => (a.time||"").localeCompare(b.time||"")).map((med) => (
                      <div className="mi" key={med.id}>
                        <div className={`mdot mdot-${med.status==="pending"?"p":med.status==="taken"?"t":"m"}`} />
                        <div style={{ flex:1 }}>
                          <div className="mn">{med.name}</div>
                          <div className="mt2">🕐 {med.time}{med.loggedAt?.seconds && <> · {fmt(new Date(med.loggedAt.seconds*1000))}</>}</div>
                        </div>
                        <span className={`ms ms-${med.status==="pending"?"p":med.status==="taken"?"t":"m"}`}>{t[med.status]}</span>
                        {med.status === "pending" && (
                          <div className="mac">
                            <button className="btn btn-g btn-sm" onClick={() => markMed(med.id,"taken")}>✓</button>
                            <button className="btn btn-r btn-sm" onClick={() => markMed(med.id,"missed")}>✗</button>
                          </div>
                        )}
                        {med.status !== "pending" && <button className="btn btn-r btn-sm" onClick={() => handleDelete(med.id)}>🗑</button>}
                      </div>
                    ))}
                  </div>}
            </div>
          </>)}

          {/* ── SOS ─────────────────────────────── */}
          {tab === "sos" && (
            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-r">🚨</div>{t.emergencySOS}</div></div>

              {/* Multiple caregivers list */}
              <div className="cg-list">
                {caregivers.map((cg, i) => (
                  <div className="cg-item" key={i}>
                    <div className="cg-av">{cg.name?.[0]?.toUpperCase() || "👤"}</div>
                    <div>
                      <div className="cg-n">{cg.name}</div>
                      <div className="cg-rel">{cg.relation || t.alertGoesTo} · {cg.email}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="sos-wrap">
                {sosActivated ? (
                  <div className="sos-ok">
                    <div style={{ fontSize:46, marginBottom:8 }}>📡</div>
                    <h3>{t.sosActivated}</h3>
                    <p>{t.sosActivatedSub}</p>
                    <p style={{ marginTop:8, fontSize:12, color:"var(--muted)" }}>Sent to {caregivers.length} caregiver(s) ✓</p>
                  </div>
                ) : (
                  <div className="sos-ring">
                    <div className="sos-p1"/><div className="sos-p2"/>
                    <button className="sos-btn" onClick={() => setSosModal(true)} disabled={sosSending}>
                      {sosSending ? "..." : "SOS"}
                      <span className="sos-sub">{t.sosPress}</span>
                    </button>
                  </div>
                )}
                <p className="sos-txt">{t.sosConfirmBody}</p>
                <div className="sos-grid">
                  <div className="sos-ic"><div className="n">{sosAlerts.length}</div><div className="l">{t.totalAlerts}</div></div>
                  <div className="sos-ic">
                    <div className="n" style={{ fontSize:15, paddingTop:6 }}>
                      {sosAlerts[0]?.triggeredAt?.seconds ? fmt(new Date(sosAlerts[0].triggeredAt.seconds*1000)) : "—"}
                    </div>
                    <div className="l">{t.lastAlert}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── DASHBOARD ───────────────────────── */}
          {tab === "dashboard" && (<>
            <div className="stats">
              <div className="sc sc-b"><div className="sn">{medications.length}</div><div className="sl">{t.totalMeds}</div></div>
              <div className="sc sc-g"><div className="sn">{takenCount}</div><div className="sl">{t.taken}</div></div>
              <div className="sc sc-r"><div className="sn">{missedCount}</div><div className="sl">{t.missed}</div></div>
            </div>
            <div className="card">
              <div className="ch">
                <div className="ct"><div className="ci ci-r">🚨</div>{t.emergencyAlerts}</div>
                <span style={{ fontSize:12, color:"var(--muted)", fontWeight:700 }}>{sosAlerts.length}</span>
              </div>
              {sosAlerts.length === 0
                ? <div className="empty"><div className="ei">✅</div>{t.noAlerts}</div>
                : <div className="hl">{sosAlerts.map((a) => (
                    <div className="hi" key={a.id} style={{ borderColor: a.acknowledged ? "rgba(52,201,123,.3)" : "rgba(255,90,90,.2)", background: a.acknowledged ? "var(--green-l)" : "var(--red-l)", flexWrap:"wrap", gap:8 }}>
                      <div className="hic">{a.acknowledged ? "✅" : "🚨"}</div>
                      <div style={{ flex:1 }}>
                        <div className="hin" style={{ color: a.acknowledged ? "#1a8a52" : "var(--red)" }}>
                          {a.acknowledged ? "✅ Caregiver Responded" : "🚨 Emergency SOS — Waiting for response"}
                        </div>
                        <div className="hit">
                          📅 {a.triggeredAt?.seconds ? fmtFull(new Date(a.triggeredAt.seconds*1000)) : "—"}
                          {a.acknowledged && a.acknowledgedAt?.seconds && (
                            <> · ✅ Seen {fmtFull(new Date(a.acknowledgedAt.seconds*1000))}</>
                          )}
                        </div>
                      </div>
                      <span className="hb" style={ a.acknowledged
                        ? { background:"var(--green-l)", color:"#1a8a52" }
                        : { background:"var(--red-l)", color:"var(--red)" }}>
                        {a.acknowledged ? "Responded ✓" : "Pending..."}
                      </span>
                    </div>
                  ))}</div>}
            </div>
            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-p">📋</div>{t.medHistory}</div></div>
              {medications.filter((m) => m.status !== "pending").length === 0
                ? <div className="empty"><div className="ei">📋</div>{t.noHistory}</div>
                : <div className="hl">{medications.filter((m) => m.status !== "pending").map((m) => (
                    <div className="hi" key={m.id}>
                      <div className="hic">{m.status === "taken" ? "✅" : "❌"}</div>
                      <div style={{ flex:1 }}>
                        <div className="hin">{m.name}</div>
                        <div className="hit">{t.scheduled}: {m.time} · {t.logged}: {m.loggedAt?.seconds ? fmt(new Date(m.loggedAt.seconds*1000)) : "—"}</div>
                      </div>
                      <span className="hb" style={m.status==="taken"?{background:"var(--green-l)",color:"#1a8a52"}:{background:"var(--red-l)",color:"var(--red)"}}>
                        {t[m.status]}
                      </span>
                    </div>
                  ))}</div>}
            </div>
          </>)}

          {/* ── SETTINGS ────────────────────────── */}
          {tab === "settings" && (<>
            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-b">👤</div>Your Profile</div></div>
              <div className="settings-section">
                <div className="settings-label">Your Name</div>
                <input className="fi" style={{ width:"100%", marginBottom:16 }} value={settingsName} onChange={(e) => setSettingsName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="settings-section">
                <div className="settings-label">🌍 Language</div>
                <select className="fi" style={{ width:"100%", marginBottom:0 }} value={lang} onChange={(e) => handleLangChange(e.target.value)}>
                  {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
                </select>
              </div>
            </div>

            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-g">👨‍👩‍👧</div>Caregivers</div></div>
              <p style={{ fontSize:13, color:"var(--muted)", fontWeight:600, marginBottom:14 }}>
                These people receive SOS alerts. You can add up to 5.
              </p>

              {settingsCaregivers.map((c, i) => (
                <div className="cg-edit-card" key={i}>
                  <div className="cg-edit-header">
                    <span className="cg-edit-num">👤 Caregiver {i + 1}</span>
                    {settingsCaregivers.length > 1 && (
                      <button className="cg-remove-btn" onClick={() => setSettingsCaregivers(settingsCaregivers.filter((_,idx) => idx !== i))}>✕ Remove</button>
                    )}
                  </div>
                  <input className="fi" style={{ width:"100%", marginBottom:8 }} placeholder="Name (e.g. Priya)" value={c.name} onChange={(e) => setSettingsCaregivers(settingsCaregivers.map((x,idx) => idx===i ? {...x, name:e.target.value} : x))} />
                  <input className="fi" style={{ width:"100%", marginBottom:8 }} type="email" placeholder="Email (e.g. priya@gmail.com)" value={c.email} onChange={(e) => setSettingsCaregivers(settingsCaregivers.map((x,idx) => idx===i ? {...x, email:e.target.value} : x))} />
                  <input className="fi" style={{ width:"100%", marginBottom:0 }} placeholder="Relation (e.g. Daughter, Son)" value={c.relation} onChange={(e) => setSettingsCaregivers(settingsCaregivers.map((x,idx) => idx===i ? {...x, relation:e.target.value} : x))} />
                </div>
              ))}

              {settingsCaregivers.length < 5 && (
                <button className="add-cg-btn" onClick={() => setSettingsCaregivers([...settingsCaregivers, { name:"", email:"", relation:"" }])}>
                  + Add Another Caregiver
                </button>
              )}

              {settingsMsg && (
                <div className={`settings-msg ${settingsMsg.startsWith("✅") ? "ok" : "err"}`}>{settingsMsg}</div>
              )}

              <button className="btn btn-p btn-full" onClick={saveSettings} disabled={settingsSaving}>
                {settingsSaving ? "Saving..." : "💾 Save Changes"}
              </button>
            </div>

            <div className="card">
              <div className="ch"><div className="ct"><div className="ci ci-r">🚪</div>Account</div></div>
              <p style={{ fontSize:13, color:"var(--muted)", fontWeight:600, marginBottom:14 }}>
                Signed in as <strong>{firebaseUser.email}</strong>
              </p>
              <button className="btn btn-r btn-full" onClick={handleSignOut}>
                🚪 Sign Out
              </button>
            </div>
          </>)}

        </main>

        {/* REMINDER MODAL */}
        {reminderModal && (
          <div className="mo"><div className="md">
            <div className="md-ico">⏰</div>
            <div className="md-t">{t.reminderTitle}</div>
            <div className="md-b">{t.reminderBody} <strong>{reminderModal.name}</strong><br />{t.reminderQ}</div>
            <div className="md-act">
              <button className="btn btn-g" onClick={() => markMed(reminderModal.id,"taken")}>{t.yesTaken}</button>
              <button className="btn btn-r" onClick={() => markMed(reminderModal.id,"missed")}>{t.noMissed}</button>
            </div>
            <div style={{ marginTop:16, borderTop:"1.5px solid var(--border)", paddingTop:14 }}>
              <p style={{ fontSize:12, color:"var(--muted)", fontWeight:700, textAlign:"center", marginBottom:10, textTransform:"uppercase", letterSpacing:".5px" }}>{t.snoozeLabel}</p>
              <div className="snooze-options">
                {[5,10,15,30].map((m) => (
                  <button key={m} className="btn-snooze" onClick={() => snoozeMed(reminderModal, m)}>{m} {t.snoozeMin}</button>
                ))}
              </div>
            </div>
          </div></div>
        )}

        {/* SOS CONFIRM MODAL */}
        {sosModal && (
          <div className="mo"><div className="md">
            <div className="md-ico">🚨</div>
            <div className="md-t">{t.sosConfirmTitle}</div>
            <div className="md-b">
              {t.sosConfirmBody}<br />
              {caregivers.map((c) => <span key={c.email} style={{ display:"block", fontWeight:800, color:"var(--sky-d)" }}>• {c.name} ({c.relation || "Caregiver"})</span>)}
              <br />{t.sosConfirmOnly}
            </div>
            <div className="md-act">
              <button className="btn" style={{ flex:1, justifyContent:"center", background:"linear-gradient(135deg,#ff7070,#e03030)", color:"#fff", boxShadow:"0 4px 14px rgba(255,60,60,.4)" }} onClick={confirmSOS}>{t.sendNow}</button>
              <button className="btn btn-r" onClick={() => setSosModal(false)}>{t.cancel}</button>
            </div>
          </div></div>
        )}

        {/* TOASTS */}
        <div className="toasts">
          {toasts.map((x) => (
            <div key={x.id} className={`toast toast-${x.type}`}>
              <div><div className="toast-title">{x.title}</div><div className="toast-msg">{x.msg}</div></div>
            </div>
          ))}
        </div>

      </div>
    </>
  );
}
