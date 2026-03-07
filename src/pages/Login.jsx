// ============================================================
//  LYFA – Login Page
//  Google Sign-In via Firebase Auth
// ============================================================

import { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged in App.jsx will handle redirect
    } catch (e) {
      setError("Sign-in failed. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card}>
        {/* Logo */}
        <div style={s.logoWrap}>
          <div style={s.logoIcon}>🌸</div>
          <h1 style={s.logoText}>LYFA</h1>
        </div>
        <p style={s.tagline}>Your Wellness Companion</p>

        <div style={s.divider} />

        <h2 style={s.title}>Welcome Back</h2>
        <p style={s.sub}>Sign in to access your medication reminders and emergency features.</p>

        {error && <div style={s.errorBox}>{error}</div>}

        <button style={s.googleBtn} onClick={handleGoogleLogin} disabled={loading}>
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          {loading ? "Signing in..." : "Continue with Google"}
        </button>

        <div style={s.features}>
          {["💊 Medication Reminders", "🚨 Emergency SOS", "📊 Caregiver Dashboard"].map((f) => (
            <div key={f} style={s.featureItem}>{f}</div>
          ))}
        </div>

        <p style={s.footer}>🔒 Secure login powered by Google. We never store your password.</p>
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(160deg,#e8f3ff 0%,#f0f4f8 50%,#e6f9f0 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: 20, fontFamily: "'Nunito',sans-serif",
  },
  card: {
    background: "#fff", borderRadius: 28, padding: "40px 36px",
    maxWidth: 420, width: "100%",
    boxShadow: "0 8px 48px rgba(74,158,255,0.15)",
    textAlign: "center",
  },
  logoWrap: { display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 6 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16, fontSize: 28,
    background: "linear-gradient(135deg,#4a9eff,#1a6fd4)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 4px 16px rgba(74,158,255,0.4)",
  },
  logoText: { fontSize: 34, fontWeight: 900, color: "#1e293b", letterSpacing: -1 },
  tagline: { fontSize: 14, color: "#64748b", fontWeight: 600, marginBottom: 28 },
  divider: { height: 1, background: "#e2e8f0", marginBottom: 24 },
  title: { fontSize: 22, fontWeight: 900, color: "#1e293b", marginBottom: 8 },
  sub: { fontSize: 15, color: "#64748b", marginBottom: 24, lineHeight: 1.5 },
  errorBox: {
    background: "#fff0f0", border: "1.5px solid rgba(255,90,90,0.3)",
    borderRadius: 10, padding: "10px 16px", color: "#ff5a5a",
    fontSize: 14, fontWeight: 700, marginBottom: 16,
  },
  googleBtn: {
    width: "100%", padding: "14px 20px", borderRadius: 14,
    border: "2px solid #e2e8f0", background: "#fff",
    fontSize: 16, fontWeight: 800, cursor: "pointer",
    fontFamily: "'Nunito',sans-serif", color: "#1e293b",
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    transition: "all 0.2s", boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  features: { display: "flex", flexDirection: "column", gap: 8, margin: "24px 0 0" },
  featureItem: {
    padding: "10px 16px", background: "#f8fafc", borderRadius: 10,
    fontSize: 14, fontWeight: 700, color: "#475569",
    border: "1.5px solid #e2e8f0", textAlign: "left",
  },
  footer: { fontSize: 12, color: "#94a3b8", marginTop: 24 },
};
