import { useState } from "react";
import { tokens } from "../design";

// ─── Fórmulas 1RM ──────────────────────────────────────────────────────────
const ONE_RM_FORMULAS = {
  Epley:      (w, r) => w * (1 + r / 30),
  Brzycki:    (w, r) => w * (36 / (37 - r)),
  Lander:     (w, r) => (100 * w) / (101.3 - 2.67123 * r),
  Lombardi:   (w, r) => w * Math.pow(r, 0.1),
  "O'Conner": (w, r) => w * (1 + r / 40),
};

// ─── IPF GL Points (fórmula 2019) ──────────────────────────────────────────
const IPF_GL_COEFF = {
  M: { a: 1236.25115, b: 1449.21864, c: 0.01644 },
  F: { a: 758.63878,  b: 949.31382,  c: 0.02435 },
};

function calcIPFGL(total, bw, sex) {
  const { a, b, c } = IPF_GL_COEFF[sex];
  const denom = a - b * Math.exp(-c * bw);
  if (denom <= 0) return 0;
  return Math.max(0, (100 / denom) * total);
}

// ─── Wilks2 (coeficiente 2020) ─────────────────────────────────────────────
const WILKS2_COEFF = {
  M: [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8],
  F: [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8],
};

function calcWilks2(total, bw, sex) {
  const c = WILKS2_COEFF[sex];
  const denom = c[0] + c[1]*bw + c[2]*bw**2 + c[3]*bw**3 + c[4]*bw**4 + c[5]*bw**5;
  if (denom <= 0) return 0;
  return Math.max(0, (600 / denom) * total);
}

// ─── RPE / RIR data ─────────────────────────────────────────────────────────
const RPE_RIR_TABLE = [
  { rpe: 10,  rir: 0, desc: "Máximo absoluto, fallo total" },
  { rpe: 9.5, rir: 0, desc: "Casi fallo, podría haber 1 con duda" },
  { rpe: 9,   rir: 1, desc: "Deja 1 rep en el tanque" },
  { rpe: 8.5, rir: 1, desc: "Entre 1 y 2 reps en reserva" },
  { rpe: 8,   rir: 2, desc: "Deja 2 reps en el tanque" },
  { rpe: 7.5, rir: 2, desc: "Entre 2 y 3 reps en reserva" },
  { rpe: 7,   rir: 3, desc: "Deja 3 reps en el tanque" },
  { rpe: 6,   rir: 4, desc: "Esfuerzo moderado, 4+ reps de reserva" },
  { rpe: 5,   rir: 5, desc: "Esfuerzo leve, muy fácil" },
];

// % de 1RM por reps a dado RPE (tabla de Helms simplificada)
const RPE_PERCENT_TABLE = {
  10:  [100, 95, 93, 91, 89, 87, 85, 83, 82, 80],
  9.5: [98,  93, 91, 89, 87, 85, 83, 82, 80, 78],
  9:   [96,  92, 90, 88, 86, 84, 82, 80, 78, 76],
  8.5: [94,  90, 88, 86, 84, 82, 80, 78, 76, 74],
  8:   [92,  88, 86, 84, 82, 80, 78, 76, 74, 72],
  7.5: [90,  86, 84, 82, 80, 78, 76, 74, 72, 70],
  7:   [88,  84, 82, 80, 78, 76, 74, 72, 70, 68],
};

// ─── Main ───────────────────────────────────────────────────────────────────
export default function ToolsView({ onBack }) {
  const [tab, setTab] = useState("weight");

  const TABS = [
    { key: "weight", label: "⚖️ Peso" },
    { key: "orm",    label: "💪 1RM" },
    { key: "points", label: "🏆 Wilks/IPF" },
    { key: "rpe",    label: "🎯 RPE/RIR" },
  ];

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* ── Header ── */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ fontSize: 22, color: "rgba(240,240,240,0.30)", padding: "0 4px 0 0" }}>‹</button>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>GYM TRACKER</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text)", letterSpacing: -1, lineHeight: 1.1 }}>HERRAMIENTAS</div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid var(--glass-border)", borderBottom: "1px solid var(--glass-border)", padding: "10px 0", marginBottom: 16, display: "flex", gap: 4, overflowX: "auto" }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "7px 14px", borderRadius: 99, flexShrink: 0,
              background: tab === t.key ? "rgba(255,255,255,0.90)" : "transparent",
              border: `1px solid ${tab === t.key ? "var(--text)" : "var(--border)"}`,
              color: tab === t.key ? "#080810" : "var(--text2)",
              fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
              cursor: "pointer", fontFamily: "inherit",
              WebkitTapHighlightColor: "transparent",
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "0 20px 120px" }}>
        {tab === "weight" && <WeightConverter />}
        {tab === "orm"    && <OneRMCalc />}
        {tab === "points" && <StrengthPoints />}
        {tab === "rpe"    && <RPERIRTool />}
      </div>
    </div>
  );
}

// ─── Conversor de Peso ────────────────────────────────────────────────────────
function WeightConverter() {
  const [kg, setKg] = useState("");
  const [lb, setLb] = useState("");

  function handleKg(v) {
    setKg(v);
    setLb(v !== "" && !isNaN(v) ? (parseFloat(v) * 2.20462).toFixed(2) : "");
  }
  function handleLb(v) {
    setLb(v);
    setKg(v !== "" && !isNaN(v) ? (parseFloat(v) / 2.20462).toFixed(2) : "");
  }

  return (
    <div>
      <SectionLabel>CONVERSOR KG ↔ LB</SectionLabel>
      <Card>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", marginBottom: 16 }}>
          <ToolInput label="Kilogramos" value={kg} onChange={handleKg} />
          <div style={{ color: "rgba(240,240,240,0.30)", fontSize: 20, paddingBottom: 10, flexShrink: 0 }}>⇌</div>
          <ToolInput label="Libras" value={lb} onChange={handleLb} />
        </div>
        <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 8 }}>PESOS RÁPIDOS</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[20, 40, 45, 60, 80, 100, 120, 140].map(p => (
            <button key={p} onClick={() => handleKg(String(p))} style={{
              padding: "5px 10px", borderRadius: 8,
              background: "rgba(255,255,255,0.07)", border: "1px solid var(--glass-border)",
              fontSize: 12, color: "rgba(240,240,240,0.55)", cursor: "pointer",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}>{p} kg</button>
          ))}
        </div>
      </Card>

      <SectionLabel style={{ marginTop: 20 }}>REFERENCIA DE PLATOS</SectionLabel>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <Th>Plato</Th><Th>kg</Th><Th>lb</Th>
            </tr>
          </thead>
          <tbody>
            {[
              ["25 kg — Rojo",     25,   55.1],
              ["20 kg — Azul",     20,   44.1],
              ["15 kg — Amarillo", 15,   33.1],
              ["10 kg — Verde",    10,   22.0],
              ["5 kg — Blanco",     5,   11.0],
              ["2.5 kg — Negro",    2.5,  5.5],
              ["Barra olímpica",   20,   44.1],
            ].map(([name, k, l]) => (
              <tr key={name} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                <Td style={{ color: "rgba(240,240,240,0.55)" }}>{name}</Td>
                <Td className="mono" style={{ fontWeight: 700 }}>{k}</Td>
                <Td className="mono" style={{ color: "rgba(240,240,240,0.30)" }}>{l}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── Calculadora 1RM ─────────────────────────────────────────────────────────
function OneRMCalc() {
  const [weight, setWeight]   = useState("");
  const [reps, setReps]       = useState("");
  const [unit, setUnit]       = useState("kg");
  const [formula, setFormula] = useState("Epley");

  const w = parseFloat(weight) || 0;
  const r = parseInt(reps) || 0;
  const valid = w > 0 && r >= 1 && r <= 30;
  const wKg = unit === "lb" ? w / 2.20462 : w;
  const orm = valid ? ONE_RM_FORMULAS[formula](wKg, r) : null;
  const ormDisplay = orm ? (unit === "lb" ? orm * 2.20462 : orm) : null;

  const percentages = ormDisplay
    ? [100, 95, 90, 85, 80, 75, 70, 65, 60].map(pct => ({
        pct,
        weight: ormDisplay * pct / 100,
        repsEst: Math.max(1, Math.round((1 - pct / 100) * 36)),
      }))
    : [];

  return (
    <div>
      <SectionLabel>CALCULADORA 1RM</SectionLabel>
      <Card>
        {/* Unidad */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {["kg", "lb"].map(u => (
            <button key={u} onClick={() => setUnit(u)} style={{
              flex: 1, padding: "8px", borderRadius: 10,
              background: unit === u ? "rgba(255,255,255,0.90)" : "var(--bg3)",
              border: "none", color: unit === u ? "#080810" : "var(--text2)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}>{u.toUpperCase()}</button>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <ToolInput label={`Peso (${unit})`} value={weight} onChange={setWeight} />
          <ToolInput label="Reps hechas" value={reps} onChange={setReps} />
        </div>

        {/* Fórmula */}
        <div style={{ marginBottom: orm ? 14 : 0 }}>
          <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 8 }}>FÓRMULA</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {Object.keys(ONE_RM_FORMULAS).map(f => (
              <button key={f} onClick={() => setFormula(f)} style={{
                padding: "5px 10px", borderRadius: 8,
                background: formula === f ? "rgba(255,255,255,0.90)" : "var(--bg3)",
                border: "none", fontSize: 11,
                color: formula === f ? "#080810" : "rgba(240,240,240,0.55)",
                cursor: "pointer", fontFamily: "inherit",
                WebkitTapHighlightColor: "transparent",
              }}>{f}</button>
            ))}
          </div>
        </div>

        {/* Resultado */}
        {ormDisplay && (
          <div style={{
            background: "rgba(255,255,255,0.90)", borderRadius: 12, padding: "16px",
            textAlign: "center", marginTop: 14,
          }}>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "#080810", opacity: 0.5, marginBottom: 4 }}>
              1RM ESTIMADO
            </div>
            <div className="mono" style={{ fontSize: 40, fontWeight: 900, color: "#080810", letterSpacing: -2 }}>
              {ormDisplay.toFixed(1)}
              <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>{unit}</span>
            </div>
          </div>
        )}
      </Card>

      {percentages.length > 0 && (
        <>
          <SectionLabel style={{ marginTop: 20 }}>TABLA DE PORCENTAJES</SectionLabel>
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <Th>% 1RM</Th>
                  <Th>Peso ({unit})</Th>
                  <Th>Reps est.</Th>
                </tr>
              </thead>
              <tbody>
                {percentages.map(({ pct, weight: pw, repsEst }) => (
                  <tr key={pct} style={{
                    borderBottom: "1px solid var(--glass-border)",
                    background: pct === 100 ? "var(--bg3)" : "transparent",
                  }}>
                    <Td className="mono" style={{ fontWeight: pct >= 90 ? 700 : 400 }}>{pct}%</Td>
                    <Td className="mono" style={{ fontWeight: 700 }}>{pw.toFixed(1)}</Td>
                    <Td className="mono" style={{ color: "rgba(240,240,240,0.30)" }}>~{repsEst}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}

// ─── Wilks2 / IPF GL ────────────────────────────────────────────────────────
function StrengthPoints() {
  const [bw, setBw]       = useState("");
  const [squat, setSquat] = useState("");
  const [bench, setBench] = useState("");
  const [dead, setDead]   = useState("");
  const [sex, setSex]     = useState("M");
  const [unit, setUnit]   = useState("kg");

  function toKg(v) {
    const n = parseFloat(v) || 0;
    return unit === "lb" ? n / 2.20462 : n;
  }

  const bwKg    = toKg(bw);
  const totalKg = toKg(squat) + toKg(bench) + toKg(dead);
  const valid   = bwKg > 0 && totalKg > 0;

  const wilks = valid ? calcWilks2(totalKg, bwKg, sex) : null;
  const ipfgl = valid ? calcIPFGL(totalKg, bwKg, sex) : null;

  const levels = [
    { label: "Elite",      wilks: 500, ipfgl: 520 },
    { label: "Maestro",    wilks: 425, ipfgl: 440 },
    { label: "Avanzado",   wilks: 350, ipfgl: 360 },
    { label: "Intermedio", wilks: 275, ipfgl: 285 },
    { label: "Novel",      wilks: 150, ipfgl: 155 },
  ];

  // Qué nivel alcanzaste
  const reachedLevel = wilks
    ? levels.find(l => wilks >= l.wilks)
    : null;

  return (
    <div>
      <SectionLabel>WILKS2 / IPF GL POINTS</SectionLabel>
      <Card>
        {/* Sexo */}
        <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
          {[["M", "♂ Masculino"], ["F", "♀ Femenino"]].map(([s, l]) => (
            <button key={s} onClick={() => setSex(s)} style={{
              flex: 1, padding: "8px", borderRadius: 10,
              background: sex === s ? "rgba(255,255,255,0.90)" : "var(--bg3)",
              border: "none", color: sex === s ? "#080810" : "var(--text2)",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}>{l}</button>
          ))}
        </div>

        {/* Unidad */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {["kg", "lb"].map(u => (
            <button key={u} onClick={() => setUnit(u)} style={{
              padding: "5px 12px", borderRadius: 8,
              background: unit === u ? "rgba(255,255,255,0.90)" : "var(--bg3)",
              border: "none", color: unit === u ? "#080810" : "var(--text2)",
              fontSize: 11, fontWeight: 700, cursor: "pointer",
              fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
            }}>{u}</button>
          ))}
        </div>

        {/* Inputs */}
        <ToolInput label={`Peso corporal (${unit})`} value={bw} onChange={setBw} />
        <div style={{ height: 10 }} />
        <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
          <ToolInput label="Sentadilla" value={squat} onChange={setSquat} />
          <ToolInput label="Banca" value={bench} onChange={setBench} />
          <ToolInput label="Peso Muerto" value={dead} onChange={setDead} />
        </div>
        <div style={{ fontSize: 10, color: "rgba(240,240,240,0.30)", marginBottom: wilks ? 14 : 0 }}>
          También podés ingresar un solo ejercicio en cualquier campo
        </div>

        {/* Resultado */}
        {wilks && ipfgl && (
          <>
            <div style={{ display: "flex", gap: 8 }}>
              <ScoreBox label="WILKS 2" value={wilks.toFixed(1)} />
              <ScoreBox label="IPF GL" value={ipfgl.toFixed(1)} />
            </div>
            {reachedLevel && (
              <div style={{
                marginTop: 10, padding: "10px 14px", borderRadius: 10,
                background: "rgba(255,255,255,0.07)", border: "1px solid var(--glass-border)",
                fontSize: 12, color: "rgba(240,240,240,0.55)",
              }}>
                Nivel alcanzado: <span style={{ fontWeight: 700, color: "var(--text)" }}>{reachedLevel.label}</span>
              </div>
            )}
          </>
        )}
      </Card>

      <SectionLabel style={{ marginTop: 20 }}>NIVELES DE REFERENCIA (Wilks2)</SectionLabel>
      <Card>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
              <Th>Nivel</Th><Th>Wilks2</Th><Th>IPF GL</Th>
            </tr>
          </thead>
          <tbody>
            {levels.map(({ label, wilks: w, ipfgl: g }) => {
              const reached = wilks && wilks >= w;
              return (
                <tr key={label} style={{
                  borderBottom: "1px solid var(--glass-border)",
                  background: reached ? "var(--bg3)" : "transparent",
                }}>
                  <Td style={{ fontWeight: reached ? 700 : 400, color: reached ? "var(--text)" : "var(--text2)" }}>
                    {reached ? "✓ " : ""}{label}
                  </Td>
                  <Td className="mono">{w}+</Td>
                  <Td className="mono" style={{ color: "rgba(240,240,240,0.30)" }}>{g}+</Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

// ─── RPE / RIR ───────────────────────────────────────────────────────────────
function RPERIRTool() {
  const [mode, setMode]     = useState("table");
  const [rpe, setRpe]       = useState(8);
  const [reps, setReps]     = useState(5);
  const [weight, setWeight] = useState("");
  const [unit, setUnit]     = useState("kg");

  const wVal   = parseFloat(weight) || 0;
  const pctRow = RPE_PERCENT_TABLE[rpe];
  const pct    = pctRow ? (pctRow[Math.min(reps - 1, 9)] || pctRow[9]) : null;
  const orm    = pct && wVal > 0 ? (wVal / (pct / 100)) : null;
  const rirVal = RPE_RIR_TABLE.find(x => x.rpe === rpe);

  return (
    <div>
      <SectionLabel>RPE / RIR</SectionLabel>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        {[["table", "📋 Tabla RPE"], ["calc", "🧮 Calculadora"]].map(([k, l]) => (
          <button key={k} onClick={() => setMode(k)} style={{
            flex: 1, padding: "9px", borderRadius: 10,
            background: mode === k ? "rgba(255,255,255,0.90)" : "var(--bg3)",
            border: "none", color: mode === k ? "#080810" : "var(--text2)",
            fontSize: 12, fontWeight: 700, cursor: "pointer",
            fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
          }}>{l}</button>
        ))}
      </div>

      {mode === "table" && (
        <>
          <Card>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                  <Th>RPE</Th><Th>RIR</Th><Th>Descripción</Th>
                </tr>
              </thead>
              <tbody>
                {RPE_RIR_TABLE.map(({ rpe, rir, desc }) => (
                  <tr key={rpe} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <Td className="mono" style={{ fontWeight: 700, width: 44 }}>{rpe}</Td>
                    <Td className="mono" style={{ color: "rgba(240,240,240,0.30)", width: 36 }}>{rir}</Td>
                    <Td style={{ color: "rgba(240,240,240,0.55)", lineHeight: 1.5, fontSize: 11 }}>{desc}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          <SectionLabel style={{ marginTop: 20 }}>% 1RM POR RPE Y REPS</SectionLabel>
          <Card>
            <div style={{ overflowX: "auto", margin: "0 -2px" }}>
              <table style={{ borderCollapse: "collapse", fontSize: 10, minWidth: 360 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
                    <Th style={{ paddingRight: 12 }}>RPE</Th>
                    {[1,2,3,4,5,6,7,8,9,10].map(r => <Th key={r}>{r}R</Th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(RPE_PERCENT_TABLE).map(([r, row]) => (
                    <tr key={r} style={{ borderBottom: "1px solid var(--glass-border)" }}>
                      <Td className="mono" style={{ fontWeight: 700, paddingRight: 12 }}>{r}</Td>
                      {row.map((p, i) => (
                        <Td key={i} className="mono" style={{
                          color: p >= 90 ? "var(--text)" : "var(--text3)",
                          fontWeight: p >= 90 ? 700 : 400,
                        }}>{p}</Td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {mode === "calc" && (
        <Card>
          <div style={{ fontSize: 11, color: "rgba(240,240,240,0.55)", marginBottom: 16, lineHeight: 1.6 }}>
            Ingresá el peso y reps que hiciste + el RPE percibido → obtenés tu 1RM estimado.
          </div>

          {/* Unidad */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["kg", "lb"].map(u => (
              <button key={u} onClick={() => setUnit(u)} style={{
                padding: "5px 12px", borderRadius: 8,
                background: unit === u ? "rgba(255,255,255,0.90)" : "var(--bg3)",
                border: "none", color: unit === u ? "#080810" : "var(--text2)",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
              }}>{u}</button>
            ))}
          </div>

          {/* Peso + reps */}
          <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
            <ToolInput label={`Peso (${unit})`} value={weight} onChange={setWeight} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>REPS</div>
              <select value={reps} onChange={e => setReps(Number(e.target.value))} style={{
                width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid var(--glass-border)",
                color: "var(--text)", padding: "10px 12px", borderRadius: 10,
                fontSize: 15, fontFamily: "\"DM Mono\", monospace", fontWeight: 700,
                outline: "none", cursor: "pointer",
              }}>
                {[1,2,3,4,5,6,7,8,9,10].map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>

          {/* RPE slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
              <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2 }}>RPE PERCIBIDO</div>
              <div className="mono" style={{ fontSize: 22, fontWeight: 900, color: "var(--text)" }}>{rpe}</div>
            </div>
            <input type="range" min={7} max={10} step={0.5} value={rpe}
              onChange={e => setRpe(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--text)", cursor: "pointer", height: 4 }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: "rgba(240,240,240,0.30)", marginTop: 4 }}>
              <span>RPE 7 — fácil</span><span>RPE 10 — fallo</span>
            </div>
          </div>

          {/* Descripción RPE */}
          {rirVal && (
            <div style={{
              background: "rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderRadius: 14, padding: "10px 14px", marginBottom: 14,
              fontSize: 12, color: "rgba(240,240,240,0.55)", lineHeight: 1.5,
            }}>
              <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>RIR {rirVal.rir}</span>
              {" — "}{rirVal.desc}
              {pct && <><br /><span style={{ marginTop: 4, display: "inline-block" }}>
                A <strong>{reps} rep{reps > 1 ? "s" : ""}</strong> con RPE {rpe} → <span className="mono" style={{ fontWeight: 700, color: "var(--text)" }}>{pct}%</span> de tu 1RM
              </span></>}
            </div>
          )}

          {/* Resultado 1RM */}
          {orm && (
            <div style={{
              background: "rgba(255,255,255,0.90)", borderRadius: 12, padding: "16px",
              textAlign: "center",
            }}>
              <div style={{ fontSize: 9, letterSpacing: 3, color: "#080810", opacity: 0.5, marginBottom: 4 }}>
                1RM ESTIMADO
              </div>
              <div className="mono" style={{ fontSize: 40, fontWeight: 900, color: "#080810", letterSpacing: -2 }}>
                {orm.toFixed(1)}
                <span style={{ fontSize: 16, fontWeight: 400, opacity: 0.6, marginLeft: 6 }}>{unit}</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function SectionLabel({ children, style }) {
  return (
    <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700, marginBottom: 10, ...style }}>
      {children}
    </div>
  );
}

function Card({ children }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.07)",
      backdropFilter: "blur(40px) saturate(180%)",
      WebkitBackdropFilter: "blur(40px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.13)",
      borderRadius: 18, padding: "16px",
    }}>{children}</div>
  );
}

function ToolInput({ label, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, marginBottom: 6 }}>
        {label.toUpperCase()}
      </div>
      <input
        type="number"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={{
          width: "100%", background: "rgba(255,255,255,0.07)",
          border: "1px solid var(--glass-border)",
          color: "var(--text)", padding: "10px 12px",
          borderRadius: 10, fontSize: 16,
          fontFamily: "\"DM Mono\", monospace",
          fontWeight: 700, outline: "none",
        }}
      />
    </div>
  );
}

function Th({ children, style }) {
  return (
    <th style={{
      textAlign: "left", padding: "6px 6px",
      fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
      color: "rgba(240,240,240,0.30)", textTransform: "uppercase", ...style,
    }}>{children}</th>
  );
}

function Td({ children, className, style }) {
  return (
    <td className={className} style={{ padding: "8px 6px", color: "var(--text)", ...style }}>
      {children}
    </td>
  );
}

function ScoreBox({ label, value }) {
  return (
    <div style={{
      flex: 1, background: "rgba(255,255,255,0.90)", borderRadius: 12,
      padding: "14px", textAlign: "center",
    }}>
      <div style={{ fontSize: 9, letterSpacing: 2, color: "#080810", opacity: 0.5, marginBottom: 4 }}>
        {label}
      </div>
      <div className="mono" style={{ fontSize: 30, fontWeight: 900, color: "#080810", letterSpacing: -1 }}>
        {value}
      </div>
    </div>
  );
}
