// ============================================================
//  LYFA – Onboarding (Multiple Caregivers + Language Picker)
// ============================================================

import { useState } from "react";
import { saveUserProfile } from "../firebase/db";
import { LANGUAGES, T } from "../i18n";

export default function Onboarding({ user, onComplete }) {
  const [step, setStep]             = useState(0); // 0=language 1=name 2=caregivers
  const [lang, setLang]             = useState("en");
  const [elderName, setElderName]   = useState(user?.displayName || "");
  const [caregivers, setCaregivers] = useState([{ name: "", email: "", relation: "" }]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");

  const t = T[lang];

  const addCaregiver    = () => { if (caregivers.length < 5) setCaregivers([...caregivers, { name: "", email: "", relation: "" }]); };
  const removeCaregiver = (i) => { if (caregivers.length > 1) setCaregivers(caregivers.filter((_, idx) => idx !== i)); };
  const updateCaregiver = (i, field, val) => setCaregivers(caregivers.map((c, idx) => idx === i ? { ...c, [field]: val } : c));

  const handleFinish = async () => {
    if (!elderName.trim()) return setError(t.nameRequired);
    const filled = caregivers.filter((c) => c.name.trim() || c.email.trim());
    if (filled.length === 0) return setError(t.caregiverRequired);
    for (const c of filled) {
      if (!c.email.includes("@")) return setError(`${t.invalidEmail} ${c.name || "caregiver"}.`);
    }
    setLoading(true); setError("");
    try {
      const cleanCaregivers = filled.map((c) => ({ name: c.name.trim(), email: c.email.trim().toLowerCase(), relation: c.relation.trim() }));
      await saveUserProfile(user.uid, {
        elderName:      elderName.trim(),
        caregivers:     cleanCaregivers,
        caregiverName:  cleanCaregivers[0].name,
        caregiverEmail: cleanCaregivers[0].email,
        language:       lang,
        photoURL:       user.photoURL || null,
        email:          user.email,
        onboardingDone: true,
      });
      onComplete({ elderName: elderName.trim(), caregivers: cleanCaregivers, caregiverName: cleanCaregivers[0].name, caregiverEmail: cleanCaregivers[0].email, language: lang });
    } catch (e) { setError("Something went wrong. Try again."); }
    finally { setLoading(false); }
  };

  return (
    <div style={s.overlay}>
      <div style={s.card}>
        <div style={s.dots}>
          {[0,1,2].map((n) => <div key={n} style={{ ...s.dot, background: step >= n ? "#4a9eff" : "#e2e8f0" }} />)}
        </div>

        {/* STEP 0 — Language */}
        {step === 0 && <>
          <div style={s.icon}>🌍</div>
          <h2 style={s.title}>Choose Your Language</h2>
          <p style={s.sub}>Select the language you're most comfortable with.</p>
          <div style={s.langGrid}>
            {LANGUAGES.map((l) => (
              <button key={l.code} style={{ ...s.langBtn, border: lang === l.code ? "2.5px solid #4a9eff" : "2px solid #e2e8f0", background: lang === l.code ? "#e8f3ff" : "#fafbfc", color: lang === l.code ? "#1a6fd4" : "#1e293b" }} onClick={() => setLang(l.code)}>
                <span style={{ fontSize: 26 }}>{l.flag}</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{l.label}</span>
              </button>
            ))}
          </div>
          <button style={s.btn} onClick={() => setStep(1)}>Continue →</button>
        </>}

        {/* STEP 1 — Name */}
        {step === 1 && <>
          <div style={s.icon}>👋</div>
          <h2 style={s.title}>{t.welcomeStep1}</h2>
          <p style={s.sub}>{t.welcomeSub1}</p>
          <label style={s.label}>{t.yourName}</label>
          <input style={s.input} placeholder={t.namePlaceholder} value={elderName} onChange={(e) => setElderName(e.target.value)} autoFocus />
          {error && <p style={s.error}>{error}</p>}
          <div style={{ display:"flex", gap:10 }}>
            <button style={s.btnSec} onClick={() => setStep(0)}>{t.back}</button>
            <button style={s.btn} onClick={() => { if (!elderName.trim()) return setError(t.nameRequired); setError(""); setStep(2); }}>{t.continueBtn}</button>
          </div>
        </>}

        {/* STEP 2 — Caregivers */}
        {step === 2 && <>
          <div style={s.icon}>👨‍👩‍👧</div>
          <h2 style={s.title}>{t.addCaregivers}</h2>
          <p style={s.sub}>{t.caregiverSub}</p>
          <div style={{ display:"flex", flexDirection:"column", gap:12, maxHeight:320, overflowY:"auto", paddingRight:2 }}>
            {caregivers.map((c, i) => (
              <div key={i} style={s.cgCard}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                  <span style={{ fontSize:13, fontWeight:800, color:"#4a9eff" }}>👤 Caregiver {i+1}</span>
                  {caregivers.length > 1 && <button style={s.removeBtn} onClick={() => removeCaregiver(i)}>✕ Remove</button>}
                </div>
                <input style={s.input} placeholder={t.caregiverName} value={c.name} onChange={(e) => updateCaregiver(i,"name",e.target.value)} />
                <input style={s.input} type="email" placeholder={t.caregiverEmail} value={c.email} onChange={(e) => updateCaregiver(i,"email",e.target.value)} />
                <input style={{ ...s.input, marginBottom:0 }} placeholder={t.caregiverRelation} value={c.relation} onChange={(e) => updateCaregiver(i,"relation",e.target.value)} />
              </div>
            ))}
          </div>
          {caregivers.length < 5 && <button style={s.addMoreBtn} onClick={addCaregiver}>{t.addAnother}</button>}
          {error && <p style={s.error}>{error}</p>}
          <div style={{ display:"flex", gap:10, marginTop:8 }}>
            <button style={s.btnSec} onClick={() => setStep(1)}>{t.back}</button>
            <button style={s.btn} onClick={handleFinish} disabled={loading}>{loading ? t.saving : t.finishSetup}</button>
          </div>
        </>}

        <p style={s.privacy}>{t.privacy}</p>
      </div>
    </div>
  );
}

const s = {
  overlay: { position:"fixed", inset:0, background:"linear-gradient(160deg,#e8f3ff,#f0f4f8,#e6f9f0)", display:"flex", alignItems:"center", justifyContent:"center", padding:20, fontFamily:"'Nunito',sans-serif" },
  card: { background:"#fff", borderRadius:24, padding:"30px 26px", maxWidth:460, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.12)", display:"flex", flexDirection:"column" },
  dots: { display:"flex", gap:8, marginBottom:20 },
  dot: { width:26, height:6, borderRadius:3, transition:"background .3s" },
  icon: { fontSize:46, marginBottom:10 },
  title: { fontSize:21, fontWeight:900, color:"#1e293b", marginBottom:6 },
  sub: { fontSize:14, color:"#64748b", marginBottom:16, lineHeight:1.5 },
  label: { fontSize:12, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".5px", marginBottom:5 },
  input: { padding:"11px 14px", border:"2px solid #e2e8f0", borderRadius:11, fontFamily:"'Nunito',sans-serif", fontSize:15, color:"#1e293b", outline:"none", marginBottom:8, width:"100%", boxSizing:"border-box" },
  btn: { flex:1, padding:"12px 18px", background:"linear-gradient(135deg,#4a9eff,#1a6fd4)", color:"#fff", border:"none", borderRadius:12, fontSize:15, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginTop:4 },
  btnSec: { padding:"12px 14px", background:"#f0f4f8", color:"#64748b", border:"2px solid #e2e8f0", borderRadius:12, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", marginTop:4 },
  addMoreBtn: { marginTop:10, padding:"9px 16px", background:"#e8f3ff", color:"#1a6fd4", border:"2px dashed #4a9eff", borderRadius:11, fontSize:14, fontWeight:800, cursor:"pointer", fontFamily:"'Nunito',sans-serif", width:"100%" },
  cgCard: { background:"#fafbfc", border:"1.5px solid #e2e8f0", borderRadius:14, padding:"14px 14px 6px" },
  removeBtn: { fontSize:12, fontWeight:800, color:"#ff5a5a", background:"#fff0f0", border:"1.5px solid rgba(255,90,90,.2)", borderRadius:8, padding:"3px 10px", cursor:"pointer", fontFamily:"'Nunito',sans-serif" },
  langGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 },
  langBtn: { display:"flex", flexDirection:"column", alignItems:"center", gap:6, padding:"14px 10px", borderRadius:12, cursor:"pointer", transition:"all .2s", fontFamily:"'Nunito',sans-serif" },
  error: { color:"#ff5a5a", fontSize:13, fontWeight:700, margin:"6px 0" },
  privacy: { fontSize:12, color:"#94a3b8", textAlign:"center", marginTop:16 },
};
