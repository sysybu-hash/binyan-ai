import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.2rem", padding: "1.2rem 1.5rem" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", outline: "none", boxSizing: "border-box" };
const btnGold = { background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.6rem 1.2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif" };
const btnGhost = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Assistant', sans-serif" };

const GEMINI_KEY = "AIzaSyBGHRBPMN8vokpEfQYpO7ICNngZPKd5xwU";
const TABS = [
  { id: "health", label: "בדיקות מערכת", icon: "🔧" },
  { id: "company", label: "פרטי חברה", icon: "🏢" },
  { id: "print", label: "הדפסה", icon: "🖨️" },
];

// ── System Health ─────────────────────────────────────────────────────────
function HealthTab() {
  const [checks, setChecks] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState(null);

  const runChecks = async () => {
    setRunning(true);
    const results = [];

    // 1. Supabase connection
    try {
      const start = Date.now();
      const { data, error } = await supabase.from("projects").select("id").limit(1);
      const ms = Date.now() - start;
      results.push({ name: "Supabase — חיבור בסיס נתונים", status: error ? "fail" : "ok", detail: error ? error.message : `מחובר (${ms}ms)`, icon: "🗄️" });
    } catch (e) {
      results.push({ name: "Supabase — חיבור בסיס נתונים", status: "fail", detail: e.message, icon: "🗄️" });
    }

    // 2. Projects table
    try {
      const { count } = await supabase.from("projects").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת פרויקטים", status: "ok", detail: `${count} פרויקטים`, icon: "📋" });
    } catch (e) {
      results.push({ name: "טבלת פרויקטים", status: "fail", detail: e.message, icon: "📋" });
    }

    // 3. Workers table
    try {
      const { count } = await supabase.from("workers").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת עובדים", status: "ok", detail: `${count} עובדים`, icon: "👷" });
    } catch (e) {
      results.push({ name: "טבלת עובדים", status: "fail", detail: e.message, icon: "👷" });
    }

    // 4. Invoices table
    try {
      const { count } = await supabase.from("invoices").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת חשבוניות", status: "ok", detail: `${count} חשבוניות`, icon: "🧾" });
    } catch (e) {
      results.push({ name: "טבלת חשבוניות", status: "fail", detail: e.message, icon: "🧾" });
    }

    // 5. Quantities table
    try {
      const { count } = await supabase.from("quantities").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת כמויות (בינראית)", status: "ok", detail: `${count} סעיפים`, icon: "⊞" });
    } catch (e) {
      results.push({ name: "טבלת כמויות (בינראית)", status: "fail", detail: e.message, icon: "⊞" });
    }

    // 6. Workers assignments table
    try {
      const { count } = await supabase.from("worker_assignments").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת שיוכי עובדים", status: "ok", detail: `${count} שיוכים`, icon: "📍" });
    } catch (e) {
      results.push({ name: "טבלת שיוכי עובדים", status: "fail", detail: e.message, icon: "📍" });
    }

    // 7. Milestones table
    try {
      const { count } = await supabase.from("milestones").select("*", { count: "exact", head: true });
      results.push({ name: "טבלת אבני דרך", status: "ok", detail: `${count} אבני דרך`, icon: "🏁" });
    } catch (e) {
      results.push({ name: "טבלת אבני דרך", status: "fail", detail: e.message, icon: "🏁" });
    }

    // 8. Gemini AI
    try {
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply only: OK" }] }] })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);
      results.push({ name: "Gemini AI — מפתח API", status: "ok", detail: "API פעיל ✓", icon: "🤖" });
    } catch (e) {
      results.push({ name: "Gemini AI — מפתח API", status: "fail", detail: e.message, icon: "🤖" });
    }

    // 9. Browser print support
    results.push({
      name: "תמיכת הדפסה",
      status: window.print ? "ok" : "fail",
      detail: window.print ? "הדפסה זמינה" : "לא נתמך",
      icon: "🖨️"
    });

    // 10. Local storage
    try {
      localStorage.setItem("__test__", "1");
      localStorage.removeItem("__test__");
      results.push({ name: "אחסון מקומי (localStorage)", status: "ok", detail: "זמין", icon: "💾" });
    } catch (e) {
      results.push({ name: "אחסון מקומי (localStorage)", status: "fail", detail: "לא זמין", icon: "💾" });
    }

    setChecks(results);
    setLastRun(new Date().toLocaleTimeString("he-IL"));
    setRunning(false);
  };

  useEffect(() => { runChecks(); }, []);

  const okCount = checks.filter(c => c.status === "ok").length;
  const failCount = checks.filter(c => c.status === "fail").length;

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h2 style={{ color: "#E8E0D0", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem" }}>סטטוס מערכת</h2>
          {lastRun && <div style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>עדכון אחרון: {lastRun}</div>}
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          {checks.length > 0 && (
            <>
              <span style={{ color: "#5CC98A", fontSize: "0.85rem", fontWeight: 600 }}>✅ {okCount} תקין</span>
              {failCount > 0 && <span style={{ color: "#E05C5C", fontSize: "0.85rem", fontWeight: 600 }}>❌ {failCount} שגיאה</span>}
            </>
          )}
          <button onClick={runChecks} disabled={running} style={btnGold}>{running ? "⏳ בודק..." : "🔄 בדוק עכשיו"}</button>
        </div>
      </div>

      {/* Overall status bar */}
      {checks.length > 0 && (
        <div style={{ ...card, padding: "1rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>בריאות המערכת</span>
            <span style={{ color: "#C9A84C", fontSize: "0.75rem" }}>{Math.round(okCount / checks.length * 100)}%</span>
          </div>
          <div style={{ height: "8px", background: "rgba(255,255,255,0.07)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${okCount / checks.length * 100}%`, background: failCount === 0 ? "#5CC98A" : "#C9A84C", borderRadius: "4px", transition: "width 0.5s" }} />
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: "0.7rem" }}>
        {running && !checks.length && (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "3rem" }}>⏳ בודק את כל המערכות...</div>
        )}
        {checks.map((c, i) => (
          <div key={i} style={{ ...card, padding: "0.9rem 1.2rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderColor: c.status === "fail" ? "rgba(224,92,92,0.3)" : "rgba(255,255,255,0.07)" }}>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
              <span style={{ fontSize: "1.2rem" }}>{c.icon}</span>
              <div>
                <div style={{ color: "#E8E0D0", fontSize: "0.85rem", fontWeight: 500 }}>{c.name}</div>
                <div style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>{c.detail}</div>
              </div>
            </div>
            <span style={{
              background: c.status === "ok" ? "rgba(92,201,138,0.15)" : "rgba(224,92,92,0.15)",
              color: c.status === "ok" ? "#5CC98A" : "#E05C5C",
              borderRadius: "0.5rem", padding: "0.2rem 0.7rem", fontSize: "0.75rem", fontWeight: 600
            }}>
              {c.status === "ok" ? "✅ תקין" : "❌ שגיאה"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Company Settings ──────────────────────────────────────────────────────
function CompanyTab() {
  const defaultCompany = {
    name: "", legal_name: "", bn: "", address: "", city: "", phone: "", email: "",
    website: "", vat: "17", logo_url: "", bank_name: "", bank_branch: "", bank_account: "",
    manager_name: "", manager_phone: "", footer_text: ""
  };
  const [form, setForm] = useState(() => {
    try { return { ...defaultCompany, ...JSON.parse(localStorage.getItem("company_settings") || "{}") }; }
    catch { return defaultCompany; }
  });
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("company_settings", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const fields = [
    { section: "פרטי עסק", items: [
      { k: "name", label: "שם עסק / מותג", placeholder: "בנייה ירושלים בע״מ" },
      { k: "legal_name", label: "שם משפטי מלא", placeholder: "בנייה ירושלים בע״מ" },
      { k: "bn", label: "מספר עוסק / ח.פ", placeholder: "000000000" },
      { k: "vat", label: "מע״מ (%)", placeholder: "17", type: "number" },
    ]},
    { section: "כתובת ויצירת קשר", items: [
      { k: "address", label: "כתובת", placeholder: "רחוב הרצל 1" },
      { k: "city", label: "עיר", placeholder: "ירושלים" },
      { k: "phone", label: "טלפון", placeholder: "02-1234567" },
      { k: "email", label: "אימייל", placeholder: "office@company.co.il" },
      { k: "website", label: "אתר אינטרנט", placeholder: "www.company.co.il" },
    ]},
    { section: "מנהל אחראי", items: [
      { k: "manager_name", label: "שם מנהל", placeholder: "ישראל ישראלי" },
      { k: "manager_phone", label: "טלפון מנהל", placeholder: "050-0000000" },
    ]},
    { section: "פרטי בנק", items: [
      { k: "bank_name", label: "שם בנק", placeholder: "בנק לאומי" },
      { k: "bank_branch", label: "סניף", placeholder: "001" },
      { k: "bank_account", label: "מספר חשבון", placeholder: "12345678" },
    ]},
  ];

  return (
    <div style={{ display: "grid", gap: "1.5rem" }}>
      {fields.map(section => (
        <div key={section.section} style={card}>
          <h3 style={{ color: "#C9A84C", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem", borderBottom: "1px solid rgba(201,168,76,0.15)", paddingBottom: "0.5rem" }}>{section.section}</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.8rem" }}>
            {section.items.map(f => (
              <div key={f.k}>
                <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>{f.label}</label>
                <input type={f.type || "text"} value={form[f.k] || ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={inputStyle} placeholder={f.placeholder} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={card}>
        <h3 style={{ color: "#C9A84C", fontSize: "0.9rem", fontWeight: 600, marginBottom: "1rem" }}>טקסט תחתית (להדפסות)</h3>
        <textarea value={form.footer_text || ""} onChange={e => setForm(p => ({ ...p, footer_text: e.target.value }))} style={{ ...inputStyle, height: "80px", resize: "vertical" }} placeholder="כל הזכויות שמורות. תשלום תוך 30 יום..." />
      </div>

      <button onClick={save} style={{ ...btnGold, width: "100%", padding: "0.9rem" }}>
        {saved ? "✅ נשמר!" : "💾 שמור פרטי חברה"}
      </button>

      {/* Preview */}
      {form.name && (
        <div style={{ ...card, borderColor: "rgba(201,168,76,0.2)" }}>
          <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginBottom: "0.8rem" }}>תצוגה מקדימה — כותרת מסמכים:</div>
          <div style={{ background: "white", borderRadius: "0.5rem", padding: "1rem", color: "#333", fontSize: "0.82rem", direction: "rtl" }}>
            <div style={{ fontWeight: 700, fontSize: "1rem" }}>{form.name}</div>
            {form.legal_name && form.legal_name !== form.name && <div style={{ fontSize: "0.78rem", color: "#666" }}>{form.legal_name}</div>}
            {form.bn && <div>ח.פ / עוסק: {form.bn}</div>}
            {form.address && <div>{form.address}{form.city ? `, ${form.city}` : ""}</div>}
            {form.phone && <div>טל: {form.phone}</div>}
            {form.email && <div>אימייל: {form.email}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Print Tab ─────────────────────────────────────────────────────────────
function PrintTab({ projects }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [printType, setPrintType] = useState("project_summary");
  const [printing, setPrinting] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [quantities, setQuantities] = useState([]);

  const company = (() => {
    try { return JSON.parse(localStorage.getItem("company_settings") || "{}"); }
    catch { return {}; }
  })();

  useEffect(() => {
    if (!selectedProject) return;
    supabase.from("invoices").select("*").eq("project_id", selectedProject).then(({ data }) => setInvoices(data || []));
    supabase.from("quantities").select("*").eq("project_id", selectedProject).then(({ data }) => setQuantities(data || []));
  }, [selectedProject]);

  const project = projects.find(p => p.id === selectedProject);
  const fmt = (n) => !n ? "₪0" : `₪${Number(n).toLocaleString()}`;

  const doPrint = () => {
    if (!project) return;
    setPrinting(true);

    const companyHeader = `
      <div style="border-bottom:2px solid #C9A84C;padding-bottom:10px;margin-bottom:20px;display:flex;justify-content:space-between;direction:rtl">
        <div>
          <div style="font-size:18px;font-weight:bold">${company.name || "שם חברה"}</div>
          ${company.bn ? `<div>ח.פ: ${company.bn}</div>` : ""}
          ${company.address ? `<div>${company.address}${company.city ? ", " + company.city : ""}</div>` : ""}
          ${company.phone ? `<div>טל: ${company.phone}</div>` : ""}
        </div>
        <div style="text-align:left">
          <div style="font-size:12px;color:#666">תאריך הדפסה: ${new Date().toLocaleDateString("he-IL")}</div>
        </div>
      </div>`;

    let body = "";

    if (printType === "project_summary") {
      body = `
        <h2 style="color:#1a1a2e">סיכום פרויקט: ${project.name}</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">לקוח</td><td style="padding:6px;border:1px solid #ddd">${project.client || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">סטטוס</td><td style="padding:6px;border:1px solid #ddd">${project.status || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">שלב</td><td style="padding:6px;border:1px solid #ddd">${project.phase || "—"}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">תקציב</td><td style="padding:6px;border:1px solid #ddd">${fmt(project.budget)}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">הוצאות בפועל</td><td style="padding:6px;border:1px solid #ddd">${fmt(project.spent)}</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">התקדמות</td><td style="padding:6px;border:1px solid #ddd">${project.progress || 0}%</td></tr>
          <tr><td style="padding:6px;border:1px solid #ddd;font-weight:bold;background:#f5f5f5">ימים שנותרו</td><td style="padding:6px;border:1px solid #ddd">${project.days_left || "—"}</td></tr>
        </table>`;
    } else if (printType === "invoices") {
      const total = invoices.reduce((s, inv) => s + (Number(inv.amount) || 0), 0);
      body = `
        <h2>חשבוניות — ${project.name}</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f0f0f0">
            <th style="padding:8px;border:1px solid #ddd;text-align:right">ספק</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">מספר חשבונית</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">תאריך</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">סכום</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">סטטוס</th>
          </tr></thead>
          <tbody>
            ${invoices.map(inv => `<tr>
              <td style="padding:6px;border:1px solid #ddd">${inv.supplier || "—"}</td>
              <td style="padding:6px;border:1px solid #ddd">${inv.invoice_number || "—"}</td>
              <td style="padding:6px;border:1px solid #ddd">${inv.date || "—"}</td>
              <td style="padding:6px;border:1px solid #ddd;font-weight:bold">${fmt(inv.amount)}</td>
              <td style="padding:6px;border:1px solid #ddd">${inv.status || "—"}</td>
            </tr>`).join("")}
            <tr style="background:#f9f9f9;font-weight:bold">
              <td colspan="3" style="padding:8px;border:1px solid #ddd;text-align:right">סה״כ</td>
              <td style="padding:8px;border:1px solid #ddd">${fmt(total)}</td>
              <td style="padding:8px;border:1px solid #ddd"></td>
            </tr>
          </tbody>
        </table>`;
    } else if (printType === "quantities") {
      const totalContract = quantities.reduce((s, q) => s + (Number(q.contract) * Number(q.price) || 0), 0);
      const totalActual = quantities.reduce((s, q) => s + (Number(q.actual) * Number(q.price) || 0), 0);
      body = `
        <h2>כתב כמויות — ${project.name}</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f0f0f0">
            <th style="padding:8px;border:1px solid #ddd;text-align:right">סעיף</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">יחידה</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">חוזה</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">ביצוע</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">מחיר יחידה</th>
            <th style="padding:8px;border:1px solid #ddd;text-align:right">סה״כ חוזה</th>
          </tr></thead>
          <tbody>
            ${quantities.map(q => `<tr>
              <td style="padding:6px;border:1px solid #ddd">${q.name}</td>
              <td style="padding:6px;border:1px solid #ddd">${q.unit}</td>
              <td style="padding:6px;border:1px solid #ddd">${q.contract}</td>
              <td style="padding:6px;border:1px solid #ddd">${q.actual}</td>
              <td style="padding:6px;border:1px solid #ddd">${fmt(q.price)}</td>
              <td style="padding:6px;border:1px solid #ddd;font-weight:bold">${fmt(Number(q.contract) * Number(q.price))}</td>
            </tr>`).join("")}
            <tr style="background:#f9f9f9;font-weight:bold">
              <td colspan="5" style="padding:8px;border:1px solid #ddd;text-align:right">סה״כ חוזה</td>
              <td style="padding:8px;border:1px solid #ddd">${fmt(totalContract)}</td>
            </tr>
          </tbody>
        </table>`;
    }

    const footerText = company.footer_text || "";
    const html = `<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
      <style>body{font-family:Arial,sans-serif;padding:20px;color:#333;font-size:13px} h2{color:#1a1a2e} table{font-size:12px} @media print{body{padding:10px}}</style>
    </head><body>${companyHeader}${body}
    ${footerText ? `<div style="margin-top:30px;padding-top:10px;border-top:1px solid #ddd;font-size:11px;color:#888">${footerText}</div>` : ""}
    </body></html>`;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); setPrinting(false); }, 500);
  };

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", fontWeight: 600, marginBottom: "1rem" }}>🖨️ הדפסה למדפסת</h3>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>בחר פרויקט</label>
            <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={inputStyle}>
              <option value="">-- בחר פרויקט --</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.5rem" }}>סוג מסמך</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.5rem" }}>
              {[
                { id: "project_summary", label: "סיכום פרויקט", icon: "📋" },
                { id: "invoices", label: "רשימת חשבוניות", icon: "🧾" },
                { id: "quantities", label: "כתב כמויות", icon: "⊞" },
              ].map(t => (
                <button key={t.id} onClick={() => setPrintType(t.id)} style={{ background: printType === t.id ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.03)", border: `1px solid ${printType === t.id ? "rgba(201,168,76,0.5)" : "rgba(255,255,255,0.07)"}`, borderRadius: "0.6rem", color: printType === t.id ? "#C9A84C" : "#8B9DB5", padding: "0.7rem", cursor: "pointer", textAlign: "center", fontSize: "0.8rem", fontFamily: "'Assistant', sans-serif" }}>
                  <div style={{ fontSize: "1.2rem" }}>{t.icon}</div>
                  <div>{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <button onClick={doPrint} disabled={!selectedProject || printing} style={{ ...btnGold, width: "100%", padding: "0.9rem", opacity: !selectedProject ? 0.5 : 1 }}>
            {printing ? "פותח חלון הדפסה..." : "🖨️ הדפס עכשיו"}
          </button>
          <div style={{ color: "#8B9DB5", fontSize: "0.75rem", textAlign: "center" }}>
            יפתח חלון הדפסה עם כל מדפסות המחשב הזמינות
          </div>
        </div>
      </div>

      {!company.name && (
        <div style={{ ...card, borderColor: "rgba(224,164,76,0.3)", background: "rgba(224,164,76,0.05)" }}>
          <div style={{ color: "#E0A84C", fontSize: "0.85rem" }}>
            💡 טיפ: מלא פרטי חברה בלשונית "פרטי חברה" כדי שיופיעו בכותרת ההדפסות
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ────────────────────────────────────────────────────
export default function SettingsPage({ projects }) {
  const [activeTab, setActiveTab] = useState("health");

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0", marginBottom: "0.2rem" }}>הגדרות</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>בדיקות מערכת · פרטי חברה · הדפסה</div>
      </div>

      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #C9A84C" : "2px solid transparent", color: activeTab === t.id ? "#C9A84C" : "#8B9DB5", padding: "0.6rem 1.2rem", cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", fontWeight: activeTab === t.id ? 600 : 400, display: "flex", alignItems: "center", gap: "0.4rem", whiteSpace: "nowrap" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === "health" && <HealthTab />}
      {activeTab === "company" && <CompanyTab />}
      {activeTab === "print" && <PrintTab projects={projects} />}
    </div>
  );
}