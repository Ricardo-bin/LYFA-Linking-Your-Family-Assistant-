// ============================================================
//  LYFA – RespondPage.jsx
//  Caregiver clicks link in email → this page opens
//  → auto-acknowledges the SOS alert in Firestore
//  → dashboard turns green instantly
// ============================================================

import { useEffect, useState } from "react";
import { acknowledgeSOSAlert, getSOSAlert, getUserProfile } from "../firebase/db";

export default function RespondPage({ uid, alertId }) {
  const [status, setStatus] = useState("loading"); // loading | success | already | error
  const [elderName, setElderName] = useState("");
  const [alertTime, setAlertTime] = useState("");

  useEffect(() => {
    async function acknowledge() {
      try {
        const [alert, profile] = await Promise.all([
          getSOSAlert(uid, alertId),
          getUserProfile(uid),
        ]);

        if (!alert) { setStatus("error"); return; }

        setElderName(profile?.elderName || "Your family member");
        if (alert.triggeredAt?.seconds) {
          setAlertTime(new Date(alert.triggeredAt.seconds * 1000).toLocaleString("en-IN", {
            dateStyle: "medium", timeStyle: "short",
          }));
        }

        if (alert.acknowledged) {
          setStatus("already");
          return;
        }

        await acknowledgeSOSAlert(uid, alertId, "Caregiver");
        setStatus("success");
      } catch (e) {
        console.error(e);
        setStatus("error");
      }
    }
    acknowledge();
  }, [uid, alertId]);

  const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=swap');`;

  return (
    <>
      <style>{FONTS}{`
        * { box-sizing:border-box; margin:0; padding:0; }
        body { font-family:'Nunito',sans-serif; background:linear-gradient(160deg,#e8f3ff,#f0f4f8,#e6f9f0); min-height:100vh; display:flex; align-items:center; justify-content:center; padding:20px; }
        .card { background:#fff; border-radius:24px; padding:40px 32px; max-width:420px; width:100%; box-shadow:0 8px 40px rgba(0,0,0,.12); text-align:center; }
        .icon { font-size:72px; margin-bottom:16px; }
        h1 { font-size:24px; font-weight:900; margin-bottom:10px; }
        p { font-size:15px; color:#64748b; line-height:1.6; margin-bottom:8px; }
        .info { background:#e6f9f0; border-radius:14px; padding:16px; margin:20px 0; border:1.5px solid rgba(52,201,123,.2); }
        .info strong { color:#1a8a52; font-size:16px; }
        .info small { color:#64748b; font-size:13px; }
        .btn { display:inline-block; margin-top:20px; padding:13px 28px; background:linear-gradient(135deg,#34c97b,#27ae74); color:#fff; border-radius:14px; font-family:'Nunito',sans-serif; font-size:15px; font-weight:800; text-decoration:none; box-shadow:0 4px 14px rgba(52,201,123,.35); }
        .spin { animation: spin 1s linear infinite; display:inline-block; font-size:48px; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      `}</style>
      <div className="card">

        {status === "loading" && <>
          <div className="spin">🌸</div>
          <h1 style={{ color:"#1e293b", marginTop:16 }}>Confirming...</h1>
          <p>Please wait a moment.</p>
        </>}

        {status === "success" && <>
          <div className="icon">✅</div>
          <h1 style={{ color:"#1a8a52" }}>Response Confirmed!</h1>
          <p>The elder's dashboard has been updated to show you are on your way.</p>
          <div className="info">
            <div><strong>👤 {elderName}</strong></div>
            {alertTime && <div><small>🕐 Alert at {alertTime}</small></div>}
          </div>
          <p style={{ fontWeight:700, color:"#1a8a52" }}>Thank you for responding quickly! 💚</p>
          <a className="btn" href="/">← Open LYFA App</a>
        </>}

        {status === "already" && <>
          <div className="icon">✅</div>
          <h1 style={{ color:"#1a8a52" }}>Already Responded</h1>
          <p>This SOS alert has already been acknowledged.</p>
          <div className="info">
            <div><strong>👤 {elderName}</strong></div>
            {alertTime && <div><small>🕐 Alert at {alertTime}</small></div>}
          </div>
          <a className="btn" href="/">← Open LYFA App</a>
        </>}

        {status === "error" && <>
          <div className="icon">❌</div>
          <h1 style={{ color:"#ff5a5a" }}>Link Not Found</h1>
          <p>This response link may be invalid or expired.</p>
          <a className="btn" style={{ background:"linear-gradient(135deg,#4a9eff,#1a6fd4)" }} href="/">← Open LYFA App</a>
        </>}

      </div>
    </>
  );
}
