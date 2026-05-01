import { useState } from "react";

const SA = `'Segoe UI','Helvetica Neue',Arial,sans-serif`;
const MO = `'Consolas','Courier New',monospace`;

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("nurse");
  const [or, setOr] = useState("OR-1");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const VALID_PASSWORD = "orking@Tracki";

  const DEMO_USERS = {
    "surgeon@trackimed.com": { name: "Dr. Y. Shapira", role: "surgeon" },
    "nurse@trackimed.com": { name: "N. Cohen RN", role: "nurse" },
    "tech@trackimed.com": { name: "S. Mizrahi ST", role: "tech" },
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate auth delay
    await new Promise((r) => setTimeout(r, 800));

    const emailLower = email.toLowerCase().trim();

    if (!emailLower || !password) {
      setError("Please enter email and password");
      setLoading(false);
      return;
    }

    if (!emailLower.endsWith("@trackimed.com")) {
      setError("Access restricted to @trackimed.com accounts");
      setLoading(false);
      return;
    }

    if (password !== VALID_PASSWORD) {
      setError("Invalid password");
      setLoading(false);
      return;
    }

    const demo = DEMO_USERS[emailLower];
    const name = demo ? demo.name : emailLower.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    const userRole = demo ? demo.role : role;
    onLogin({ email: emailLower, name, role: userRole, or });
  };

  const handleDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(VALID_PASSWORD);
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden", fontFamily: SA,
    }}>
      {/* Background: OR surgery scene */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 0,
        backgroundImage: "url('/assets/medical-team-bg.jpg')",
        backgroundSize: "cover", backgroundPosition: "center",
        filter: "brightness(0.3) saturate(0.7)",
      }} />

      {/* Animated gradient overlay */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        background: "linear-gradient(135deg, rgba(0,171,142,0.2) 0%, rgba(10,15,20,0.88) 40%, rgba(10,15,20,0.93) 60%, rgba(0,106,88,0.1) 100%)",
      }} />

      {/* Login Card */}
      <div style={{
        position: "relative", zIndex: 10, width: 420, maxWidth: "90vw",
        background: "#fff",
        borderRadius: 4, border: "1px solid #ccc",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        padding: "32px 36px 28px",
      }}>
        {/* Top accent bar */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "#00AB8E" }} />

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img
            src="/assets/trackimed-logo.png"
            alt="TrackiMed"
            style={{ height: 40, marginBottom: 12 }}
            onError={(e) => { e.target.style.display = "none"; }}
          />
          <div style={{ fontSize: 22, fontWeight: 700, color: "#1a1a1a" }}>
            Tracki<span style={{ color: "#00AB8E" }}>©</span>
          </div>
          <div style={{ fontSize: 11, fontFamily: MO, color: "#888", marginTop: 4, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Operating Room Dashboard
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.name@hospital.org"
              style={{
                width: "100%", padding: "10px 12px", background: "#fff",
                border: "1px solid #ccc", borderRadius: 3, color: "#1a1a1a",
                fontSize: 14, fontFamily: SA, outline: "none",
              }}
              onFocus={(e) => e.target.style.borderColor = "#00AB8E"}
              onBlur={(e) => e.target.style.borderColor = "#ccc"}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={{
                  width: "100%", padding: "10px 40px 10px 12px", background: "#fff",
                  border: "1px solid #ccc", borderRadius: 3, color: "#1a1a1a",
                  fontSize: 14, fontFamily: SA, outline: "none",
                }}
                onFocus={(e) => e.target.style.borderColor = "#00AB8E"}
                onBlur={(e) => e.target.style.borderColor = "#ccc"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                style={{
                  position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer",
                  padding: 4, color: "#666", fontSize: 16, lineHeight: 1,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Role + OR Selection */}
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", background: "#fff",
                  border: "1px solid #ccc", borderRadius: 3, color: "#1a1a1a",
                  fontSize: 13, fontFamily: SA, outline: "none", cursor: "pointer",
                }}
              >
                <option value="surgeon">Surgeon</option>
                <option value="nurse">Circulating Nurse</option>
                <option value="tech">Scrub Tech</option>
                <option value="anesthesia">Anesthesiologist</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#444", display: "block", marginBottom: 4 }}>OR Room</label>
              <select
                value={or}
                onChange={(e) => setOr(e.target.value)}
                style={{
                  width: "100%", padding: "8px 10px", background: "#fff",
                  border: "1px solid #ccc", borderRadius: 3, color: "#1a1a1a",
                  fontSize: 13, fontFamily: SA, outline: "none", cursor: "pointer",
                }}
              >
                <option value="OR-1">OR-1 (Sheba)</option>
                <option value="OR-2">OR-2 (Sheba)</option>
                <option value="OR-3">OR-3 (Sheba)</option>
                <option value="OR-Demo">OR-Demo</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              padding: "8px 12px", borderRadius: 2, marginBottom: 12,
              background: "#fff0f0", border: "1px solid #cc3333",
              color: "#cc3333", fontSize: 12,
            }}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%", padding: "12px", borderRadius: 3, border: "none",
              background: loading ? "#999" : "#00AB8E",
              color: "#fff", fontSize: 14, fontWeight: 700, fontFamily: SA,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading ? "Connecting to OR..." : "Enter Operating Room"}
          </button>
        </form>

        {/* Demo Quick Access */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #ccc" }}>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8, textAlign: "center" }}>
            Demo Quick Access
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {[
              { label: "Surgeon", email: "surgeon@trackimed.com", color: "#00AB8E" },
              { label: "Nurse", email: "nurse@trackimed.com", color: "#006A58" },
              { label: "Tech", email: "tech@trackimed.com", color: "#f59e0b" },
            ].map((d) => (
              <button
                key={d.email}
                onClick={() => handleDemo(d.email)}
                style={{
                  flex: 1, padding: "8px 6px", borderRadius: 3, border: `1px solid #ccc`,
                  background: "#f5f5f5", color: "#444", fontSize: 12, fontWeight: 600,
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { e.target.style.background = "#e8e8e8"; }}
                onMouseLeave={(e) => { e.target.style.background = "#f5f5f5"; }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 16, fontSize: 10, color: "#aaa" }}>
          TrackiMed Inc. · HIPAA Compliant · AES-256 Encrypted
        </div>
      </div>

      {/* Bottom status bar */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
        padding: "6px 20px", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "#f0f0f0", borderTop: "1px solid #ccc",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2e8b57" }} />
          <span style={{ fontSize: 11, color: "#666" }}>System Online</span>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {[
            { label: "Cameras", v: "4/4" },
            { label: "Cloud", v: "Connected" },
            { label: "AI", v: "Ready" },
          ].map((s) => (
            <span key={s.label} style={{ fontSize: 10, fontFamily: MO, color: "#888" }}>
              {s.label}: <span style={{ color: "#444", fontWeight: 600 }}>{s.v}</span>
            </span>
          ))}
        </div>
        <span style={{ fontSize: 10, fontFamily: MO, color: "#aaa" }}>v1.0.4</span>
      </div>
    </div>
  );
}
