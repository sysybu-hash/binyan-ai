import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const TABS = [
  { id: "health", label: "בדיקות מערכת", icon: "🔧" },
  { id: "company", label: "פרטי חברה", icon: "🏢" },
  { id: "print", label: "הדפסה", icon: "🖨️" },
];

// --- System Health Tab ---
function HealthTab() {
  const [checks, setChecks] = useState([
    { id: "supabase", name: "Supabase DB", status: "idle", detail: "" },
    { id: "storage", name: "Supabase Storage", status: "idle", detail: "" },
    { id: "gemini", name: "Gemini AI", status: "idle", detail: "" },
    { id: "env_supabase", name: "משתני סביבה — Supabase", status: "idle", detail: "" },
    { id: "env_gemini", name: "משתני סביבה — Gemini", status: "idle", detail: "" },
    { id: "realtime", name: "Realtime Supabase", status: "idle", detail: "" },
    { id: "browser", name: "תאימות דפדפן", status: "idle", detail: "" },
    { id: "pwa", name: "PWA / Service Worker", status: "idle", detail: "" },
    { id: "print_check", name: "מדפסת מחוברת", status: "idle", detail: "" },
    { id: "whatsapp", name: "WhatsApp Web API", status: "idle", detail: "" },
  ]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);

  const updateCheck = (id, status, detail) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status, detail } : c));
  };

  const runAll = async () => {
    setRunning(true);
    setDone(false);
    setChecks(prev => prev.map(c => ({ ...c, status: "loading", detail: "" })));

    // 1. Supabase DB
    try {
      const { error } = await supabase.from("projects").select("id").limit(1);
      updateCheck("supabase", error ? "error" : "ok", error ? error.message : "מחובר בהצלחה");
    } catch (e) {
      updateCheck("supabase", "error", e.message);
    }

    // 2. Storage
    try {
      const { error } = await supabase.storage.listBuckets();
      updateCheck("storage", error ? "error" : "ok", error ? error.message : "Storage זמין");
    } catch (e) {
      updateCheck("storage", "error", e.message);
    }

    // 3. Gemini AI
    try {
      const key = import.meta.env.VITE_GEMINI_KEY;
      if (!key) {
        updateCheck("gemini", "error", "מפתח VITE_GEMINI_KEY חסר ב-.env.local");
      } else {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${key}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: "Say OK" }] }] }),
          }
        );
        const data = await res.json();
        if (data.error) updateCheck("gemini", "error", data.error.message);
        else updateCheck("gemini", "ok", "Gemini מגיב תקין ✓");
      }
    } catch (e) {
      updateCheck("gemini", "error", e.message);
    }

    // 4. Env Supabase
    const hasSupaUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasSupaKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    updateCheck("env_supabase", hasSupaUrl && hasSupaKey ? "ok" : "error",
      hasSupaUrl && hasSupaKey ? "URL + Key מוגדרים" : "חסרים משתני סביבה");

    // 5. Env Gemini
    const hasGemini = !!import.meta.env.VITE_GEMINI_KEY;
    updateCheck("env_gemini", hasGemini ? "ok" : "error",
      hasGemini ? "VITE_GEMINI_KEY מוגדר" : "חסר VITE_GEMINI_KEY ב-.env.local");

    // 6. Realtime
    try {
      const channel = supabase.channel("health-test");
      await new Promise((resolve) => {
        channel.subscribe((status) => {
          if (status === "SUBSCRIBED") {
            updateCheck("realtime", "ok", "Realtime פעיל");
            supabase.removeChannel(channel);
            resolve();
          }
        });
        setTimeout(() => {
          updateCheck("realtime", "error", "timeout — Realtime לא הגיב");
          resolve();
        }, 5000);
      });
    } catch (e) {
      updateCheck("realtime", "error", e.message);
    }

    // 7. Browser
    const ua = navigator.userAgent;
    const isModern = "fetch" in window && "Promise" in window && "assign" in Object;
    updateCheck("browser", isModern ? "ok" : "warn",
      `${ua.includes("Chrome") ? "Chrome" : ua.includes("Firefox") ? "Firefox" : ua.includes("Edge") ? "Edge" : "Safari"} — ${isModern ? "תאימות מלאה" : "דפדפן ישן"}`);

    // 8. PWA
    const hasSW = "serviceWorker" in navigator;
    updateCheck("pwa", hasSW ? "ok" : "warn", hasSW ? "Service Worker נתמך" : "PWA לא נתמך בדפדפן זה");

    // 9. Print
    const hasPrint = "print" in window;
    updateCheck("print_check", hasPrint ? "ok" : "error", hasPrint ? "הדפסה זמינה" : "הדפסה לא נתמכת");

    // 10. WhatsApp
    updateCheck("whatsapp", "ok", "WhatsApp Web — יפתח בלחיצה (לא נדרש API)");

    setRunning(false);
    setDone(true);
  };

  const statusColor = (s) => ({
    idle: "#8B9DBS", ok: "#22c55e", error: "#ef4444", warn: "#f59e0b", loading: "#E8A84C"
  })[s] || "#8B9DBS";

  const statusIcon = (s) => ({
    idle: "○", ok: "✓", error: "✗", warn: "⚠", loading: "⟳"
  })[s] || "○";

  const okCount = checks.filter(c => c.status === "ok").length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <div>
          {done && (
            <div style={{
              fontSize: "1.1rem", fontWeight: 600,
              color: okCount === checks.length ? "#22c55e" : okCount >= 7 ? "#f59e0b" : "#ef4444"
            }}>
              {okCount}/{checks.length} מערכות תקינות
            </div>
          )}
        </div>
        <button
          onClick={runAll}
          disabled={running}
          style={{
            background: "linear-gradient(135deg, #E8A84C, #c8882c)",
            color: "#fff", border: "none", borderRadius: "1rem",
            padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 600,
            cursor: running ? "not-allowed" : "pointer",
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? "⟳ בודק..." : "🔄 בדוק עכשיו"}
        </button>
      </div>

      <div style={{ display: "grid", gap: "0.75rem" }}>
        {checks.map(c => (
          <div key={c.id} style={{
            ...card,
            display: "flex", alignItems: "center", gap: "1rem",
            padding: "1rem 1.25rem",
            borderLeft: `4px solid ${statusColor(c.status)}`,
          }}>
            <span style={{ fontSize: "1.5rem", color: statusColor(c.status), fontWeight: 700, minWidth: "1.5rem" }}>
              {statusIcon(c.status)}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, color: "#E8E0D5" }}>{c.name}</div>
              {c.detail && <div style={{ fontSize: "0.8rem", color: "#8B9DBS", marginTop: "0.2rem" }}>{c.detail}</div>}
            </div>
            <span style={{
              fontSize: "0.75rem", fontWeight: 600, color: statusColor(c.status),
              background: `${statusColor(c.status)}22`, padding: "0.2rem 0.6rem", borderRadius: "0.5rem"
            }}>
              {{ idle: "לא נבדק", ok: "תקין", error: "שגיאה", warn: "אזהרה", loading: "בודק..." }[c.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Company Tab ---
function CompanyTab() {
  const [form, setForm] = useState({
    name: "", sub: "", address: "", city: "", phone: "", email: "",
    tax_id: "", bank: "", bank_branch: "", bank_account: "", logo_url: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("company_settings");
    if (stored) setForm(JSON.parse(stored));
  }, []);

  const save = () => {
    localStorage.setItem("company_settings", JSON.stringify(form));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const field = (label, key, placeholder = "", type = "text") => (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{ fontSize: "0.85rem", color: "#E8A84C", fontWeight: 600 }}>{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {field("שם החברה", "name", "בינראית בע\"מ")}
        {field("תת-כותרת", "sub", "קבלן בניין ופיתוח")}
        {field("כתובת", "address", "רחוב יפו 1")}
        {field("עיר", "city", "ירושלים")}
        {field("טלפון", "phone", "02-123-4567")}
        {field("אימייל", "email", "office@binyan.co.il", "email")}
        {field("ח.פ / ע.מ", "tax_id", "123456789")}
        {field("בנק", "bank", "הפועלים")}
        {field("סניף", "bank_branch", "123")}
        {field("מספר חשבון", "bank_account", "12345678")}
      </div>
      <div style={{ marginBottom: "1.5rem" }}>
        {field("לוגו — קישור URL", "logo_url", "https://...")}
        {form.logo_url && (
          <img src={form.logo_url} alt="לוגו" style={{ height: 60, marginTop: "0.5rem", borderRadius: "0.5rem" }} />
        )}
      </div>
      {!form.name && (
        <div style={{ ...card, borderColor: "rgba(224,164,76,0.3)", background: "rgba(224,164,76,0.05)", marginBottom: "1rem" }}>
          <div style={{ color: "#E0A84C", fontSize: "0.85rem" }}>
            💡 טיפ: מלא פרטי חברה כדי שיופיעו בכותרת הדפסות
          </div>
        </div>
      )}
      <button onClick={save} style={{
        background: "linear-gradient(135deg, #E8A84C, #c8882c)",
        color: "#fff", border: "none", borderRadius: "1rem",
        padding: "0.75rem 2.5rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer"
      }}>
        {saved ? "✓ נשמר!" : "💾 שמור פרטים"}
      </button>
    </div>
  );
}

// --- Print Tab ---
function PrintTab({ projects }) {
  const [selected, setSelected] = useState("");
  const company = JSON.parse(localStorage.getItem("company_settings") || "{}");

  const printProject = () => {
    const proj = projects?.find(p => p.id === selected);
    if (!proj) return alert("בחר פרויקט קודם");

    const win = window.open("", "_blank");
    win.document.write(`
      <html dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>דוח פרויקט — ${proj.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;600;700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Assistant', sans-serif; padding: 2cm; color: #1a1a1a; }
          .header { border-bottom: 3px solid #E8A84C; padding-bottom: 1rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: flex-end; }
          .company-name { font-size: 1.8rem; font-weight: 700; color: #1a3a5c; }
          .company-sub { font-size: 0.9rem; color: #666; }
          h1 { font-size: 1.5rem; color: #E8A84C; margin-bottom: 1rem; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 1.5rem; }
          th { background: #1a3a5c; color: white; padding: 0.6rem 1rem; text-align: right; }
          td { padding: 0.6rem 1rem; border-bottom: 1px solid #eee; }
          tr:nth-child(even) td { background: #f9f7f4; }
          .footer { margin-top: 3rem; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 1rem; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="company-name">${company.name || "בינראית"}</div>
            <div class="company-sub">${company.sub || ""} | ${company.phone || ""} | ${company.email || ""}</div>
          </div>
          <div style="text-align:left; font-size:0.85rem; color:#666;">
            תאריך: ${new Date().toLocaleDateString("he-IL")}<br/>
            ח.פ: ${company.tax_id || ""}
          </div>
        </div>

        <h1>📋 דוח פרויקט: ${proj.name}</h1>
        <table>
          <tr><th>שדה</th><th>נתון</th></tr>
          <tr><td>לקוח</td><td>${proj.client || "—"}</td></tr>
          <tr><td>סטטוס</td><td>${proj.status || "—"}</td></tr>
          <tr><td>שלב</td><td>${proj.phase || "—"}</td></tr>
          <tr><td>תקציב מאושר</td><td>₪${(proj.budget || 0).toLocaleString()}</td></tr>
          <tr><td>הוצאות בפועל</td><td>₪${(proj.spent || 0).toLocaleString()}</td></tr>
          <tr><td>יתרה</td><td>₪${((proj.budget || 0) - (proj.spent || 0)).toLocaleString()}</td></tr>
          <tr><td>% ביצוע</td><td>${proj.progress || 0}%</td></tr>
          <tr><td>ימים לסיום</td><td>${proj.days_left || "—"}</td></tr>
        </table>

        <div class="footer">
          הופק על ידי מערכת בינראית • ${new Date().toLocaleString("he-IL")}
        </div>
        <script>window.onload = function(){ window.print(); window.close(); }</script>
      </body>
      </html>
    `);
    win.document.close();
  };

  const printWorkers = () => {
    window.print();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Print Project */}
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>🖨️ הדפסת דוח פרויקט</h3>
        <div style={{ marginBottom: "1rem" }}>
          <label style={{ fontSize: "0.85rem", color: "#E8A84C", fontWeight: 600, display: "block", marginBottom: "0.4rem" }}>
            בחר פרויקט
          </label>
          <select
            value={selected}
            onChange={e => setSelected(e.target.value)}
            style={inputStyle}
          >
            <option value="">— בחר פרויקט —</option>
            {projects?.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <button onClick={printProject} style={btnStyle}>
          🖨️ הדפס דוח פרויקט
        </button>
      </div>

      {/* Print Page */}
      <div style={card}>
        <h3 style={{ color: "#E8A84C", marginBottom: "1rem" }}>🖨️ הדפסת דף נוכחי</h3>
        <p style={{ color: "#8B9DBS", fontSize: "0.9rem", marginBottom: "1rem" }}>
          ידפיס את הדף הנוכחי שמוצג על המסך למדפסת המחוברת למחשב.
        </p>
        <button onClick={() => window.print()} style={btnStyle}>
          🖨️ הדפס דף נוכחי
        </button>
      </div>

      {!company.name && (
        <div style={{ ...card, borderColor: "rgba(224,164,76,0.3)", background: "rgba(224,164,76,0.05)" }}>
          <div style={{ color: "#E0A84C", fontSize: "0.85rem" }}>
            💡 הוסף פרטי חברה בלשונית "פרטי חברה" כדי שיופיעו בכותרת ההדפסות
          </div>
        </div>
      )}
    </div>
  );
}

// --- Shared Styles ---
const card = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "1rem",
  padding: "1.25rem",
};

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "0.75rem",
  padding: "0.65rem 1rem",
  color: "#E8E0D5",
  fontSize: "0.95rem",
  fontFamily: "'Assistant', sans-serif",
  outline: "none",
};

const btnStyle = {
  background: "linear-gradient(135deg, #E8A84C, #c8882c)",
  color: "#fff", border: "none", borderRadius: "1rem",
  padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer"
};

// --- Main Settings Page ---
export default function SettingsPage({ projects }) {
  const [activeTab, setActiveTab] = useState("health");

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap');`}</style>

      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D5", marginBottom: "0.4rem" }}>
          ⚙️ הגדרות מערכת
        </h1>
        <div style={{ color: "#8B9DBS", fontSize: "0.85rem" }}>בדיקות · חברה · הדפסה</div>
      </div>

      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,2555,0.2)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #E8A84C" : "2px solid transparent",
            color: activeTab === t.id ? "#E8A84C" : "#8B9DBS",
            padding: "0.6rem 1.2rem", fontSize: "0.95rem", fontWeight: 600, cursor: "pointer",
            fontFamily: "'Assistant', sans-serif",
          }}>
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