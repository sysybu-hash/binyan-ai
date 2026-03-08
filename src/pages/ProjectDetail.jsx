import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const TABS = [
  { id: "overview", label: "סקירה", icon: "📊" },
  { id: "invoices", label: "חשבוניות", icon: "🧾" },
  { id: "files", label: "תוכניות וקבצים", icon: "📁" },
  { id: "quantities", label: "בינראית", icon: "📐" },
  { id: "timeline", label: "לוח זמנים", icon: "📅" },
  { id: "messages", label: "הודעות ללקוח", icon: "💬" },
];

// ─── AI Scanner ─────────────────────────────────────────────────────────────
async function scanWithGemini(file) {
  const key = import.meta.env.VITE_GEMINI_KEY;
  if (!key) throw new Error("מפתח Gemini חסר — הוסף VITE_GEMINI_KEY ל-.env.local");

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target.result.split(",")[1];
      const mimeType = file.type || "image/jpeg";

      const prompt = `אתה מומחה לניתוח מסמכים פיננסיים והנדסיים בעברית.
נתח את המסמך המצורף בדקדקנות מלאה והחזר JSON בלבד (ללא markdown, ללא backticks).

החזר בפורמט הזה:
{
  "doc_type": "חשבונית" | "תוכנית הנדסית" | "חוזה" | "דוח" | "אחר",
  "supplier": "שם הספק/קבלן",
  "invoice_number": "מספר חשבונית אם יש",
  "date": "תאריך המסמך",
  "amount_before_vat": 0,
  "vat": 0,
  "total_amount": 0,
  "currency": "ILS",
  "description": "תיאור העבודה/השירות",
  "items": [{"desc": "פריט", "qty": 1, "unit_price": 0, "total": 0}],
  "notes": "הערות חשובות",
  "confidence": 0.95
}

חשוב מאוד:
- הסכומים חייבים להיות מספרים (לא מחרוזות)
- אם אין מע"מ, חשב 17% מהסכום לפני מע"מ
- confidence = רמת הוודאות שלך (0-1)
- אם המסמך הוא תוכנית הנדסית ולא חשבונית, הסכומים יהיו 0`;

      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { inline_data: { mime_type: mimeType, data: base64 } },
                  { text: prompt }
                ]
              }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
            })
          }
        );

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error?.message || `HTTP ${response.status}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleaned = text.replace(/```json|```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("שגיאה בקריאת הקובץ"));
    reader.readAsDataURL(file);
  });
}

// ─── Overview Tab ────────────────────────────────────────────────────────────
function OverviewTab({ project, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...project });
  const [saving, setSaving] = useState(false);

  const pct = project.budget > 0 ? Math.min((project.spent / project.budget) * 100, 110) : 0;
  const barColor = pct > 100 ? "#ef4444" : pct > 85 ? "#f59e0b" : "#22c55e";
  const remaining = (project.budget || 0) - (project.spent || 0);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("projects").update(form).eq("id", project.id);
    if (!error) { onUpdate(form); setEditing(false); }
    setSaving(false);
  };

  const inp = (label, key, type = "text") => (
    <div>
      <label style={lbl}>{label}</label>
      <input type={type} value={form[key] || ""} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={inp2} />
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "1rem" }}>
        {[
          { label: "תקציב מאושר", val: `₪${(project.budget||0).toLocaleString()}`, color: "#3b82f6" },
          { label: "הוצאות בפועל", val: `₪${(project.spent||0).toLocaleString()}`, color: pct > 100 ? "#ef4444" : "#E8A84C" },
          { label: "יתרה", val: `₪${remaining.toLocaleString()}`, color: remaining < 0 ? "#ef4444" : "#22c55e" },
          { label: "ימים לסיום", val: project.days_left || "—", color: "#a78bfa" },
        ].map(k => (
          <div key={k.label} style={card}>
            <div style={{ fontSize: "0.8rem", color: "#8B9DBS", marginBottom: "0.3rem" }}>{k.label}</div>
            <div style={{ fontSize: "1.4rem", fontWeight: 700, color: k.color }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Budget Bar */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <span style={{ color: "#E8E0D5", fontWeight: 600 }}>ניצול תקציב</span>
          <span style={{ color: barColor, fontWeight: 700 }}>{pct.toFixed(1)}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "999px", height: "12px" }}>
          <div style={{ width: `${Math.min(pct,100)}%`, background: barColor, borderRadius: "999px", height: "100%", transition: "width 0.6s" }} />
        </div>
        {pct > 100 && (
          <div style={{ color: "#ef4444", fontSize: "0.85rem", marginTop: "0.5rem" }}>
            ⚠️ חריגה של ₪{Math.abs(remaining).toLocaleString()}
          </div>
        )}
      </div>

      {/* Details */}
      {editing ? (
        <div style={card}>
          <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>✏️ עריכת פרויקט</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            {inp("שם פרויקט", "name")}
            {inp("לקוח", "client")}
            {inp("תקציב", "budget", "number")}
            {inp("הוצאות", "spent", "number")}
            {inp("סטטוס", "status")}
            {inp("שלב", "phase")}
            {inp("% ביצוע", "progress", "number")}
            {inp("ימים לסיום", "days_left", "number")}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={save} disabled={saving} style={btnPrimary}>{saving ? "שומר..." : "💾 שמור"}</button>
            <button onClick={() => setEditing(false)} style={btnSecondary}>ביטול</button>
          </div>
        </div>
      ) : (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h3 style={{ color: "#E8A84C" }}>📋 פרטי פרויקט</h3>
            <button onClick={() => setEditing(true)} style={btnSecondary}>✏️ ערוך</button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {[
              ["לקוח", project.client],
              ["סטטוס", project.status],
              ["שלב", project.phase],
              ["% ביצוע", `${project.progress || 0}%`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.75rem", padding: "0.75rem" }}>
                <div style={{ fontSize: "0.8rem", color: "#8B9DBS" }}>{k}</div>
                <div style={{ color: "#E8E0D5", fontWeight: 600 }}>{v || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Invoices Tab ────────────────────────────────────────────────────────────
function InvoicesTab({ projectId }) {
  const [invoices, setInvoices] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  useEffect(() => { loadInvoices(); }, [projectId]);

  const loadInvoices = async () => {
    const { data } = await supabase.from("invoices").select("*")
      .eq("project_id", projectId).order("created_at", { ascending: false });
    if (data) setInvoices(data);
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setScanError("");
    setScanResult(null);
    setPreview(URL.createObjectURL(file));
    setScanning(true);
    try {
      const result = await scanWithGemini(file);
      setScanResult({ ...result, _file: file.name });
    } catch (err) {
      setScanError(err.message);
    }
    setScanning(false);
  };

  const saveInvoice = async () => {
    if (!scanResult) return;
    setSaving(true);
    const { error } = await supabase.from("invoices").insert({
      project_id: projectId,
      supplier: scanResult.supplier || "",
      invoice_number: scanResult.invoice_number || "",
      date: scanResult.date || new Date().toISOString().split("T")[0],
      amount_before_vat: scanResult.amount_before_vat || 0,
      vat: scanResult.vat || 0,
      total_amount: scanResult.total_amount || 0,
      description: scanResult.description || "",
      doc_type: scanResult.doc_type || "חשבונית",
      status: "ממתין לאישור",
      confidence: scanResult.confidence || 0,
    });
    if (!error) {
      await supabase.from("projects").update({
        spent: supabase.rpc ? undefined : undefined
      }).eq("id", projectId);
      setScanResult(null);
      setPreview(null);
      loadInvoices();
    }
    setSaving(false);
  };

  const approveInvoice = async (inv) => {
    await supabase.from("invoices").update({ status: "מאושר" }).eq("id", inv.id);
    // Update project spent
    const newSpent = invoices
      .filter(i => i.id === inv.id ? true : i.status === "מאושר")
      .filter(i => i.id === inv.id ? true : true)
      .reduce((s, i) => s + (i.id === inv.id ? inv.total_amount : i.status === "מאושר" ? i.total_amount : 0), 0);
    await supabase.from("projects").update({ spent: newSpent }).eq("id", projectId);
    loadInvoices();
  };

  const deleteInvoice = async (id) => {
    if (!confirm("למחוק חשבונית זו?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    loadInvoices();
  };

  const confidenceColor = (c) => c > 0.85 ? "#22c55e" : c > 0.6 ? "#f59e0b" : "#ef4444";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Scanner */}
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>🤖 סריקת מסמך AI</h3>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: "2px dashed rgba(232,168,76,0.4)", borderRadius: "1rem",
            padding: "2rem", textAlign: "center", cursor: "pointer",
            background: "rgba(232,168,76,0.04)", marginBottom: "1rem",
            transition: "all 0.2s",
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>📄</div>
          <div style={{ color: "#E8A84C", fontWeight: 600 }}>לחץ להעלאת חשבונית / מסמך</div>
          <div style={{ color: "#8B9DBS", fontSize: "0.85rem" }}>PDF, JPG, PNG — הAI יחלץ את כל הנתונים</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFile} style={{ display: "none" }} />

        {scanning && (
          <div style={{ textAlign: "center", color: "#E8A84C", padding: "1rem" }}>
            ⟳ מנתח מסמך עם Gemini AI...
          </div>
        )}

        {scanError && (
          <div style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: "0.75rem", padding: "0.75rem", marginBottom: "1rem" }}>
            ❌ {scanError}
          </div>
        )}

        {scanResult && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "1rem", padding: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ color: "#22c55e", fontWeight: 700 }}>✓ נתחלץ בהצלחה</div>
              <div style={{ fontSize: "0.8rem", color: confidenceColor(scanResult.confidence) }}>
                דיוק: {Math.round((scanResult.confidence || 0) * 100)}%
              </div>
            </div>
            {scanResult.confidence < 0.7 && (
              <div style={{ color: "#f59e0b", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
                ⚠️ רמת דיוק נמוכה — אמת ידנית לפני אישור
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "1rem" }}>
              {[
                ["סוג מסמך", scanResult.doc_type],
                ["ספק", scanResult.supplier],
                ["מספר חשבונית", scanResult.invoice_number],
                ["תאריך", scanResult.date],
                ["לפני מע\"מ", scanResult.amount_before_vat ? `₪${Number(scanResult.amount_before_vat).toLocaleString()}` : "—"],
                ["מע\"מ", scanResult.vat ? `₪${Number(scanResult.vat).toLocaleString()}` : "—"],
                ["סה\"כ לתשלום", scanResult.total_amount ? `₪${Number(scanResult.total_amount).toLocaleString()}` : "—"],
                ["תיאור", scanResult.description],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem" }}>
                  <div style={{ fontSize: "0.75rem", color: "#8B9DBS" }}>{k}</div>
                  <div style={{ color: "#E8E0D5", fontWeight: 600, fontSize: "0.9rem" }}>{v || "—"}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button onClick={saveInvoice} disabled={saving} style={btnPrimary}>
                {saving ? "שומר..." : "💾 שמור חשבונית"}
              </button>
              <button onClick={() => { setScanResult(null); setPreview(null); }} style={btnSecondary}>
                🗑️ בטל
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice List */}
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>📋 היסטוריית חשבוניות ({invoices.length})</h3>
        {invoices.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DBS", padding: "2rem" }}>אין חשבוניות עדיין</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["ספק", "מס׳", "תאריך", "סה\"כ", "סטטוס", "דיוק", "פעולות"].map(h => (
                    <th key={h} style={{ padding: "0.5rem 0.75rem", color: "#8B9DBS", fontSize: "0.8rem", fontWeight: 600, textAlign: "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    <td style={td}>{inv.supplier || "—"}</td>
                    <td style={td}>{inv.invoice_number || "—"}</td>
                    <td style={td}>{inv.date || "—"}</td>
                    <td style={{ ...td, fontWeight: 700, color: "#E8A84C" }}>₪{Number(inv.total_amount || 0).toLocaleString()}</td>
                    <td style={td}>
                      <span style={{
                        padding: "0.2rem 0.6rem", borderRadius: "0.5rem", fontSize: "0.75rem", fontWeight: 600,
                        background: inv.status === "מאושר" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)",
                        color: inv.status === "מאושר" ? "#22c55e" : "#f59e0b"
                      }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ ...td, color: confidenceColor(inv.confidence || 0) }}>
                      {Math.round((inv.confidence || 0) * 100)}%
                    </td>
                    <td style={td}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {inv.status !== "מאושר" && (
                          <button onClick={() => approveInvoice(inv)} style={{ ...btnMini, background: "rgba(34,197,94,0.2)", color: "#22c55e" }}>✓</button>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)} style={{ ...btnMini, background: "rgba(239,68,68,0.2)", color: "#ef4444" }}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: "1rem", textAlign: "left", color: "#E8A84C", fontWeight: 700 }}>
              סה"כ: ₪{invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0).toLocaleString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Files Tab ───────────────────────────────────────────────────────────────
function FilesTab({ projectId }) {
  const [files, setFiles] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef();

  useEffect(() => { loadFiles(); }, [projectId]);

  const loadFiles = async () => {
    const { data } = await supabase.from("project_files").select("*")
      .eq("project_id", projectId).order("created_at", { ascending: false });
    if (data) setFiles(data);
  };

  const onFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    setAiResult(null);
    setAnalyzing(true);

    try {
      const key = import.meta.env.VITE_GEMINI_KEY;
      if (!key) throw new Error("מפתח Gemini חסר");

      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64 = ev.target.result.split(",")[1];
        const mimeType = file.type || "image/jpeg";

        const prompt = `אתה מהנדס בניין מנוסה. נתח את התוכנית ההנדסית/הגרמושקה הזו.
החזר JSON בלבד (ללא markdown):
{
  "doc_type": "תוכנית ביצוע" | "גרמושקה" | "תוכנית קומה" | "חתך" | "פרט" | "אחר",
  "rooms": [{"name": "שם חדר", "width_m": 0, "length_m": 0, "area_sqm": 0}],
  "total_area": 0,
  "floors": 1,
  "materials": [{"name": "חומר", "quantity": 0, "unit": "מ\"ק|מ\"ר|יח'"}],
  "notes": "הערות מהנדסיות",
  "confidence": 0.9
}`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ inline_data: { mime_type: mimeType, data: base64 } }, { text: prompt }] }],
              generationConfig: { temperature: 0.1 }
            })
          }
        );

        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
        setAiResult({ ...parsed, fileName: file.name });

        // Save to DB
        await supabase.from("project_files").insert({
          project_id: projectId,
          file_name: file.name,
          file_type: parsed.doc_type,
          ai_analysis: JSON.stringify(parsed),
        });
        loadFiles();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError(err.message);
    }
    setAnalyzing(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>📐 העלאת תוכנית הנדסית לניתוח AI</h3>
        <div onClick={() => fileRef.current?.click()} style={{
          border: "2px dashed rgba(59,130,246,0.4)", borderRadius: "1rem",
          padding: "2rem", textAlign: "center", cursor: "pointer",
          background: "rgba(59,130,246,0.04)", marginBottom: "1rem"
        }}>
          <div style={{ fontSize: "2.5rem" }}>🗺️</div>
          <div style={{ color: "#60a5fa", fontWeight: 600 }}>העלה גרמושקה / תוכנית הנדסית</div>
          <div style={{ color: "#8B9DBS", fontSize: "0.85rem" }}>AI יחלץ חדרים, שטחים וחומרים</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFile} style={{ display: "none" }} />

        {analyzing && <div style={{ textAlign: "center", color: "#60a5fa", padding: "1rem" }}>⟳ מנתח תוכנית...</div>}
        {error && <div style={{ color: "#ef4444", background: "rgba(239,68,68,0.1)", borderRadius: "0.75rem", padding: "0.75rem" }}>❌ {error}</div>}

        {aiResult && (
          <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "1rem", padding: "1.25rem" }}>
            <div style={{ color: "#60a5fa", fontWeight: 700, marginBottom: "1rem" }}>✓ ניתוח תוכנית: {aiResult.fileName}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
              <div style={kpiMini}><div style={{ color: "#8B9DBS", fontSize: "0.75rem" }}>סוג מסמך</div><div style={{ color: "#E8E0D5" }}>{aiResult.doc_type}</div></div>
              <div style={kpiMini}><div style={{ color: "#8B9DBS", fontSize: "0.75rem" }}>שטח כולל</div><div style={{ color: "#E8E0D5" }}>{aiResult.total_area} מ"ר</div></div>
              <div style={kpiMini}><div style={{ color: "#8B9DBS", fontSize: "0.75rem" }}>קומות</div><div style={{ color: "#E8E0D5" }}>{aiResult.floors}</div></div>
            </div>
            {aiResult.rooms?.length > 0 && (
              <div style={{ marginBottom: "1rem" }}>
                <div style={{ color: "#E8A84C", fontWeight: 600, marginBottom: "0.5rem" }}>חדרים:</div>
                {aiResult.rooms.map((r, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.3rem", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#E8E0D5" }}>{r.name}</span>
                    <span style={{ color: "#8B9DBS" }}>{r.width_m}×{r.length_m}מ = {r.area_sqm}מ"ר</span>
                  </div>
                ))}
              </div>
            )}
            {aiResult.materials?.length > 0 && (
              <div>
                <div style={{ color: "#E8A84C", fontWeight: 600, marginBottom: "0.5rem" }}>חומרים משוערים:</div>
                {aiResult.materials.map((m, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem", padding: "0.5rem 0.75rem", marginBottom: "0.3rem", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#E8E0D5" }}>{m.name}</span>
                    <span style={{ color: "#E8A84C" }}>{m.quantity} {m.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>📁 קבצים שנסרקו ({files.length})</h3>
        {files.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DBS", padding: "1.5rem" }}>אין קבצים עדיין</div>
        ) : files.map(f => (
          <div key={f.id} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.75rem", padding: "0.75rem 1rem", marginBottom: "0.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#E8E0D5", fontWeight: 600 }}>{f.file_name}</div>
              <div style={{ color: "#8B9DBS", fontSize: "0.8rem" }}>{f.file_type} • {new Date(f.created_at).toLocaleDateString("he-IL")}</div>
            </div>
            <button onClick={() => supabase.from("project_files").delete().eq("id", f.id).then(loadFiles)}
              style={{ ...btnMini, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Quantities (בינראית) Tab ────────────────────────────────────────────────
function QuantitiesTab({ projectId }) {
  const [rows, setRows] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ section: "שלד", item: "", unit: "מ\"ק", contract_qty: 0, actual_qty: 0, unit_price: 0 });

  const SECTIONS = ["עפר ופיתוח", "שלד", "בנייה", "אינסטלציה", "חשמל", "גמר", "מסגרות ואלומיניום", "שונות"];

  useEffect(() => { loadRows(); }, [projectId]);

  const loadRows = async () => {
    const { data } = await supabase.from("quantities").select("*")
      .eq("project_id", projectId).order("created_at");
    if (data) setRows(data);
  };

  const addRow = async () => {
    const { error } = await supabase.from("quantities").insert({
      project_id: projectId,
      ...form,
      contract_total: form.contract_qty * form.unit_price,
      actual_total: form.actual_qty * form.unit_price,
    });
    if (!error) { setAdding(false); setForm({ section: "שלד", item: "", unit: "מ\"ק", contract_qty: 0, actual_qty: 0, unit_price: 0 }); loadRows(); }
  };

  const grouped = SECTIONS.reduce((acc, s) => {
    acc[s] = rows.filter(r => r.section === s);
    return acc;
  }, {});

  const totalContract = rows.reduce((s, r) => s + (r.contract_total || 0), 0);
  const totalActual = rows.reduce((s, r) => s + (r.actual_total || 0), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
        <div style={card}><div style={{ color: "#8B9DBS", fontSize: "0.8rem" }}>סה"כ חוזה</div><div style={{ color: "#3b82f6", fontSize: "1.4rem", fontWeight: 700 }}>₪{totalContract.toLocaleString()}</div></div>
        <div style={card}><div style={{ color: "#8B9DBS", fontSize: "0.8rem" }}>סה"כ ביצוע</div><div style={{ color: "#E8A84C", fontSize: "1.4rem", fontWeight: 700 }}>₪{totalActual.toLocaleString()}</div></div>
        <div style={card}><div style={{ color: "#8B9DBS", fontSize: "0.8rem" }}>הפרש</div><div style={{ color: totalActual > totalContract ? "#ef4444" : "#22c55e", fontSize: "1.4rem", fontWeight: 700 }}>₪{Math.abs(totalContract - totalActual).toLocaleString()}</div></div>
      </div>

      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: "#E8A84C" }}>📐 כתב כמויות</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ הוסף סעיף</button>
      </div>

      {adding && (
        <div style={card}>
          <h4 style={{ color: "#E8A84C", marginBottom: "1rem" }}>➕ סעיף חדש</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            <div>
              <label style={lbl}>פרק</label>
              <select value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))} style={inp2}>
                {SECTIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            {[["תיאור עבודה", "item", "text"], ["יחידה", "unit", "text"], ["כמות חוזה", "contract_qty", "number"], ["כמות ביצוע", "actual_qty", "number"], ["מחיר יחידה", "unit_price", "number"]].map(([l, k, t]) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: t === "number" ? +e.target.value : e.target.value }))} style={inp2} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={addRow} style={btnPrimary}>💾 שמור</button>
            <button onClick={() => setAdding(false)} style={btnSecondary}>ביטול</button>
          </div>
        </div>
      )}

      {SECTIONS.map(sec => {
        const secRows = grouped[sec] || [];
        if (secRows.length === 0) return null;
        return (
          <div key={sec} style={card}>
            <h4 style={{ color: "#E8A84C", marginBottom: "0.75rem" }}>{sec}</h4>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["תיאור", "יחידה", "כמות חוזה", "כמות ביצוע", "מחיר יחידה", "סה\"כ חוזה", "סה\"כ ביצוע", ""].map(h => (
                    <th key={h} style={{ padding: "0.4rem 0.6rem", color: "#8B9DBS", fontSize: "0.75rem", fontWeight: 600, textAlign: "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {secRows.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={td}>{r.item}</td>
                    <td style={td}>{r.unit}</td>
                    <td style={td}>{r.contract_qty}</td>
                    <td style={{ ...td, color: r.actual_qty > r.contract_qty ? "#ef4444" : "#E8E0D5" }}>{r.actual_qty}</td>
                    <td style={td}>₪{Number(r.unit_price).toLocaleString()}</td>
                    <td style={td}>₪{Number(r.contract_total || 0).toLocaleString()}</td>
                    <td style={{ ...td, color: "#E8A84C" }}>₪{Number(r.actual_total || 0).toLocaleString()}</td>
                    <td style={td}>
                      <button onClick={async () => { await supabase.from("quantities").delete().eq("id", r.id); loadRows(); }}
                        style={{ ...btnMini, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>🗑</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

// ─── Timeline Tab ────────────────────────────────────────────────────────────
function TimelineTab({ projectId }) {
  const [milestones, setMilestones] = useState([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ title: "", due_date: "", status: "ממתין", notes: "" });

  useEffect(() => { loadMS(); }, [projectId]);

  const loadMS = async () => {
    const { data } = await supabase.from("milestones").select("*")
      .eq("project_id", projectId).order("due_date");
    if (data) setMilestones(data);
  };

  const addMS = async () => {
    await supabase.from("milestones").insert({ project_id: projectId, ...form });
    setAdding(false);
    setForm({ title: "", due_date: "", status: "ממתין", notes: "" });
    loadMS();
  };

  const updateStatus = async (id, status) => {
    await supabase.from("milestones").update({ status }).eq("id", id);
    loadMS();
  };

  const statusColor = (s) => ({ "הושלם": "#22c55e", "בביצוע": "#E8A84C", "ממתין": "#8B9DBS", "עיכוב": "#ef4444" })[s] || "#8B9DBS";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ color: "#E8A84C" }}>📅 אבני דרך</h3>
        <button onClick={() => setAdding(true)} style={btnPrimary}>+ הוסף אבן דרך</button>
      </div>

      {adding && (
        <div style={card}>
          <h4 style={{ color: "#E8A84C", marginBottom: "1rem" }}>➕ אבן דרך חדשה</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" }}>
            {[["כותרת", "title", "text"], ["תאריך יעד", "due_date", "date"]].map(([l, k, t]) => (
              <div key={k}>
                <label style={lbl}>{l}</label>
                <input type={t} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inp2} />
              </div>
            ))}
            <div>
              <label style={lbl}>סטטוס</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inp2}>
                {["ממתין", "בביצוע", "הושלם", "עיכוב"].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>הערות</label>
              <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={inp2} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button onClick={addMS} style={btnPrimary}>💾 שמור</button>
            <button onClick={() => setAdding(false)} style={btnSecondary}>ביטול</button>
          </div>
        </div>
      )}

      {milestones.length === 0 ? (
        <div style={{ ...card, textAlign: "center", color: "#8B9DBS", padding: "2rem" }}>אין אבני דרך עדיין</div>
      ) : milestones.map((m, i) => (
        <div key={m.id} style={{ ...card, borderRight: `4px solid ${statusColor(m.status)}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#E8E0D5", fontWeight: 600 }}>{m.title}</div>
              <div style={{ color: "#8B9DBS", fontSize: "0.8rem" }}>{m.due_date ? new Date(m.due_date).toLocaleDateString("he-IL") : "—"} {m.notes && `• ${m.notes}`}</div>
            </div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {["ממתין", "בביצוע", "הושלם", "עיכוב"].map(s => (
                <button key={s} onClick={() => updateStatus(m.id, s)} style={{
                  ...btnMini,
                  background: m.status === s ? `${statusColor(s)}33` : "rgba(255,255,255,0.06)",
                  color: m.status === s ? statusColor(s) : "#8B9DBS",
                  border: m.status === s ? `1px solid ${statusColor(s)}` : "1px solid transparent"
                }}>{s}</button>
              ))}
              <button onClick={async () => { await supabase.from("milestones").delete().eq("id", m.id); loadMS(); }}
                style={{ ...btnMini, background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>🗑</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Messages (WhatsApp) Tab ─────────────────────────────────────────────────
function MessagesTab({ project }) {
  const [phone, setPhone] = useState(project?.client_phone || "");
  const [msg, setMsg] = useState("");
  const [template, setTemplate] = useState("");

  const TEMPLATES = [
    { label: "עדכון התקדמות", text: `שלום,\nרצינו לעדכן אותך על התקדמות פרויקט "${project?.name}".\nסיימנו ${project?.progress || 0}% מהעבודה.\nשלב נוכחי: ${project?.phase || ""}.\nלשאלות נשמח לעמוד לרשותך.` },
    { label: "חריגת תקציב", text: `שלום,\nאנו רוצים להודיעך כי פרויקט "${project?.name}" מתקרב לגבול התקציב המאושר.\nאנא צור קשר בהקדם לתיאום המשך.` },
    { label: "סיום פרויקט", text: `שלום,\nאנו שמחים להודיע כי פרויקט "${project?.name}" הושלם!\nאנא תאם איתנו מועד לבדיקת עבודה.` },
    { label: "תזכורת תשלום", text: `שלום,\nזוהי תזכורת לגבי תשלום עבור פרויקט "${project?.name}".\nאנא בדוק את הפרטים הרלוונטיים.` },
  ];

  const sendWhatsApp = () => {
    const clean = phone.replace(/\D/g, "").replace(/^0/, "972");
    const encoded = encodeURIComponent(msg || template);
    window.open(`https://wa.me/${clean}?text=${encoded}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>💬 שליחת הודעת WhatsApp ללקוח</h3>
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>מספר טלפון לקוח</label>
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="05X-XXXXXXX" style={inp2} />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>תבנית הודעה מוכנה</label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {TEMPLATES.map(t => (
              <button key={t.label} onClick={() => setTemplate(t.text)} style={{
                ...btnSecondary,
                border: template === t.text ? "1px solid #E8A84C" : "1px solid rgba(255,255,255,0.1)",
                color: template === t.text ? "#E8A84C" : "#E8E0D5",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label style={lbl}>תוכן ההודעה</label>
          <textarea
            value={msg || template}
            onChange={e => setMsg(e.target.value)}
            rows={6}
            style={{ ...inp2, resize: "vertical", lineHeight: 1.6 }}
          />
        </div>
        <button
          onClick={sendWhatsApp}
          disabled={!phone || (!msg && !template)}
          style={{ ...btnPrimary, background: "linear-gradient(135deg, #25D366, #128C7E)", opacity: (!phone || (!msg && !template)) ? 0.5 : 1 }}
        >
          📲 שלח ב-WhatsApp
        </button>
        <div style={{ color: "#8B9DBS", fontSize: "0.8rem", marginTop: "0.75rem" }}>
          יפתח WhatsApp Web עם ההודעה המוכנה לשליחה
        </div>
      </div>
    </div>
  );
}

// ─── Shared Styles ───────────────────────────────────────────────────────────
const card = { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "1rem", padding: "1.25rem" };
const kpiMini = { background: "rgba(255,255,255,0.04)", borderRadius: "0.75rem", padding: "0.75rem" };
const td = { padding: "0.5rem 0.6rem", color: "#E8E0D5", fontSize: "0.85rem" };
const lbl = { fontSize: "0.82rem", color: "#E8A84C", fontWeight: 600, display: "block", marginBottom: "0.35rem" };
const inp2 = { width: "100%", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "0.75rem", padding: "0.6rem 0.9rem", color: "#E8E0D5", fontSize: "0.9rem", fontFamily: "'Assistant',sans-serif", outline: "none" };
const btnPrimary = { background: "linear-gradient(135deg,#E8A84C,#c8882c)", color: "#fff", border: "none", borderRadius: "0.75rem", padding: "0.6rem 1.5rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Assistant',sans-serif" };
const btnSecondary = { background: "rgba(255,255,255,0.07)", color: "#E8E0D5", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", padding: "0.6rem 1.2rem", fontWeight: 600, cursor: "pointer", fontFamily: "'Assistant',sans-serif" };
const btnMini = { padding: "0.3rem 0.6rem", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontSize: "0.8rem", fontFamily: "'Assistant',sans-serif" };

// ─── Main Export ─────────────────────────────────────────────────────────────
export default function ProjectDetail({ project, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [proj, setProj] = useState(project);

  const handleUpdate = (updated) => {
    setProj(updated);
    onUpdate?.(updated);
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif", color: "#E8E0D5" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');input,select,textarea{color-scheme:dark}`}</style>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#E8A84C", cursor: "pointer", fontSize: "0.9rem", marginBottom: "0.75rem", fontFamily: "'Assistant',sans-serif" }}>
          ← חזור לפרויקטים
        </button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.8rem", color: "#E8E0D5", marginBottom: "0.3rem" }}>{proj.name}</h1>
            <div style={{ color: "#8B9DBS", fontSize: "0.9rem" }}>
              {proj.client} · {proj.status} · {proj.phase}
            </div>
          </div>
          <button onClick={() => window.print()} style={btnSecondary}>🖨️ הדפס</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.25rem", marginBottom: "1.5rem", overflowX: "auto", borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: "0" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #E8A84C" : "2px solid transparent",
            color: activeTab === t.id ? "#E8A84C" : "#8B9DBS",
            padding: "0.6rem 1rem", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer",
            whiteSpace: "nowrap", fontFamily: "'Assistant',sans-serif",
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "overview" && <OverviewTab project={proj} onUpdate={handleUpdate} />}
      {activeTab === "invoices" && <InvoicesTab projectId={proj.id} />}
      {activeTab === "files" && <FilesTab projectId={proj.id} />}
      {activeTab === "quantities" && <QuantitiesTab projectId={proj.id} />}
      {activeTab === "timeline" && <TimelineTab projectId={proj.id} />}
      {activeTab === "messages" && <MessagesTab project={proj} />}
    </div>
  );
}