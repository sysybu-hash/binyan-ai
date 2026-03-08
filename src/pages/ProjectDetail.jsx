import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabase";

const GEMINI_KEY = "AIzaSyBGHRBPMN8vokpEfQYpO7ICNngZPKd5xwU";
const fmt = (n) => !n ? "₪0" : n >= 1000000 ? `₪${(n / 1000000).toFixed(2)}M` : `₪${Number(n).toLocaleString()}`;

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.2rem", padding: "1.2rem 1.5rem" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", outline: "none" };
const btnGold = { background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.6rem 1.2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif" };
const btnGhost = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.6rem 1.2rem", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif" };

const TABS = [
  { id: "overview", label: "סקירה כללית", icon: "⬡" },
  { id: "invoices", label: "חשבוניות", icon: "🧾" },
  { id: "files", label: "תוכניות מהנדס", icon: "📐" },
  { id: "quantities", label: "בינראית", icon: "⊞" },
  { id: "timeline", label: "לוח זמנים", icon: "📅" },
];

const STATUS_COLORS = { "פעיל": "#5CC98A", "סיכון": "#E0A84C", "חריגה": "#E05C5C", "הושלם": "#C9A84C", "מושהה": "#8B9DB5" };

// ── AI Analysis ──────────────────────────────────────────────────────────
async function analyzeWithGemini(file, type) {
  const base64 = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result.split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });

  const prompts = {
    invoice: 'Extract from this invoice. Reply ONLY in JSON: {"supplier":"...","amount":0,"date":"...","vat":0,"total_before_vat":0,"items":[{"desc":"...","qty":0,"unit_price":0,"total":0}],"invoice_number":"...","confidence":95}',
    blueprint: 'Analyze this construction blueprint. Reply ONLY in JSON: {"building_type":"...","area_sqm":0,"floors":0,"rooms":0,"width":0,"length":0,"height":0,"materials":[{"name":"...","quantity":0,"unit":"...","estimated_cost":0}],"total_estimated_cost":0,"notes":"...","confidence":90}',
    document: 'Analyze this construction document. Reply ONLY in JSON: {"doc_type":"...","summary":"...","key_points":["..."],"risks":["..."],"recommendations":["..."],"confidence":85}'
  };

  const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompts[type] }, { inline_data: { mime_type: file.type.startsWith("image") ? file.type : "application/pdf", data: base64 } }] }] })
  });
  const data = await resp.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ project, invoices, files, quantities }) {
  const totalInvoices = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const approvedInvoices = invoices.filter(i => i.status === "מאושר").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pendingInvoices = invoices.filter(i => i.status === "ממתין לאישור").length;
  const totalQty = quantities.reduce((s, q) => s + (q.actual * q.price), 0);
  const pct = project.budget > 0 ? Math.round(project.spent / project.budget * 100) : 0;
  const barColor = pct > 100 ? "#E05C5C" : pct >= 90 ? "#E0A84C" : "#C9A84C";

  const pieData = [
    { name: "בוצע", value: Number(project.spent) || 0, color: "#C9A84C" },
    { name: "נותר", value: Math.max(0, (Number(project.budget) || 0) - (Number(project.spent) || 0)), color: "rgba(255,255,255,0.08)" },
  ];

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      {/* KPI Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" }}>
        {[
          { icon: "💰", label: "תקציב מאושר", value: fmt(project.budget), color: "#C9A84C" },
          { icon: "📊", label: "הוצאות בפועל", value: fmt(project.spent), color: pct > 100 ? "#E05C5C" : "#5CC98A" },
          { icon: "🧾", label: "חשבוניות סה״כ", value: fmt(totalInvoices), color: "#B8C4D4" },
          { icon: "⏳", label: "ממתינות לאישור", value: pendingInvoices, color: pendingInvoices > 0 ? "#E0A84C" : "#5CC98A" },
          { icon: "📐", label: "תוכניות מהנדס", value: files.length, color: "#B8C4D4" },
          { icon: "📅", label: "ימים לסיום", value: project.days_left, color: project.days_left < 30 ? "#E05C5C" : "#5CC98A" },
        ].map(k => (
          <div key={k.label} style={{ ...card, padding: "1rem" }}>
            <div style={{ fontSize: "1.4rem", marginBottom: "0.3rem" }}>{k.icon}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.7rem", marginBottom: "0.2rem" }}>{k.label}</div>
            <div style={{ color: k.color, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Budget Bar + Pie */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: "1.2rem" }}>
        <div style={card}>
          <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1.2rem", fontWeight: 600 }}>ניצול תקציב</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "#8B9DB5", fontSize: "0.8rem" }}>{fmt(project.spent)} מתוך {fmt(project.budget)}</span>
            <span style={{ color: barColor, fontWeight: 700, fontSize: "0.9rem" }}>{pct}%</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "16px", overflow: "hidden", marginBottom: "1rem" }}>
            <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${barColor}88, ${barColor})`, borderRadius: "1rem", transition: "width 1s" }} />
          </div>
          {pct >= 90 && (
            <div style={{ background: pct > 100 ? "rgba(224,92,92,0.1)" : "rgba(224,168,76,0.1)", border: `1px solid ${pct > 100 ? "rgba(224,92,92,0.3)" : "rgba(224,168,76,0.3)"}`, borderRadius: "0.6rem", padding: "0.6rem 0.8rem", fontSize: "0.8rem", color: pct > 100 ? "#E05C5C" : "#E0A84C" }}>
              {pct > 100 ? "⚠️ חריגת תקציב! יש לבחון מיידית" : "⚡ קרוב לגבול התקציב — נדרש מעקב"}
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem", marginTop: "1rem" }}>
            <div style={{ background: "rgba(92,201,138,0.08)", borderRadius: "0.6rem", padding: "0.7rem" }}>
              <div style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>חשבוניות מאושרות</div>
              <div style={{ color: "#5CC98A", fontWeight: 700 }}>{fmt(approvedInvoices)}</div>
            </div>
            <div style={{ background: "rgba(201,168,76,0.08)", borderRadius: "0.6rem", padding: "0.7rem" }}>
              <div style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>יתרה לביצוע</div>
              <div style={{ color: "#C9A84C", fontWeight: 700 }}>{fmt(Math.max(0, project.budget - project.spent))}</div>
            </div>
          </div>
        </div>
        <div style={{ ...card, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "0.5rem", fontWeight: 600, alignSelf: "flex-start" }}>ביצוע</h3>
          <PieChart width={140} height={140}>
            <Pie data={pieData} cx={70} cy={70} innerRadius={45} outerRadius={65} paddingAngle={2} dataKey="value">
              {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
          </PieChart>
          <div style={{ color: "#C9A84C", fontSize: "2rem", fontWeight: 700, fontFamily: "'Playfair Display', serif", marginTop: "-0.5rem" }}>{project.progress}%</div>
          <div style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>אחוז ביצוע</div>
          <div style={{ marginTop: "0.8rem", padding: "0.4rem 0.8rem", background: `${STATUS_COLORS[project.status]}22`, borderRadius: "0.5rem", color: STATUS_COLORS[project.status], fontSize: "0.8rem", fontWeight: 600 }}>{project.status}</div>
        </div>
      </div>

      {/* Project Details */}
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>פרטי פרויקט</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          {[
            ["לקוח", project.client || "-"],
            ["שלב ביצוע", project.phase || "-"],
            ["סטטוס", project.status],
            ["ימים שנותרו", `${project.days_left} ימים`],
            ["תאריך עדכון", new Date(project.created_at).toLocaleDateString("he-IL")],
            ["מזהה פרויקט", project.id?.slice(0, 8) + "..."],
          ].map(([l, v]) => (
            <div key={l} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.6rem", padding: "0.7rem 0.9rem" }}>
              <div style={{ color: "#8B9DB5", fontSize: "0.7rem", marginBottom: "0.2rem" }}>{l}</div>
              <div style={{ color: "#E8E0D0", fontSize: "0.88rem", fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Invoices Tab ──────────────────────────────────────────────────────────
function InvoicesTab({ project, invoices, onRefresh }) {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanFile, setScanFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState(null);
  const fileRef = useRef();

  const handleScan = async (file) => {
    setScanFile(file);
    setScanning(true);
    setScanResult(null);
    try {
      const result = await analyzeWithGemini(file, "invoice");
      setScanResult(result);
    } catch {
      setScanResult({ supplier: "ספק לא זוהה", amount: 0, date: new Date().toLocaleDateString("he-IL"), items: [], confidence: 0, invoice_number: "-" });
    }
    setScanning(false);
  };

  const saveInvoice = async () => {
    if (!scanResult) return;
    setSaving(true);
    await supabase.from("invoices").insert([{
      project_id: project.id,
      supplier: scanResult.supplier,
      amount: scanResult.amount,
      date: scanResult.date,
      items: scanResult.items,
      status: "ממתין לאישור",
      ai_confidence: scanResult.confidence,
      invoice_number: scanResult.invoice_number,
    }]);
    setScanResult(null);
    setScanFile(null);
    onRefresh();
    setSaving(false);
  };

  const approveInvoice = async (id) => {
    setApproving(id);
    await supabase.from("invoices").update({ status: "מאושר", approved_by: "מנהל" }).eq("id", id);
    const inv = invoices.find(i => i.id === id);
    if (inv) await supabase.from("projects").update({ spent: (Number(project.spent) || 0) + Number(inv.amount) }).eq("id", project.id);
    onRefresh();
    setApproving(null);
  };

  const deleteInvoice = async (id) => {
    if (!window.confirm("למחוק חשבונית זו?")) return;
    await supabase.from("invoices").delete().eq("id", id);
    onRefresh();
  };

  const total = invoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const approved = invoices.filter(i => i.status === "מאושר").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pending = invoices.filter(i => i.status === "ממתין לאישור").length;

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[{ label: "סה״כ חשבוניות", value: fmt(total), color: "#C9A84C" }, { label: "מאושרות", value: fmt(approved), color: "#5CC98A" }, { label: "ממתינות לאישור", value: pending, color: pending > 0 ? "#E0A84C" : "#5CC98A" }].map(s => (
          <div key={s.label} style={{ ...card, textAlign: "center", padding: "1rem" }}>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginBottom: "0.3rem" }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Scanner */}
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>🤖 סריקת חשבונית עם AI</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "0.8rem", padding: "2rem", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: "2rem" }}>📄</div>
              <div style={{ color: "#C9A84C", fontSize: "0.82rem", marginTop: "0.3rem" }}>העלה חשבונית (PDF / תמונה)</div>
              {scanFile && <div style={{ color: "#5CC98A", fontSize: "0.75rem", marginTop: "0.4rem" }}>✅ {scanFile.name}</div>}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={e => handleScan(e.target.files[0])} />
            {scanning && <div style={{ textAlign: "center", color: "#C9A84C", padding: "1rem", fontSize: "0.85rem" }}>🔍 Gemini מנתח...</div>}
          </div>
          {scanResult && !scanning && (
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.8rem" }}>
                <span style={{ color: "#C9A84C", fontWeight: 600 }}>תוצאות סריקה</span>
                <span style={{ background: scanResult.confidence >= 90 ? "rgba(92,201,138,0.2)" : "rgba(224,168,76,0.2)", color: scanResult.confidence >= 90 ? "#5CC98A" : "#E0A84C", borderRadius: "0.4rem", padding: "0.1rem 0.5rem", fontSize: "0.7rem" }}>
                  דיוק: {scanResult.confidence}%
                </span>
              </div>
              {[["ספק", scanResult.supplier], ["סכום", `₪${Number(scanResult.amount).toLocaleString()}`], ["תאריך", scanResult.date], ["מס׳ חשבונית", scanResult.invoice_number]].map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.3rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.82rem" }}>
                  <span style={{ color: "#8B9DB5" }}>{l}</span>
                  <span style={{ color: "#E8E0D0", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
              {scanResult.confidence < 80 && (
                <div style={{ marginTop: "0.6rem", background: "rgba(224,168,76,0.1)", borderRadius: "0.5rem", padding: "0.5rem", fontSize: "0.75rem", color: "#E0A84C" }}>
                  ⚠️ דיוק נמוך — אמת ידנית לפני שמירה
                </div>
              )}
              <button onClick={saveInvoice} disabled={saving} style={{ ...btnGold, width: "100%", marginTop: "0.8rem" }}>
                {saving ? "שומר..." : "💾 שמור חשבונית"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invoices List */}
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>היסטוריית חשבוניות ({invoices.length})</h3>
        {invoices.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>אין חשבוניות עדיין — סרוק את הראשונה!</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                  {["ספק", "סכום", "תאריך", "מס׳ חשבונית", "דיוק AI", "סטטוס", "פעולות"].map(h => (
                    <th key={h} style={{ color: "#C9A84C", padding: "0.6rem 0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.7rem 0.5rem", color: "#E8E0D0", fontWeight: 500 }}>{inv.supplier}</td>
                    <td style={{ padding: "0.7rem 0.5rem", color: "#5CC98A", fontWeight: 700 }}>₪{Number(inv.amount).toLocaleString()}</td>
                    <td style={{ padding: "0.7rem 0.5rem", color: "#B8C4D4" }}>{inv.date}</td>
                    <td style={{ padding: "0.7rem 0.5rem", color: "#8B9DB5" }}>{inv.invoice_number || "-"}</td>
                    <td style={{ padding: "0.7rem 0.5rem" }}>
                      <span style={{ color: inv.ai_confidence >= 90 ? "#5CC98A" : inv.ai_confidence >= 70 ? "#E0A84C" : "#E05C5C", fontSize: "0.78rem" }}>
                        {inv.ai_confidence || "-"}%
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 0.5rem" }}>
                      <span style={{ background: inv.status === "מאושר" ? "rgba(92,201,138,0.15)" : "rgba(224,168,76,0.15)", color: inv.status === "מאושר" ? "#5CC98A" : "#E0A84C", borderRadius: "0.4rem", padding: "0.15rem 0.5rem", fontSize: "0.72rem", fontWeight: 600 }}>
                        {inv.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.7rem 0.5rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        {inv.status !== "מאושר" && (
                          <button onClick={() => approveInvoice(inv.id)} disabled={approving === inv.id} style={{ background: "rgba(92,201,138,0.1)", border: "1px solid rgba(92,201,138,0.2)", borderRadius: "0.4rem", color: "#5CC98A", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.72rem" }}>
                            {approving === inv.id ? "..." : "✅ אשר"}
                          </button>
                        )}
                        <button onClick={() => deleteInvoice(inv.id)} style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "0.4rem", color: "#E05C5C", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.72rem" }}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Files Tab ─────────────────────────────────────────────────────────────
function FilesTab({ project, files, onRefresh }) {
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);
  const [analysisResult, setAnalysisResult] = useState({});
  const fileRef = useRef();

  const uploadFile = async (file) => {
    setUploading(true);
    const category = file.name.toLowerCase().includes("חשמל") ? "חשמל" : file.name.toLowerCase().includes("אינסטל") ? "אינסטלציה" : file.name.toLowerCase().includes("קונ") ? "קונסטרוקציה" : "תוכנית";
    await supabase.from("project_files").insert([{
      project_id: project.id,
      name: file.name,
      type: file.type,
      size: file.size > 1024 * 1024 ? `${(file.size / 1024 / 1024).toFixed(1)} MB` : `${(file.size / 1024).toFixed(0)} KB`,
      uploaded_by: "מנהל",
      category,
      url: "#",
    }]);
    onRefresh();
    setUploading(false);
  };

  const analyzeFile = async (file, fileRecord) => {
    setAnalyzing(fileRecord.id);
    try {
      const type = file.name.includes("חשבונית") ? "invoice" : "blueprint";
      const result = await analyzeWithGemini(file, type);
      await supabase.from("project_files").update({ ai_analysis: JSON.stringify(result) }).eq("id", fileRecord.id);
      setAnalysisResult(prev => ({ ...prev, [fileRecord.id]: result }));
      onRefresh();
    } catch { }
    setAnalyzing(null);
  };

  const deleteFile = async (id) => {
    if (!window.confirm("למחוק קובץ זה?")) return;
    await supabase.from("project_files").delete().eq("id", id);
    onRefresh();
  };

  const CATEGORY_COLORS = { "תוכנית": "#C9A84C", "חשמל": "#5CC98A", "אינסטלציה": "#B8C4D4", "קונסטרוקציה": "#E0A84C" };

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>📐 העלאת תוכניות מהנדס</h3>
        <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "0.8rem", padding: "2.5rem", textAlign: "center", cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📁</div>
          <div style={{ color: "#C9A84C", fontWeight: 600, marginBottom: "0.3rem" }}>גרור קבצים לכאן או לחץ לבחירה</div>
          <div style={{ color: "#8B9DB5", fontSize: "0.78rem" }}>PDF, תמונות, DWG — תוכניות, חשמל, אינסטלציה</div>
          {uploading && <div style={{ color: "#5CC98A", marginTop: "0.5rem" }}>⏳ מעלה...</div>}
        </div>
        <input ref={fileRef} type="file" accept=".pdf,image/*,.dwg" multiple style={{ display: "none" }} onChange={e => Array.from(e.target.files).forEach(uploadFile)} />
      </div>

      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>תוכניות מהנדס ({files.length})</h3>
        {files.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>אין קבצים עדיין</div>
        ) : (
          <div style={{ display: "grid", gap: "0.8rem" }}>
            {files.map(f => {
              const analysis = analysisResult[f.id] || (f.ai_analysis ? JSON.parse(f.ai_analysis) : null);
              return (
                <div key={f.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ fontSize: "1.8rem" }}>{f.type?.includes("pdf") ? "📄" : "🖼️"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.88rem" }}>{f.name}</div>
                      <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.2rem" }}>
                        <span style={{ color: CATEGORY_COLORS[f.category] || "#C9A84C", fontSize: "0.72rem", background: `${CATEGORY_COLORS[f.category] || "#C9A84C"}22`, borderRadius: "0.3rem", padding: "0.1rem 0.4rem" }}>{f.category}</span>
                        <span style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{f.size}</span>
                        <span style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{new Date(f.created_at).toLocaleDateString("he-IL")}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <label style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.3rem 0.6rem", cursor: "pointer", fontSize: "0.75rem" }}>
                        🤖 {analyzing === f.id ? "מנתח..." : "נתח AI"}
                        <input type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => analyzeFile(e.target.files[0], f)} />
                      </label>
                      <button onClick={() => deleteFile(f.id)} style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "0.5rem", color: "#E05C5C", padding: "0.3rem 0.6rem", cursor: "pointer", fontSize: "0.75rem" }}>🗑️</button>
                    </div>
                  </div>
                  {analysis && (
                    <div style={{ marginTop: "0.8rem", background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.1)", borderRadius: "0.6rem", padding: "0.8rem" }}>
                      <div style={{ color: "#C9A84C", fontSize: "0.75rem", fontWeight: 600, marginBottom: "0.4rem" }}>🤖 ניתוח AI</div>
                      {analysis.building_type && <div style={{ color: "#B8C4D4", fontSize: "0.78rem" }}>סוג: {analysis.building_type} | שטח: {analysis.area_sqm} מ״ר | קומות: {analysis.floors}</div>}
                      {analysis.summary && <div style={{ color: "#B8C4D4", fontSize: "0.78rem" }}>{analysis.summary}</div>}
                      {analysis.total_estimated_cost > 0 && <div style={{ color: "#5CC98A", fontSize: "0.82rem", fontWeight: 600, marginTop: "0.3rem" }}>עלות מוערכת: {fmt(analysis.total_estimated_cost)}</div>}
                      {analysis.materials?.length > 0 && (
                        <div style={{ marginTop: "0.4rem" }}>
                          {analysis.materials.slice(0, 3).map((m, i) => <div key={i} style={{ color: "#8B9DB5", fontSize: "0.73rem" }}>• {m.name}: {m.quantity} {m.unit}</div>)}
                        </div>
                      )}
                      <div style={{ color: analysis.confidence >= 90 ? "#5CC98A" : "#E0A84C", fontSize: "0.7rem", marginTop: "0.3rem" }}>דיוק: {analysis.confidence}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Quantities Tab ────────────────────────────────────────────────────────
function QuantitiesTab({ project, quantities, onRefresh }) {
  const [newItem, setNewItem] = useState({ name: "", unit: "", contract: "", actual: "", price: "" });
  const [saving, setSaving] = useState(false);

  const addItem = async () => {
    if (!newItem.name) return;
    setSaving(true);
    await supabase.from("quantities").insert([{ project_id: project.id, ...newItem, contract: Number(newItem.contract), actual: Number(newItem.actual), price: Number(newItem.price) }]);
    setNewItem({ name: "", unit: "", contract: "", actual: "", price: "" });
    onRefresh();
    setSaving(false);
  };

  const updateActual = async (id, actual) => {
    await supabase.from("quantities").update({ actual: Number(actual) }).eq("id", id);
    onRefresh();
  };

  const deleteItem = async (id) => {
    await supabase.from("quantities").delete().eq("id", id);
    onRefresh();
  };

  const total = quantities.reduce((s, q) => s + (q.actual * q.price), 0);
  const totalContract = quantities.reduce((s, q) => s + (q.contract * q.price), 0);

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[{ label: "סה״כ חוזה", value: fmt(totalContract), color: "#C9A84C" }, { label: "סה״כ ביצוע", value: fmt(total), color: "#5CC98A" }, { label: "יתרה", value: fmt(totalContract - total), color: "#B8C4D4" }].map(s => (
          <div key={s.label} style={{ ...card, textAlign: "center", padding: "1rem" }}>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginBottom: "0.2rem" }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>כתב כמויות</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                {["סעיף", "יחידה", "כמות חוזה", "כמות ביצוע", "מחיר יחידה", "סה״כ", "%", ""].map(h => <th key={h} style={{ color: "#C9A84C", padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {quantities.map(q => {
                const pct = q.contract > 0 ? Math.round(q.actual / q.contract * 100) : 0;
                const color = pct > 100 ? "#E05C5C" : pct >= 90 ? "#E0A84C" : "#5CC98A";
                return (
                  <tr key={q.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.5rem", color: "#E8E0D0", fontWeight: 500 }}>{q.name}</td>
                    <td style={{ padding: "0.5rem", color: "#8B9DB5" }}>{q.unit}</td>
                    <td style={{ padding: "0.5rem", color: "#B8C4D4" }}>{q.contract}</td>
                    <td style={{ padding: "0.5rem" }}>
                      <input type="number" defaultValue={q.actual} onBlur={e => updateActual(q.id, e.target.value)} style={{ ...inputStyle, width: "70px", padding: "0.3rem 0.4rem" }} />
                    </td>
                    <td style={{ padding: "0.5rem", color: "#C9A84C" }}>₪{q.price}</td>
                    <td style={{ padding: "0.5rem", color: "#5CC98A", fontWeight: 600 }}>{fmt(q.actual * q.price)}</td>
                    <td style={{ padding: "0.5rem", minWidth: "80px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "5px" }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: "1rem" }} /></div>
                        <span style={{ color, fontSize: "0.7rem" }}>{pct}%</span>
                      </div>
                    </td>
                    <td style={{ padding: "0.5rem" }}>
                      <button onClick={() => deleteItem(q.id)} style={{ background: "none", border: "none", color: "#E05C5C", cursor: "pointer", fontSize: "0.8rem" }}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "1rem", display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          {[{ k: "name", p: "שם סעיף", w: "150px" }, { k: "unit", p: "יחידה", w: "70px" }, { k: "contract", p: "חוזה", t: "number", w: "80px" }, { k: "actual", p: "ביצוע", t: "number", w: "80px" }, { k: "price", p: "מחיר", t: "number", w: "90px" }].map(f => (
            <input key={f.k} type={f.t || "text"} placeholder={f.p} value={newItem[f.k]} onChange={e => setNewItem(n => ({ ...n, [f.k]: e.target.value }))} style={{ ...inputStyle, width: f.w }} />
          ))}
          <button onClick={addItem} disabled={saving} style={btnGold}>{saving ? "..." : "+ הוסף"}</button>
        </div>
      </div>
    </div>
  );
}

// ── Timeline Tab ──────────────────────────────────────────────────────────
function TimelineTab({ project }) {
  const milestones = [
    { name: "תכנון ואישורים", date: "01/2026", status: "הושלם", color: "#5CC98A" },
    { name: "יסודות", date: "02/2026", status: "הושלם", color: "#5CC98A" },
    { name: "שלד קומה א׳", date: "03/2026", status: "בביצוע", color: "#C9A84C" },
    { name: "שלד קומה ב׳", date: "04/2026", status: "מתוכנן", color: "#8B9DB5" },
    { name: "גמר פנים", date: "05/2026", status: "מתוכנן", color: "#8B9DB5" },
    { name: "מסירה", date: "06/2026", status: "מתוכנן", color: "#8B9DB5" },
  ];
  return (
    <div style={card}>
      <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1.5rem", fontWeight: 600 }}>לוח זמנים — אבני דרך</h3>
      <div style={{ position: "relative", paddingRight: "2rem" }}>
        <div style={{ position: "absolute", right: "0.65rem", top: 0, bottom: 0, width: "2px", background: "rgba(201,168,76,0.2)" }} />
        {milestones.map((m, i) => (
          <div key={i} style={{ position: "relative", marginBottom: "1.5rem", paddingRight: "1.5rem" }}>
            <div style={{ position: "absolute", right: "-1.35rem", top: "0.2rem", width: "14px", height: "14px", borderRadius: "50%", background: m.color, border: "2px solid #0D1B2E", boxShadow: `0 0 8px ${m.color}` }} />
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "0.8rem 1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.88rem" }}>{m.name}</span>
                <span style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>{m.date}</span>
              </div>
              <span style={{ color: m.color, fontSize: "0.72rem", marginTop: "0.2rem", display: "block" }}>{m.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Project Detail ───────────────────────────────────────────────────
export default function ProjectDetail({ project, onBack, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [invoices, setInvoices] = useState([]);
  const [files, setFiles] = useState([]);
  const [quantities, setQuantities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [inv, fil, qty] = await Promise.all([
      supabase.from("invoices").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
      supabase.from("project_files").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
      supabase.from("quantities").select("*").eq("project_id", project.id).order("created_at", { ascending: true }),
    ]);
    setInvoices(inv.data || []);
    setFiles(fil.data || []);
    setQuantities(qty.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [project.id]);

  const pct = project.budget > 0 ? Math.round(project.spent / project.budget * 100) : 0;

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={onBack} style={{ ...btnGhost, marginBottom: "1rem", fontSize: "0.8rem" }}>← חזרה לפרויקטים</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0", marginBottom: "0.3rem" }}>{project.name}</h1>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#8B9DB5", fontSize: "0.82rem" }}>👷 {project.client}</span>
              <span style={{ color: "#8B9DB5", fontSize: "0.82rem" }}>📍 {project.phase}</span>
              <span style={{ background: `${STATUS_COLORS[project.status]}22`, color: STATUS_COLORS[project.status], borderRadius: "0.4rem", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 }}>{project.status}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: "0.6rem" }}>
            <div style={{ ...card, padding: "0.6rem 1rem", textAlign: "center" }}>
              <div style={{ color: "#8B9DB5", fontSize: "0.65rem" }}>ביצוע</div>
              <div style={{ color: pct > 100 ? "#E05C5C" : "#C9A84C", fontWeight: 700, fontSize: "1.1rem" }}>{pct}%</div>
            </div>
            <div style={{ ...card, padding: "0.6rem 1rem", textAlign: "center" }}>
              <div style={{ color: "#8B9DB5", fontSize: "0.65rem" }}>ימים שנותרו</div>
              <div style={{ color: project.days_left < 30 ? "#E05C5C" : "#5CC98A", fontWeight: 700, fontSize: "1.1rem" }}>{project.days_left}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #C9A84C" : "2px solid transparent", color: activeTab === t.id ? "#C9A84C" : "#8B9DB5", padding: "0.6rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Assistant', sans-serif", fontWeight: activeTab === t.id ? 600 : 400, display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.id === "invoices" && invoices.filter(i => i.status === "ממתין לאישור").length > 0 && (
              <span style={{ background: "#E0A84C", color: "#0D1B2E", borderRadius: "1rem", padding: "0 0.4rem", fontSize: "0.65rem", fontWeight: 700 }}>{invoices.filter(i => i.status === "ממתין לאישור").length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#8B9DB5", padding: "3rem" }}>טוען נתוני פרויקט...</div>
      ) : (
        <>
          {activeTab === "overview" && <OverviewTab project={project} invoices={invoices} files={files} quantities={quantities} />}
          {activeTab === "invoices" && <InvoicesTab project={project} invoices={invoices} onRefresh={fetchAll} />}
          {activeTab === "files" && <FilesTab project={project} files={files} onRefresh={fetchAll} />}
          {activeTab === "quantities" && <QuantitiesTab project={project} quantities={quantities} onRefresh={fetchAll} />}
          {activeTab === "timeline" && <TimelineTab project={project} />}
        </>
      )}
    </div>
  );
}