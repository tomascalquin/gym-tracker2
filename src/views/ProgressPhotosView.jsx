import { useState, useRef, useEffect } from "react";
import { savePhoto, loadPhotos, deletePhoto, getStorageUsedKB } from "../utils/progressPhotos";
import { todayStr } from "../utils/storage";
import { haptics } from "../utils/haptics";

export default function ProgressPhotosView({ user, onBack }) {
  const [photos, setPhotos]     = useState([]);
  const [tab, setTab]           = useState("gallery"); // gallery | add | compare
  const [saving, setSaving]     = useState(false);
  const [compareA, setCompareA] = useState(null);
  const [compareB, setCompareB] = useState(null);
  const [preview, setPreview]   = useState(null); // foto ampliada

  // Form
  const [date, setDate]   = useState(todayStr());
  const [note, setNote]   = useState("");
  const [weight, setWeight] = useState("");
  const [file, setFile]   = useState(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const fileRef = useRef();

  const usedKB = getStorageUsedKB(user.uid);

  useEffect(() => {
    setPhotos(loadPhotos(user.uid));
  }, [user.uid]);

  function handleFileChange(e) {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = ev => setPreviewSrc(ev.target.result);
    reader.readAsDataURL(f);
  }

  async function handleSave() {
    if (!file) return;
    setSaving(true);
    haptics.light();
    try {
      const entry = await savePhoto(user.uid, file, {
        date, note, weight: weight ? parseFloat(weight) : null,
      });
      setPhotos(loadPhotos(user.uid));
      setFile(null); setPreviewSrc(null); setNote(""); setWeight("");
      setTab("gallery");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  function handleDelete(id) {
    haptics.light();
    deletePhoto(user.uid, id);
    setPhotos(loadPhotos(user.uid));
    if (compareA?.id === id) setCompareA(null);
    if (compareB?.id === id) setCompareB(null);
    if (preview?.id === id) setPreview(null);
  }

  return (
    <div style={{ maxWidth: 460, margin: "0 auto", fontFamily: "inherit", animation: "fadeIn 0.25s ease" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={onBack} className="nbtn" style={{ fontSize: 22, color: "rgba(240,240,240,0.50)", padding: "0 4px" }}>←</button>
          <div>
            <div style={{ fontSize: 9, letterSpacing: 3, color: "rgba(240,240,240,0.30)", fontWeight: 700 }}>PROGRESO</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.8 }}>Fotos 📸</div>
          </div>
          <div style={{ marginLeft: "auto", fontSize: 9, color: "rgba(240,240,240,0.25)" }}>
            {usedKB} KB usados
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex" }}>
          {[["gallery", "Galería"], ["add", "Nueva foto"], ["compare", "Comparar"]].map(([k, l]) => (
            <button key={k} onClick={() => setTab(k)} style={{
              flex: 1, background: "none", border: "none",
              borderBottom: `2px solid ${tab === k ? "rgba(255,255,255,0.80)" : "transparent"}`,
              color: tab === k ? "#fff" : "rgba(240,240,240,0.35)",
              padding: "10px 4px", cursor: "pointer",
              fontSize: 9, letterSpacing: 2, fontWeight: 700,
              fontFamily: "inherit", marginBottom: -1,
            }}>{l.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 20px 120px" }}>

        {/* ── TAB: GALERÍA ── */}
        {tab === "gallery" && (
          photos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 13, color: "rgba(240,240,240,0.40)", marginBottom: 20 }}>
                Aún no hay fotos de progreso
              </div>
              <button onClick={() => setTab("add")} style={{
                background: "rgba(255,255,255,0.10)",
                border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff", padding: "12px 24px", borderRadius: 14,
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                cursor: "pointer", fontFamily: "inherit",
              }}>+ AGREGAR PRIMERA FOTO</button>
            </div>
          ) : (
            <>
              {/* Grid de fotos */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {photos.map((p, i) => (
                  <div key={p.id} style={{
                    borderRadius: 16, overflow: "hidden",
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    animation: `scaleIn 0.2s ease ${i * 0.04}s both`,
                    position: "relative",
                  }}>
                    <img
                      src={p.base64}
                      alt={p.date}
                      onClick={() => setPreview(p)}
                      style={{
                        width: "100%", aspectRatio: "3/4",
                        objectFit: "cover", display: "block",
                        cursor: "pointer",
                      }}
                    />
                    <div style={{
                      padding: "8px 10px",
                      background: "rgba(0,0,0,0.40)",
                    }}>
                      <div style={{ fontSize: 10, color: "rgba(240,240,240,0.70)", fontWeight: 600 }}>{p.date}</div>
                      {p.weight && (
                        <div className="mono" style={{ fontSize: 9, color: "rgba(240,240,240,0.40)" }}>
                          {p.weight} kg
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )
        )}

        {/* ── TAB: NUEVA FOTO ── */}
        {tab === "add" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Upload zone */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                background: previewSrc ? "transparent" : "rgba(255,255,255,0.04)",
                border: `2px dashed ${previewSrc ? "transparent" : "rgba(255,255,255,0.15)"}`,
                borderRadius: 20, overflow: "hidden",
                cursor: "pointer", textAlign: "center",
                minHeight: previewSrc ? 0 : 200,
                display: "flex", alignItems: "center", justifyContent: "center",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              {previewSrc ? (
                <img src={previewSrc} alt="preview" style={{
                  width: "100%", maxHeight: 380, objectFit: "cover",
                  borderRadius: 18, display: "block",
                }} />
              ) : (
                <div style={{ padding: 40 }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
                  <div style={{ fontSize: 13, color: "rgba(240,240,240,0.40)" }}>Tocar para seleccionar foto</div>
                  <div style={{ fontSize: 10, color: "rgba(240,240,240,0.25)", marginTop: 4 }}>
                    Se comprime automáticamente
                  </div>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment"
              onChange={handleFileChange} style={{ display: "none" }} />

            {previewSrc && (
              <button onClick={() => fileRef.current.click()} style={{
                background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(240,240,240,0.60)", padding: "10px", borderRadius: 12,
                fontSize: 10, letterSpacing: 2, fontWeight: 700, cursor: "pointer",
                fontFamily: "inherit", WebkitTapHighlightColor: "transparent",
              }}>📷 CAMBIAR FOTO</button>
            )}

            {/* Fecha */}
            <div>
              <div style={labelStyle}>FECHA</div>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} />
            </div>

            {/* Peso */}
            <div>
              <div style={labelStyle}>PESO CORPORAL (opcional)</div>
              <input
                type="number" value={weight} onChange={e => setWeight(e.target.value)}
                placeholder="ej. 75.5"
                style={{ ...inputStyle, fontFamily: "DM Mono, monospace", fontWeight: 700 }}
              />
            </div>

            {/* Nota */}
            <div>
              <div style={labelStyle}>NOTA (opcional)</div>
              <textarea
                value={note} onChange={e => setNote(e.target.value)}
                placeholder="semana de bulk, fin de cut, etc..."
                rows={2}
                style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
              />
            </div>

            <button onClick={handleSave} disabled={!file || saving} style={{
              width: "100%", padding: "15px",
              background: !file ? "rgba(255,255,255,0.07)" : saving ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.92)",
              border: "1px solid rgba(255,255,255,0.30)",
              color: !file || saving ? "rgba(240,240,240,0.30)" : "#080810",
              borderRadius: 18, cursor: !file || saving ? "default" : "pointer",
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              fontFamily: "inherit",
            }}>
              {saving ? "COMPRIMIENDO Y GUARDANDO..." : "✓ GUARDAR FOTO"}
            </button>
          </div>
        )}

        {/* ── TAB: COMPARAR ── */}
        {tab === "compare" && (
          <div>
            {photos.length < 2 ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🆚</div>
                <div style={{ fontSize: 13, color: "rgba(240,240,240,0.40)" }}>
                  Necesitás al menos 2 fotos para comparar
                </div>
              </div>
            ) : (
              <>
                {/* Selección */}
                {(!compareA || !compareB) && (
                  <>
                    <div style={{ fontSize: 11, color: "rgba(240,240,240,0.40)", marginBottom: 14, textAlign: "center" }}>
                      {!compareA ? "Seleccioná la foto ANTES" : "Seleccioná la foto DESPUÉS"}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                      {photos.map(p => {
                        const isA = compareA?.id === p.id;
                        return (
                          <div key={p.id}
                            onClick={() => {
                              if (!compareA) setCompareA(p);
                              else if (!compareB && p.id !== compareA.id) setCompareB(p);
                            }}
                            style={{
                              borderRadius: 14, overflow: "hidden",
                              border: isA ? "2px solid #a78bfa" : "1px solid rgba(255,255,255,0.10)",
                              cursor: "pointer", opacity: compareA && !isA && compareB ? 0.4 : 1,
                              boxShadow: isA ? "0 0 16px rgba(167,139,250,0.30)" : "none",
                            }}
                          >
                            <img src={p.base64} alt={p.date} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                            <div style={{ padding: "6px 8px", background: "rgba(0,0,0,0.50)", fontSize: 9, color: "rgba(240,240,240,0.60)" }}>
                              {p.date}{p.weight ? ` · ${p.weight}kg` : ""}
                              {isA && <span style={{ color: "#a78bfa", marginLeft: 6, fontWeight: 700 }}>ANTES</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Comparación side-by-side */}
                {compareA && compareB && (
                  <div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                      {[compareA, compareB].map((p, i) => (
                        <div key={p.id} style={{ borderRadius: 16, overflow: "hidden", border: `1px solid ${i === 0 ? "rgba(167,139,250,0.40)" : "rgba(74,222,128,0.40)"}` }}>
                          <img src={p.base64} alt={p.date} style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", display: "block" }} />
                          <div style={{ padding: "8px 10px", background: "rgba(0,0,0,0.60)" }}>
                            <div style={{ fontSize: 8, letterSpacing: 1.5, fontWeight: 700, color: i === 0 ? "#a78bfa" : "#4ade80", marginBottom: 2 }}>
                              {i === 0 ? "ANTES" : "DESPUÉS"}
                            </div>
                            <div style={{ fontSize: 10, color: "rgba(240,240,240,0.70)" }}>{p.date}</div>
                            {p.weight && <div className="mono" style={{ fontSize: 9, color: "rgba(240,240,240,0.40)" }}>{p.weight} kg</div>}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delta de peso */}
                    {compareA.weight && compareB.weight && (
                      <div style={{
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)",
                        borderRadius: 14, padding: "12px 16px", textAlign: "center",
                      }}>
                        <div style={{ fontSize: 9, color: "rgba(240,240,240,0.30)", letterSpacing: 2, fontWeight: 700, marginBottom: 6 }}>
                          DIFERENCIA DE PESO
                        </div>
                        <div className="mono" style={{
                          fontSize: 28, fontWeight: 900, letterSpacing: -1,
                          color: compareB.weight - compareA.weight > 0 ? "#fbbf24" : "#4ade80",
                        }}>
                          {compareB.weight - compareA.weight > 0 ? "+" : ""}{(compareB.weight - compareA.weight).toFixed(1)} kg
                        </div>
                      </div>
                    )}

                    <button onClick={() => { setCompareA(null); setCompareB(null); }} style={{
                      width: "100%", marginTop: 12,
                      background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(240,240,240,0.60)", padding: "12px", borderRadius: 14,
                      fontSize: 10, letterSpacing: 2, fontWeight: 700,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>CAMBIAR SELECCIÓN</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Preview ampliado */}
      {preview && (
        <>
          <div onClick={() => setPreview(null)} style={{
            position: "fixed", inset: 0, zIndex: 200,
            background: "rgba(0,0,0,0.92)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: 20,
          }}>
            <img src={preview.base64} alt={preview.date} style={{
              maxWidth: "100%", maxHeight: "75vh",
              borderRadius: 18, objectFit: "contain",
            }} />
            <div style={{ marginTop: 16, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#fff", fontWeight: 700 }}>{preview.date}</div>
              {preview.weight && <div className="mono" style={{ fontSize: 12, color: "rgba(240,240,240,0.50)", marginTop: 4 }}>{preview.weight} kg</div>}
              {preview.note && <div style={{ fontSize: 12, color: "rgba(240,240,240,0.40)", marginTop: 4 }}>{preview.note}</div>}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={e => { e.stopPropagation(); setPreview(null); }} style={{
                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)",
                color: "#fff", padding: "10px 24px", borderRadius: 12,
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                cursor: "pointer", fontFamily: "inherit",
              }}>CERRAR</button>
              <button onClick={e => { e.stopPropagation(); handleDelete(preview.id); setPreview(null); }} style={{
                background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.30)",
                color: "#f87171", padding: "10px 24px", borderRadius: 12,
                fontSize: 11, fontWeight: 700, letterSpacing: 2,
                cursor: "pointer", fontFamily: "inherit",
              }}>🗑 ELIMINAR</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const labelStyle = {
  fontSize: 9, letterSpacing: 2.5, color: "rgba(240,240,240,0.30)",
  fontWeight: 700, marginBottom: 8,
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f0f0f0", padding: "11px 14px",
  borderRadius: 14, fontSize: 14,
  fontFamily: "inherit", outline: "none",
};
