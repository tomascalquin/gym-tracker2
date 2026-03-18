import { useState } from "react";
import { registerWithEmail, loginWithEmail, loginWithGoogle, resetPassword } from "../utils/auth";

/**
 * Pantalla de autenticación.
 * Maneja login con email/password y Google.
 * Al autenticarse exitosamente, Firebase dispara onAuthChange en App.jsx.
 */
export default function AuthScreen() {
  const [mode, setMode]       = useState("login"); // "login" | "register"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  function clearError() { setError(""); }

  function parseFirebaseError(code) {
    const map = {
      "auth/email-already-in-use":    "Ese email ya está registrado.",
      "auth/invalid-email":           "Email inválido.",
      "auth/weak-password":           "La contraseña debe tener al menos 6 caracteres.",
      "auth/user-not-found":          "No existe una cuenta con ese email.",
      "auth/wrong-password":          "Contraseña incorrecta.",
      "auth/invalid-credential":      "Email o contraseña incorrectos.",
      "auth/popup-closed-by-user":    "Cerraste el popup de Google.",
      "auth/cancelled-popup-request": "",
    };
    return map[code] || "Ocurrió un error. Intenta de nuevo.";
  }

  async function handleSubmit() {
    setError("");
    if (!email || !password) { setError("Completa todos los campos."); return; }
    if (mode === "register" && !name.trim()) { setError("Ingresa tu nombre."); return; }
    setLoading(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email, password, name.trim());
      } else {
        await loginWithEmail(email, password);
      }
    } catch (err) {
      setError(parseFirebaseError(err.code));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      // Si loginWithGoogle retorna null es porque hizo redirect (móvil)
      // la app se recarga sola, no hay que hacer nada más
      if (!user) setRedirecting(true);
    } catch (err) {
      setError(parseFirebaseError(err.code));
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!email) { setError("Ingresa tu email primero."); return; }
    setLoading(true);
    try {
      await resetPassword(email);
      setResetSent(true);
      setError("");
    } catch {
      setError("No se pudo enviar el correo. Verifica el email.");
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === "Enter") handleSubmit();
  }

  const inputStyle = {
    width: "100%", background: "#0e0e1a", border: "1px solid #1a1a2a",
    color: "#f1f5f9", padding: "12px 14px", borderRadius: 8,
    fontSize: 14, fontFamily: "inherit", outline: "none",
    marginBottom: 10,
  };

  if (redirecting) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
        background: "#080810", color: "#475569", fontFamily: "DM Mono, monospace",
      }}>
        <div style={{ fontSize: 24, animation: "blink 1.4s infinite" }}>◆</div>
        <div style={{ fontSize: 13, letterSpacing: 3 }}>REDIRIGIENDO A GOOGLE</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#080810",
      fontFamily: "DM Mono, monospace", padding: "20px",
    }}>
      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* Logo / título */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: 4, color: "#334155", marginBottom: 8 }}>
            HYPERTROPHY TRACKER
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
            <span style={{ fontSize: 32, fontWeight: 400, letterSpacing: -1, color: "#f8fafc" }}>
              Gym
            </span>
            <span style={{ color: "#60a5fa", fontSize: 32, animation: "blink 1.4s infinite" }}>_</span>
          </div>
          <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>
            {mode === "login" ? "Inicia sesión para continuar" : "Crea tu cuenta"}
          </div>
        </div>

        {/* Tabs login / registro */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 24 }}>
          {["login", "register"].map((m) => (
            <button key={m} onClick={() => { setMode(m); clearError(); }} style={{
              background: mode === m ? "#1a1a2e" : "transparent",
              border: `1px solid ${mode === m ? "#60a5fa44" : "#1a1a2a"}`,
              color: mode === m ? "#60a5fa" : "#475569",
              padding: "10px", borderRadius: 8, cursor: "pointer",
              fontSize: 11, letterSpacing: 2, fontFamily: "inherit",
            }}>
              {m === "login" ? "INGRESAR" : "REGISTRARSE"}
            </button>
          ))}
        </div>

        {/* Formulario */}
        <div>
          {mode === "register" && (
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); clearError(); }}
              onKeyDown={handleKey}
              placeholder="Nombre"
              style={inputStyle}
              autoComplete="name"
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); clearError(); }}
            onKeyDown={handleKey}
            placeholder="Email"
            style={inputStyle}
            autoComplete="email"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            onKeyDown={handleKey}
            placeholder="Contraseña"
            style={{ ...inputStyle, marginBottom: 0 }}
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />

          {error && (
            <div style={{ fontSize: 12, color: "#ef4444", marginTop: 8, minHeight: 18 }}>
              {error}
            </div>
          )}

          {resetSent && (
            <div style={{ fontSize: 12, color: "#22c55e", marginTop: 8 }}>
              ✓ Revisa tu email para restablecer la contraseña.
            </div>
          )}

          {mode === "login" && !resetSent && (
            <button onClick={handleReset} className="nbtn" style={{
              fontSize: 11, color: "#475569", marginTop: 6,
              textDecoration: "underline", cursor: "pointer",
            }}>
              ¿Olvidaste tu contraseña?
            </button>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%", padding: "13px", background: loading ? "#1e3a5f" : "#60a5fa",
              border: "none", borderRadius: 10, color: "#000",
              fontWeight: 700, fontSize: 13, letterSpacing: 2,
              cursor: loading ? "default" : "pointer",
              fontFamily: "inherit", marginTop: 14,
              opacity: loading ? 0.7 : 1, transition: "opacity 0.2s",
            }}
          >
            {loading ? "..." : mode === "login" ? "INGRESAR" : "CREAR CUENTA"}
          </button>
        </div>

        {/* Separador */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "#1a1a2a" }} />
          <span style={{ fontSize: 11, color: "#334155", letterSpacing: 1 }}>O</span>
          <div style={{ flex: 1, height: 1, background: "#1a1a2a" }} />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          disabled={loading}
          style={{
            width: "100%", padding: "12px",
            background: "#0e0e1a", border: "1px solid #1a1a2a",
            color: "#f1f5f9", borderRadius: 10, cursor: loading ? "default" : "pointer",
            fontSize: 13, fontFamily: "inherit", display: "flex",
            alignItems: "center", justifyContent: "center", gap: 10,
            opacity: loading ? 0.6 : 1,
          }}
        >
          {/* Google icon SVG */}
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Continuar con Google
        </button>

      </div>
    </div>
  );
}
