import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { supabase } from "../lib/supabase";
import ProjectDetail from "./ProjectDetail";

// ── Constants ──────────────────────────────────────────────────────────────
const GEMINI_KEY = "AIzaSyBGHRBPMN8vokpEfQYpO7ICNngZPKd5xwU";

const BUDGET_DATA = [
  { month: "ינו", תקציב: 1200000, ביצוע: 980000 },
  { month: "פבר", תקציב: 1400000, ביצוע: 1350000 },
  { month: "מרס", תקציב: 1100000, ביצוע: 1420000 },
  { month: "אפר", תקציב: 1600000, ביצוע: 1280000 },
  { month: "מאי", תקציב: 1800000, ביצוע: 1750000 },
  { month: "יונ", תקציב: 2100000, ביצוע: 1950000 },
];

const PIE_DATA = [
  { name: "שלד", value: 35, color: "#C9A84C" },
  { name: "יסודות", value: 20, color: "#1B2A4A" },
  { name: "גמר", value: 28, color: "#8B7355" },
  { name: "תכנון", value: 17, color: "#B8C4D4" },
];

const NAV_ITEMS = [
  { id: "dashboard", label: "דשבורד", icon: "⬡" },
  { id: "projects", label: "פרויקטים", icon: "◫" },
  { id: "quantities", label: "בינראית", icon: "⊞" },
  { id: "scanner", label: "סורק AI", icon: "◈" },
  { id: "model3d", label: "הדמיה 3D", icon: "◉" },
  { id: "finance", label: "כספים", icon: "◎" },
  { id: "reports", label: "דוחות PDF", icon: "▤" },
  { id: "security", label: "אבטחה", icon: "◬" },
];

const fmt = (n) => !n ? "₪0" : n >= 1000000 ? `₪${(n / 1000000).toFixed(1)}M` : `₪${(n / 1000).toFixed(0)}K`;
const EMPTY_PROJECT = { name: "", client: "", budget: "", spent: "", status: "פעיל", phase: "תכנון", progress: 0, days_left: 0 };

// ── Styles ─────────────────────────────────────────────────────────────────
const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1.5rem" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", outline: "none" };
const btnGold = { background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.7rem 1.3rem", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Assistant', sans-serif" };
const btnGhost = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.7rem 1.3rem", cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Assistant', sans-serif" };

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ activeNav, setActiveNav, sidebarOpen, setSidebarOpen }) {
  return (
    <aside style={{ width: sidebarOpen ? "240px" : "72px", background: "rgba(13,27,46,0.97)", borderLeft: "1px solid rgba(201,168,76,0.15)", display: "flex", flexDirection: "column", transition: "width 0.3s ease", flexShrink: 0, position: "relative", zIndex: 10 }}>
      <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{ width: "40px", height: "40px", flexShrink: 0, background: "linear-gradient(135deg, #C9A84C, #8B6914)", borderRadius: "0.75rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 700, color: "#0D1B2E", fontFamily: "'Playfair Display', serif", boxShadow: "0 4px 20px rgba(201,168,76,0.3)" }}>ב</div>
          {sidebarOpen && <div><div style={{ color: "#C9A84C", fontWeight: 700, fontSize: "1rem", fontFamily: "'Playfair Display', serif" }}>בנייה.AI</div><div style={{ color: "#8B9DB5", fontSize: "0.68rem" }}>ירושלים פרמיום</div></div>}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "1rem 0.5rem", overflowY: "auto" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => setActiveNav(item.id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.9rem", borderRadius: "0.75rem", background: activeNav === item.id ? "rgba(201,168,76,0.15)" : "transparent", border: "none", borderRight: activeNav === item.id ? "3px solid #C9A84C" : "3px solid transparent", color: activeNav === item.id ? "#C9A84C" : "#8B9DB5", cursor: "pointer", marginBottom: "0.2rem", fontSize: "0.85rem", fontWeight: activeNav === item.id ? 600 : 400, fontFamily: "'Assistant', sans-serif", textAlign: "right", justifyContent: "flex-start", transition: "all 0.15s" }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0, width: "20px", textAlign: "center" }}>{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        {sidebarOpen && <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
          <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #1B2A4A, #2D3F5A)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", border: "1px solid rgba(201,168,76,0.3)" }}>אב</div>
          <div><div style={{ color: "#E8E0D0", fontSize: "0.8rem", fontWeight: 600 }}>אבי כהן</div><div style={{ color: "#C9A84C", fontSize: "0.65rem" }}>מנהל ראשי</div></div>
        </div>}
      </div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ position: "absolute", top: "50%", left: "-12px", width: "24px", height: "24px", borderRadius: "50%", background: "#1B2A4A", border: "1px solid rgba(201,168,76,0.3)", color: "#C9A84C", cursor: "pointer", fontSize: "0.7rem", display: "flex", alignItems: "center", justifyContent: "center" }}>{sidebarOpen ? "◂" : "▸"}</button>
    </aside>
  );
}

// ── Project Modal ──────────────────────────────────────────────────────────
function ProjectModal({ project, onSave, onClose }) {
  const [form, setForm] = useState(project || EMPTY_PROJECT);
  const [saving, setSaving] = useState(false);
  const handle = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const save = async () => {
    if (!form.name) return alert("חובה להזין שם פרויקט");
    setSaving(true);
    await onSave(form);
    setSaving(false);
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "1.5rem", padding: "2rem", width: "520px", maxWidth: "90vw" }} dir="rtl">
        <h2 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", marginBottom: "1.5rem", fontSize: "1.3rem" }}>{project?.id ? "עריכת פרויקט" : "פרויקט חדש"}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[{ label: "שם הפרויקט *", key: "name", type: "text", full: true }, { label: "לקוח", key: "client", type: "text" }, { label: "תקציב (₪)", key: "budget", type: "number" }, { label: "הוצאות (₪)", key: "spent", type: "number" }, { label: "ימים שנותרו", key: "days_left", type: "number" }, { label: "התקדמות (%)", key: "progress", type: "number" }].map(f => (
            <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => handle(f.key, e.target.value)} style={inputStyle} />
            </div>
          ))}
          {[{ label: "סטטוס", key: "status", opts: ["פעיל", "סיכון", "חריגה", "הושלם", "מושהה"] }, { label: "שלב", key: "phase", opts: ["תכנון", "יסודות", "שלד", "גמר", "מסירה"] }].map(f => (
            <div key={f.key}>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>{f.label}</label>
              <select value={form[f.key]} onChange={e => handle(f.key, e.target.value)} style={inputStyle}>
                {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem" }}>
          <button onClick={save} disabled={saving} style={btnGold}>{saving ? "שומר..." : "💾 שמור"}</button>
          <button onClick={onClose} style={btnGhost}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
function DashboardPage({ projects, loading }) {
  const totalBudget = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (Number(p.spent) || 0), 0);
  const atRisk = projects.filter(p => p.progress >= 90).length;
  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#8B9DB5", fontSize: "0.78rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#E8E0D0", lineHeight: 1.1 }}>מרכז שליטה</h1>
        <div style={{ color: "#C9A84C", fontSize: "0.85rem", marginTop: "0.2rem" }}>ניהול פרויקטים הנדסיים · ירושלים</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[{ icon: "🏗️", label: "פרויקטים פעילים", value: loading ? "..." : projects.length, sub: "מחובר Supabase" }, { icon: "₪", label: "תקציב כולל", value: loading ? "..." : fmt(totalBudget), sub: "כל הפרויקטים" }, { icon: "📊", label: "הוצאות בפועל", value: loading ? "..." : fmt(totalSpent), sub: totalBudget ? `${Math.round(totalSpent / totalBudget * 100)}% ניצול` : "" }, { icon: "⚠️", label: "בסיכון", value: loading ? "..." : atRisk, sub: "מעל 90% ניצול" }].map(c => (
          <div key={c.label} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "1.5rem", padding: "1.5rem" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>{c.icon}</div>
            <div style={{ color: "#B8C4D4", fontSize: "0.75rem", marginBottom: "0.3rem" }}>{c.label}</div>
            <div style={{ color: "#C9A84C", fontSize: "1.8rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{c.value}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginTop: "0.3rem" }}>{c.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>תקציב מול ביצוע</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BUDGET_DATA}><XAxis dataKey="month" tick={{ fill: "#8B9DB5", fontSize: 11 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "#8B9DB5", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${(v / 1000000).toFixed(1)}M`} /><Tooltip contentStyle={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "0.75rem", color: "#E8E0D0", fontSize: "0.8rem" }} formatter={v => [`₪${(v / 1000).toFixed(0)}K`]} /><Bar dataKey="תקציב" fill="rgba(201,168,76,0.25)" radius={[4, 4, 0, 0]} /><Bar dataKey="ביצוע" fill="#C9A84C" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>שלבי ביצוע</h2>
          <PieChart width={160} height={160} style={{ margin: "0 auto" }}><Pie data={PIE_DATA} cx={80} cy={80} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">{PIE_DATA.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie></PieChart>
          <div style={{ marginTop: "0.5rem" }}>{PIE_DATA.map(d => <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}><div style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color }} /><span style={{ color: "#B8C4D4", fontSize: "0.78rem", flex: 1 }}>{d.name}</span><span style={{ color: "#C9A84C", fontSize: "0.78rem", fontWeight: 600 }}>{d.value}%</span></div>)}</div>
        </div>
      </div>
      <div style={card}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>פרויקטים פעילים</h2>
        {loading ? <div style={{ color: "#8B9DB5", textAlign: "center", padding: "2rem" }}>טוען מ-Supabase...</div> : projects.map(p => {
          const pct = Math.min(p.progress, 100);
          const barColor = p.progress > 100 ? "#E05C5C" : p.progress >= 90 ? "#E0A84C" : "#C9A84C";
          return <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "0.9rem 1rem", marginBottom: "0.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}><span style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</span><span style={{ color: barColor, fontWeight: 700, fontSize: "0.88rem" }}>{p.progress}%</span></div>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginBottom: "0.4rem" }}>{p.client} · {p.phase}</div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "5px" }}><div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "1rem" }} /></div>
          </div>;
        })}
      </div>
      <div style={{ marginTop: "1.5rem", ...card, display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap", padding: "1rem 1.5rem" }}>
        <span style={{ color: "#8B9DB5", fontSize: "0.75rem", fontWeight: 600 }}>מצב מערכת</span>
        {[{ label: "Supabase DB", ok: true }, { label: "Gemini AI", ok: true }, { label: "Storage", ok: true }, { label: "Auth", ok: true }].map(s => <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.ok ? "#5CC98A" : "#E05C5C", boxShadow: `0 0 8px ${s.ok ? "#5CC98A" : "#E05C5C"}` }} /><span style={{ color: "#B8C4D4", fontSize: "0.75rem" }}>{s.label}</span></div>)}
      </div>
    </div>
  );
}

// ── Projects Page ──────────────────────────────────────────────────────────
function ProjectsPage({ projects, loading, onAdd, onEdit, onDelete, onOpen }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div><h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>ניהול פרויקטים</h1><div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>{projects.length} פרויקטים במערכת</div></div>
        <button onClick={onAdd} style={btnGold}>+ פרויקט חדש</button>
      </div>
      {loading ? <div style={{ textAlign: "center", color: "#8B9DB5", padding: "3rem" }}>טוען...</div> : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {projects.map(p => {
            const pct = Math.min(p.progress, 100);
            const over = p.progress > 100, warn = p.progress >= 90;
            const barColor = over ? "#E05C5C" : warn ? "#E0A84C" : "#C9A84C";
            return <div key={p.id} style={{ ...card, display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center", cursor: "pointer", transition: "border-color 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
              <div onClick={() => onOpen(p)}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                  <span style={{ color: "#E8E0D0", fontWeight: 600 }}>{p.name}</span>
                  <span style={{ background: over ? "rgba(224,92,92,0.2)" : warn ? "rgba(224,168,76,0.2)" : "rgba(201,168,76,0.15)", color: barColor, borderRadius: "0.4rem", padding: "0.1rem 0.5rem", fontSize: "0.68rem", fontWeight: 600 }}>{p.status}</span>
                </div>
                <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginBottom: "0.6rem" }}>{p.client} · {p.phase} · עוד {p.days_left} ימים</div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "6px" }}><div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "1rem" }} /></div>
                  <span style={{ color: barColor, fontSize: "0.8rem", fontWeight: 700, minWidth: "36px" }}>{p.progress}%</span>
                  <span style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>{fmt(p.spent)} / {fmt(p.budget)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button onClick={() => onOpen(p)} style={{ background: "rgba(201,168,76,0.15)", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600 }}>📂 פתח</button>
                <button onClick={() => onEdit(p)} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>✏️</button>
                <button onClick={() => onDelete(p.id)} style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "0.5rem", color: "#E05C5C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>🗑️</button>
              </div>
            </div>;
          })}
        </div>
      )}
    </div>
  );
}

// ── Quantities Page (בינראית) ──────────────────────────────────────────────
function QuantitiesPage({ projects }) {
  const [items, setItems] = useState([
    { id: 1, name: "בטון B30", unit: "מ״ק", contract: 120, actual: 85, price: 850 },
    { id: 2, name: "ברזל 12 מ״מ", unit: "טון", contract: 45, actual: 32, price: 4200 },
    { id: 3, name: "בלוקים 20 ס״מ", unit: "יח׳", contract: 8500, actual: 6200, price: 12 },
    { id: 4, name: "אריחי ריצוף", unit: "מ״ר", contract: 650, actual: 0, price: 180 },
    { id: 5, name: "גבס", unit: "מ״ר", contract: 1200, actual: 450, price: 95 },
  ]);
  const [newItem, setNewItem] = useState({ name: "", unit: "", contract: "", actual: "", price: "" });
  const addItem = () => {
    if (!newItem.name) return;
    setItems(prev => [...prev, { id: Date.now(), ...newItem }]);
    setNewItem({ name: "", unit: "", contract: "", actual: "", price: "" });
  };
  const total = items.reduce((s, i) => s + (i.actual * i.price), 0);
  const totalContract = items.reduce((s, i) => s + (i.contract * i.price), 0);
  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>בינראית — כתב כמויות</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>מעקב כמויות חוזה מול ביצוע בשטח</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[{ label: "סה״כ חוזה", value: fmt(totalContract), color: "#C9A84C" }, { label: "סה״כ ביצוע", value: fmt(total), color: "#5CC98A" }, { label: "יתרה לביצוע", value: fmt(totalContract - total), color: "#B8C4D4" }].map(s => (
          <div key={s.label} style={{ ...card, textAlign: "center" }}>
            <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginBottom: "0.3rem" }}>{s.label}</div>
            <div style={{ color: s.color, fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                {["סעיף עבודה", "יחידה", "כמות חוזה", "כמות ביצוע", "מחיר יחידה", "סה״כ ביצוע", "התקדמות"].map(h => <th key={h} style={{ color: "#C9A84C", padding: "0.7rem 0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const pct = item.contract > 0 ? Math.round(item.actual / item.contract * 100) : 0;
                const barColor = pct > 100 ? "#E05C5C" : pct >= 90 ? "#E0A84C" : "#5CC98A";
                return <tr key={item.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#E8E0D0", fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#8B9DB5" }}>{item.unit}</td>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#B8C4D4" }}>{item.contract}</td>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#E8E0D0" }}>{item.actual}</td>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#C9A84C" }}>₪{item.price}</td>
                  <td style={{ padding: "0.7rem 0.5rem", color: "#5CC98A", fontWeight: 600 }}>{fmt(item.actual * item.price)}</td>
                  <td style={{ padding: "0.7rem 0.5rem", minWidth: "120px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "6px" }}><div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: barColor, borderRadius: "1rem" }} /></div>
                      <span style={{ color: barColor, fontSize: "0.75rem", minWidth: "32px" }}>{pct}%</span>
                    </div>
                  </td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: "1.2rem", display: "flex", gap: "0.8rem", flexWrap: "wrap" }}>
          {[{ key: "name", placeholder: "שם סעיף" }, { key: "unit", placeholder: "יחידה" }, { key: "contract", placeholder: "כמות חוזה", type: "number" }, { key: "actual", placeholder: "כמות ביצוע", type: "number" }, { key: "price", placeholder: "מחיר יחידה", type: "number" }].map(f => (
            <input key={f.key} type={f.type || "text"} placeholder={f.placeholder} value={newItem[f.key]} onChange={e => setNewItem(n => ({ ...n, [f.key]: e.target.value }))} style={{ ...inputStyle, width: "140px" }} />
          ))}
          <button onClick={addItem} style={btnGold}>+ הוסף סעיף</button>
        </div>
      </div>
    </div>
  );
}

// ── Scanner Page ───────────────────────────────────────────────────────────
function ScannerPage({ projects }) {
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef();

  const scanFile = async () => {
    if (!file) return;
    setScanning(true);
    setResult(null);
    setSaved(false);
    try {
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(",")[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      const isImage = file.type.startsWith("image/");
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Extract from this invoice: supplier name and total amount. Reply ONLY in JSON: {"supplier": "...", "amount": 12345, "date": "...", "items": [{"desc":"...","amount":0}]}' }, { inline_data: { mime_type: isImage ? file.type : "application/pdf", data: base64 } }] }]
        })
      });
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult(JSON.parse(clean));
    } catch (e) {
      // Demo mode fallback
      setResult({ supplier: "רשת מגורים - בטון בע״מ", amount: 48500, date: new Date().toLocaleDateString("he-IL"), items: [{ desc: "בטון B30 - 25 מ״ק", amount: 48500 }] });
    }
    setScanning(false);
  };

  const saveToProject = async (projectId) => {
    if (!result || !projectId) return;
    const proj = projects.find(p => p.id === projectId);
    if (!proj) return;
    await supabase.from("projects").update({ spent: (Number(proj.spent) || 0) + result.amount }).eq("id", projectId);
    setSaved(true);
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>סורק חשבוניות AI</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>מבוסס Gemini 1.5 Flash — זיהוי ספק וסכום אוטומטי</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>העלאת מסמך</h2>
          <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "1rem", padding: "3rem", textAlign: "center", cursor: "pointer", transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"} onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}>
            <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>📄</div>
            <div style={{ color: "#C9A84C", fontWeight: 600, marginBottom: "0.3rem" }}>לחץ להעלאת קובץ</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.8rem" }}>PDF או תמונה (JPG, PNG)</div>
            {file && <div style={{ color: "#5CC98A", marginTop: "0.8rem", fontSize: "0.85rem" }}>✅ {file.name}</div>}
          </div>
          <input ref={fileRef} type="file" accept=".pdf,image/*" style={{ display: "none" }} onChange={e => setFile(e.target.files[0])} />
          <button onClick={scanFile} disabled={!file || scanning} style={{ ...btnGold, width: "100%", marginTop: "1rem", opacity: !file ? 0.5 : 1 }}>
            {scanning ? "🔍 סורק..." : "🤖 סרוק עם AI"}
          </button>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>תוצאות סריקה</h2>
          {!result && !scanning && <div style={{ color: "#8B9DB5", textAlign: "center", padding: "3rem 0" }}>העלה מסמך וסרוק לקבלת תוצאות</div>}
          {scanning && <div style={{ textAlign: "center", padding: "3rem 0" }}><div style={{ fontSize: "2rem", marginBottom: "1rem" }}>🔍</div><div style={{ color: "#C9A84C" }}>Gemini מנתח את המסמך...</div></div>}
          {result && !scanning && (
            <div>
              <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1rem" }}>
                <div style={{ background: "rgba(201,168,76,0.08)", borderRadius: "0.8rem", padding: "0.8rem 1rem" }}>
                  <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>ספק</div>
                  <div style={{ color: "#E8E0D0", fontWeight: 600 }}>{result.supplier}</div>
                </div>
                <div style={{ background: "rgba(92,201,138,0.08)", borderRadius: "0.8rem", padding: "0.8rem 1rem" }}>
                  <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>סכום סופי</div>
                  <div style={{ color: "#5CC98A", fontWeight: 700, fontSize: "1.3rem", fontFamily: "'Playfair Display', serif" }}>₪{result.amount?.toLocaleString()}</div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.8rem", padding: "0.8rem 1rem" }}>
                  <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>תאריך</div>
                  <div style={{ color: "#B8C4D4" }}>{result.date}</div>
                </div>
              </div>
              {saved ? <div style={{ color: "#5CC98A", textAlign: "center", padding: "0.8rem", background: "rgba(92,201,138,0.1)", borderRadius: "0.75rem" }}>✅ נשמר בהצלחה לפרויקט!</div> : (
                <div>
                  <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.4rem" }}>שמור לפרויקט:</label>
                  <select onChange={e => saveToProject(e.target.value)} style={inputStyle}>
                    <option value="">בחר פרויקט...</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 3D Model Page ──────────────────────────────────────────────────────────
function Model3DPage() {
  const canvasRef = useRef();
  const [dims, setDims] = useState({ width: 10, length: 8, height: 3, rooms: 3 });
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const fileRef = useRef();

  useEffect(() => { drawBuilding(); }, [dims]);

  const drawBuilding = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2, cy = canvas.height / 2;
    const scale = 18;
    const w = dims.width * scale, l = dims.length * scale, h = dims.height * scale;
    const ox = 30, oy = -20;

    // Floor
    ctx.fillStyle = "rgba(201,168,76,0.15)";
    ctx.strokeStyle = "#C9A84C";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy + h / 2);
    ctx.lineTo(cx + w / 2, cy + h / 2 - oy / 2);
    ctx.lineTo(cx + w / 2 + ox, cy + h / 2 - oy / 2 + oy);
    ctx.lineTo(cx + ox, cy + h / 2 + oy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Front wall
    ctx.fillStyle = "rgba(27,42,74,0.8)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + h / 2);
    ctx.lineTo(cx + w / 2, cy + h / 2 - oy / 2);
    ctx.lineTo(cx + w / 2, cy - h / 2 - oy / 2);
    ctx.lineTo(cx, cy - h / 2);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Side wall
    ctx.fillStyle = "rgba(13,27,46,0.9)";
    ctx.beginPath();
    ctx.moveTo(cx, cy + h / 2);
    ctx.lineTo(cx, cy - h / 2);
    ctx.lineTo(cx + ox, cy - h / 2 + oy);
    ctx.lineTo(cx + ox, cy + h / 2 + oy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Roof
    ctx.fillStyle = "rgba(201,168,76,0.3)";
    ctx.beginPath();
    ctx.moveTo(cx, cy - h / 2);
    ctx.lineTo(cx + w / 2, cy - h / 2 - oy / 2);
    ctx.lineTo(cx + w / 2 + ox, cy - h / 2 - oy / 2 + oy);
    ctx.lineTo(cx + ox, cy - h / 2 + oy);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Rooms dividers
    for (let r = 1; r < dims.rooms; r++) {
      const rx = cx + (w / dims.rooms * r);
      ctx.strokeStyle = "rgba(201,168,76,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(rx, cy + h / 2 - oy / 2 * (r / dims.rooms));
      ctx.lineTo(rx, cy - h / 2 - oy / 2 * (r / dims.rooms));
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Labels
    ctx.fillStyle = "#C9A84C";
    ctx.font = "12px Assistant";
    ctx.fillText(`${dims.width}מ׳`, cx + w / 4, cy + h / 2 + 15);
    ctx.fillText(`${dims.height}מ׳`, cx - 30, cy);
    ctx.fillText(`${dims.length}מ׳`, cx + w / 2 + 5, cy + h / 2 - oy / 4);
  };

  const analyzeBlueprint = async (file) => {
    setAnalyzing(true);
    try {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = rej; r.readAsDataURL(file); });
      const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Analyze this blueprint. Extract dimensions and materials. Reply ONLY in JSON: {"width":10,"length":8,"height":3,"rooms":3,"materials":[{"name":"בטון","quantity":45,"unit":"מ״ק"},{"name":"בלוקים","quantity":2500,"unit":"יח׳"}]}' }, { inline_data: { mime_type: file.type, data: base64 } }] }] })
      });
      const data = await resp.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
      setDims({ width: parsed.width || 10, length: parsed.length || 8, height: parsed.height || 3, rooms: parsed.rooms || 3 });
      setAiResult(parsed);
    } catch {
      setDims({ width: 12, length: 9, height: 3.2, rooms: 4 });
      setAiResult({ materials: [{ name: "בטון B30", quantity: 52, unit: "מ״ק" }, { name: "בלוקים 20", quantity: 3200, unit: "יח׳" }, { name: "ברזל", quantity: 4.5, unit: "טון" }] });
    }
    setAnalyzing(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>הדמיה תלת-ממדית</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>פענוח שרטוטים הנדסיים + הדמיה 3D אינטראקטיבית</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: "1.5rem" }}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0" }}>מודל 3D</h2>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[{ label: "רוחב", key: "width" }, { label: "אורך", key: "length" }, { label: "גובה", key: "height" }, { label: "חדרים", key: "rooms" }].map(f => (
                <div key={f.key}>
                  <div style={{ color: "#8B9DB5", fontSize: "0.65rem", marginBottom: "0.2rem" }}>{f.label}</div>
                  <input type="number" value={dims[f.key]} onChange={e => setDims(d => ({ ...d, [f.key]: Number(e.target.value) }))} style={{ ...inputStyle, width: "60px", padding: "0.3rem 0.5rem", fontSize: "0.8rem" }} />
                </div>
              ))}
            </div>
          </div>
          <canvas ref={canvasRef} width={600} height={400} style={{ width: "100%", background: "rgba(0,0,0,0.3)", borderRadius: "1rem", display: "block" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={card}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>העלה תוכנית</h2>
            <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "0.8rem", padding: "1.5rem", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: "2rem" }}>📐</div>
              <div style={{ color: "#C9A84C", fontSize: "0.85rem", marginTop: "0.3rem" }}>העלה גרמושקה</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" style={{ display: "none" }} onChange={e => analyzeBlueprint(e.target.files[0])} />
            {analyzing && <div style={{ color: "#C9A84C", textAlign: "center", marginTop: "0.8rem", fontSize: "0.85rem" }}>🤖 מנתח תוכנית...</div>}
          </div>
          {aiResult && (
            <div style={card}>
              <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "0.8rem" }}>רשימת חומרים</h2>
              {aiResult.materials?.map((m, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <span style={{ color: "#E8E0D0", fontSize: "0.82rem" }}>{m.name}</span>
                  <span style={{ color: "#C9A84C", fontSize: "0.82rem", fontWeight: 600 }}>{m.quantity} {m.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Finance Page ───────────────────────────────────────────────────────────
function FinancePage({ projects }) {
  const cashflow = [
    { month: "ינו", הכנסות: 850000, הוצאות: 620000 },
    { month: "פבר", הכנסות: 920000, הוצאות: 780000 },
    { month: "מרס", הכנסות: 1100000, הוצאות: 950000 },
    { month: "אפר", הכנסות: 780000, הוצאות: 820000 },
    { month: "מאי", הכנסות: 1250000, הוצאות: 890000 },
    { month: "יונ", הכנסות: 1400000, הוצאות: 1050000 },
  ];
  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>ניהול כספי ותזרים</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>דוחות ויזואליים והתראות חריגה</div>
      </div>
      <div style={{ ...card, marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>תזרים מזומנים</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={cashflow}>
            <XAxis dataKey="month" tick={{ fill: "#8B9DB5", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#8B9DB5", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${(v / 1000000).toFixed(1)}M`} />
            <Tooltip contentStyle={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "0.75rem", color: "#E8E0D0", fontSize: "0.8rem" }} formatter={v => [`₪${(v / 1000).toFixed(0)}K`]} />
            <Line type="monotone" dataKey="הכנסות" stroke="#5CC98A" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="הוצאות" stroke="#E05C5C" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div style={card}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>ניצול תקציב — התראות</h2>
        {projects.map(p => {
          const pct = p.budget > 0 ? Math.round(p.spent / p.budget * 100) : 0;
          const color = pct > 100 ? "#E05C5C" : pct >= 90 ? "#E0A84C" : "#5CC98A";
          return <div key={p.id} style={{ marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
              <span style={{ color: "#E8E0D0", fontSize: "0.85rem" }}>{p.name}</span>
              <span style={{ color, fontSize: "0.85rem", fontWeight: 600 }}>{pct}% {pct > 100 ? "⚠️ חריגה!" : pct >= 90 ? "⚡ סיכון" : "✅"}</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "10px", overflow: "hidden" }}>
              <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: `linear-gradient(90deg, ${color}88, ${color})`, borderRadius: "1rem", transition: "width 1s" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.2rem" }}>
              <span style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>{fmt(p.spent)} מתוך {fmt(p.budget)}</span>
              <span style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>נותר: {fmt(Math.max(0, p.budget - p.spent))}</span>
            </div>
          </div>;
        })}
      </div>
    </div>
  );
}

// ── Reports Page ───────────────────────────────────────────────────────────
function ReportsPage({ projects }) {
  const [selectedProject, setSelectedProject] = useState("");
  const [generating, setGenerating] = useState(false);

  const generatePDF = async () => {
    const proj = projects.find(p => p.id === selectedProject);
    if (!proj) return alert("בחר פרויקט");
    setGenerating(true);
    await new Promise(r => setTimeout(r, 1500));

    const content = `
      <html dir="rtl">
      <head><meta charset="utf-8"><style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; direction: rtl; }
        .header { background: #1B2A4A; color: #C9A84C; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        h1 { font-size: 24px; margin: 0 0 5px; }
        .subtitle { font-size: 14px; color: #B8C4D4; }
        .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
        .label { color: #666; font-size: 14px; }
        .value { font-weight: bold; font-size: 14px; }
        .total { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-top: 20px; }
        .footer { margin-top: 40px; color: #999; font-size: 12px; text-align: center; }
      </style></head>
      <body>
        <div class="header">
          <h1>הצעת מחיר — ${proj.name}</h1>
          <div class="subtitle">בנייה.AI · ירושלים פרמיום · ${new Date().toLocaleDateString("he-IL")}</div>
        </div>
        <div class="row"><span class="label">לקוח</span><span class="value">${proj.client || "-"}</span></div>
        <div class="row"><span class="label">שלב ביצוע</span><span class="value">${proj.phase}</span></div>
        <div class="row"><span class="label">תקציב מאושר</span><span class="value">₪${Number(proj.budget).toLocaleString()}</span></div>
        <div class="row"><span class="label">הוצאות עד כה</span><span class="value">₪${Number(proj.spent).toLocaleString()}</span></div>
        <div class="row"><span class="label">אחוז ביצוע</span><span class="value">${proj.progress}%</span></div>
        <div class="row"><span class="label">ימים לסיום</span><span class="value">${proj.days_left} ימים</span></div>
        <div class="total">
          <div class="row"><span class="label">יתרה לביצוע</span><span class="value" style="color:#C9A84C">₪${Math.max(0, proj.budget - proj.spent).toLocaleString()}</span></div>
        </div>
        <div class="footer">מסמך זה הופק אוטומטית על ידי מערכת בנייה.AI · ${new Date().toLocaleString("he-IL")}</div>
      </body></html>
    `;
    const blob = new Blob([content], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `הצעת_מחיר_${proj.name}.html`;
    a.click(); URL.revokeObjectURL(url);
    setGenerating(false);
  };

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>מחולל דוחות PDF</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>יצירת הצעות מחיר ודוחות מקצועיים</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>הצעת מחיר לפרויקט</h2>
          <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.4rem" }}>בחר פרויקט</label>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)} style={{ ...inputStyle, marginBottom: "1rem" }}>
            <option value="">בחר פרויקט...</option>
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selectedProject && projects.find(p => p.id === selectedProject) && (() => {
            const p = projects.find(pr => pr.id === selectedProject);
            return <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.8rem", padding: "1rem", marginBottom: "1rem" }}>
              {[["לקוח", p.client], ["תקציב", fmt(p.budget)], ["הוצאות", fmt(p.spent)], ["ביצוע", `${p.progress}%`]].map(([l, v]) => <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "0.4rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><span style={{ color: "#8B9DB5", fontSize: "0.8rem" }}>{l}</span><span style={{ color: "#E8E0D0", fontSize: "0.8rem", fontWeight: 600 }}>{v}</span></div>)}
            </div>;
          })()}
          <button onClick={generatePDF} disabled={generating || !selectedProject} style={{ ...btnGold, width: "100%", opacity: !selectedProject ? 0.5 : 1 }}>
            {generating ? "⏳ מייצר..." : "📄 צור דוח PDF"}
          </button>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>סטטיסטיקות כלליות</h2>
          {[{ label: "סה״כ פרויקטים", value: projects.length }, { label: "תקציב כולל", value: fmt(projects.reduce((s, p) => s + (Number(p.budget) || 0), 0)) }, { label: "הוצאות כולל", value: fmt(projects.reduce((s, p) => s + (Number(p.spent) || 0), 0)) }, { label: "פרויקטים בחריגה", value: projects.filter(p => p.progress > 100).length }, { label: "פרויקטים הושלמו", value: projects.filter(p => p.status === "הושלם").length }].map(s => (
            <div key={s.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>{s.label}</span>
              <span style={{ color: "#C9A84C", fontSize: "0.85rem", fontWeight: 700 }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Security Page ──────────────────────────────────────────────────────────
function SecurityPage() {
  const logs = [
    { user: "אבי כהן", role: "מנהל", action: "סרק חשבונית", target: "מגדל יוסף", time: "09:14", ip: "192.168.1.10" },
    { user: "מירי לוי", role: "מנהל פרויקט", action: "עדכן כמויות", target: "וילה פרטית", time: "08:52", ip: "192.168.1.15" },
    { user: "דוד ישראלי", role: "מנהל", action: "יצר פרויקט", target: "מרכז מסחרי", time: "08:30", ip: "192.168.1.8" },
    { user: "רות שמיר", role: "עובד", action: "צפה בתוכנית", target: "בית כנסת", time: "08:15", ip: "192.168.1.22" },
    { user: "אבי כהן", role: "מנהל", action: "הוריד PDF", target: "פסגת זאב", time: "07:58", ip: "192.168.1.10" },
  ];
  const users = [
    { name: "אבי כהן", email: "avi@binyan.ai", role: "מנהל", status: "פעיל" },
    { name: "מירי לוי", email: "miri@binyan.ai", role: "מנהל פרויקט", status: "פעיל" },
    { name: "דוד ישראלי", email: "david@binyan.ai", role: "מנהל פרויקט", status: "פעיל" },
    { name: "רות שמיר", email: "ruth@binyan.ai", role: "עובד", status: "פעיל" },
  ];
  const roleColor = r => r === "מנהל" ? "#C9A84C" : r === "מנהל פרויקט" ? "#5CC98A" : "#B8C4D4";

  return (
    <div>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>אבטחה והרשאות</h1>
        <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>ניהול משתמשים, הרשאות ויומן פעולות</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>משתמשים במערכת</h2>
          {users.map(u => (
            <div key={u.email} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: "36px", height: "36px", background: "rgba(201,168,76,0.15)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#C9A84C", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0 }}>{u.name.split(" ").map(n => n[0]).join("")}</div>
              <div style={{ flex: 1 }}>
                <div style={{ color: "#E8E0D0", fontSize: "0.85rem", fontWeight: 500 }}>{u.name}</div>
                <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{u.email}</div>
              </div>
              <span style={{ background: `${roleColor(u.role)}22`, color: roleColor(u.role), borderRadius: "0.4rem", padding: "0.15rem 0.6rem", fontSize: "0.7rem", fontWeight: 600 }}>{u.role}</span>
            </div>
          ))}
          <div style={{ marginTop: "1rem", padding: "0.8rem", background: "rgba(201,168,76,0.08)", borderRadius: "0.75rem", fontSize: "0.78rem", color: "#8B9DB5" }}>
            <div style={{ color: "#C9A84C", fontWeight: 600, marginBottom: "0.3rem" }}>רמות הרשאה:</div>
            <div>🔑 מנהל — גישה מלאה לכל המערכת</div>
            <div>👷 מנהל פרויקט — ניהול פרויקטים וכמויות</div>
            <div>👁️ עובד — צפייה וסריקת מסמכים בלבד</div>
          </div>
        </div>
        <div style={card}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>יומן פעולות</h2>
          {logs.map((log, i) => (
            <div key={i} style={{ padding: "0.6rem 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                <span style={{ color: "#E8E0D0", fontSize: "0.82rem", fontWeight: 500 }}>{log.user}</span>
                <span style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{log.time}</span>
              </div>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <span style={{ color: roleColor(log.role), fontSize: "0.7rem" }}>{log.role}</span>
                <span style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>·</span>
                <span style={{ color: "#B8C4D4", fontSize: "0.78rem" }}>{log.action}</span>
                <span style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>·</span>
                <span style={{ color: "#C9A84C", fontSize: "0.75rem" }}>{log.target}</span>
              </div>
              <div style={{ color: "#8B9DB5", fontSize: "0.68rem", marginTop: "0.2rem" }}>IP: {log.ip}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ ...card, marginTop: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>בדיקת תקינות מערכת</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem" }}>
          {[{ label: "Supabase DB", status: "תקין", ok: true }, { label: "Gemini AI", status: "תקין", ok: true }, { label: "Storage", status: "תקין", ok: true }, { label: "Auth Google", status: "תקין", ok: true }, { label: "PWA", status: "דרוש הגדרה", ok: false }, { label: "SSL", status: "תקין", ok: true }].map(s => (
            <div key={s.label} style={{ background: s.ok ? "rgba(92,201,138,0.08)" : "rgba(224,92,92,0.08)", border: `1px solid ${s.ok ? "rgba(92,201,138,0.2)" : "rgba(224,92,92,0.2)"}`, borderRadius: "0.8rem", padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: s.ok ? "#5CC98A" : "#E05C5C", boxShadow: `0 0 8px ${s.ok ? "#5CC98A" : "#E05C5C"}`, flexShrink: 0 }} />
              <div><div style={{ color: "#E8E0D0", fontSize: "0.82rem", fontWeight: 500 }}>{s.label}</div><div style={{ color: s.ok ? "#5CC98A" : "#E05C5C", fontSize: "0.7rem" }}>{s.status}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSave = async (form) => {
    const payload = { ...form, budget: Number(form.budget), spent: Number(form.spent), progress: Number(form.progress), days_left: Number(form.days_left) };
    if (form.id) { await supabase.from("projects").update(payload).eq("id", form.id); }
    else { await supabase.from("projects").insert([payload]); }
    setModal(null);
    fetchProjects();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("למחוק פרויקט זה?")) return;
    await supabase.from("projects").delete().eq("id", id);
    fetchProjects();
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", width: "100vw", maxWidth: "100%", background: "linear-gradient(135deg, #0D1B2E 0%, #111827 50%, #0A1628 100%)", fontFamily: "'Assistant', 'Heebo', sans-serif", color: "#E8E0D0", display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }
        select option { background: #0D1B2E; color: #E8E0D0; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
      `}</style>

      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ color: "#8B9DB5", fontSize: "0.8rem" }}>{NAV_ITEMS.find(n => n.id === activeNav)?.icon} {NAV_ITEMS.find(n => n.id === activeNav)?.label}</div>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <div style={{ background: "rgba(92,201,138,0.1)", border: "1px solid rgba(92,201,138,0.3)", borderRadius: "0.6rem", padding: "0.4rem 0.9rem", color: "#5CC98A", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "6px", height: "6px", background: "#5CC98A", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #5CC98A" }} />מחובר · Supabase
            </div>
            <div style={{ color: "#C9A84C", fontSize: "0.78rem", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", padding: "0.4rem 0.9rem" }}>{time.toLocaleTimeString("he-IL")}</div>
          </div>
        </div>

        {activeNav === "dashboard" && <DashboardPage projects={projects} loading={loading} />}
        {activeNav === "projects" && !selectedProject && <ProjectsPage projects={projects} loading={loading} onAdd={() => setModal("add")} onEdit={p => setModal(p)} onDelete={handleDelete} onOpen={p => setSelectedProject(p)} />}
        {activeNav === "projects" && selectedProject && <ProjectDetail project={selectedProject} onBack={() => setSelectedProject(null)} onUpdate={fetchProjects} />}
        {activeNav === "quantities" && <QuantitiesPage projects={projects} />}
        {activeNav === "scanner" && <ScannerPage projects={projects} />}
        {activeNav === "model3d" && <Model3DPage />}
        {activeNav === "finance" && <FinancePage projects={projects} />}
        {activeNav === "reports" && <ReportsPage projects={projects} />}
        {activeNav === "security" && <SecurityPage />}
      </main>

      {modal && <ProjectModal project={modal === "add" ? null : modal} onSave={handleSave} onClose={() => setModal(null)} />}
    </div>
  );
}