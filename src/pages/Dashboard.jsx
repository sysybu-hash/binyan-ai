import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "../lib/supabase";

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
  { id: "reports", label: "דוחות", icon: "▤" },
  { id: "security", label: "אבטחה", icon: "◬" },
];

const fmt = (n) => n >= 1000000 ? `₪${(n / 1000000).toFixed(1)}M` : `₪${(n / 1000).toFixed(0)}K`;

const EMPTY_PROJECT = { name: "", client: "", budget: "", spent: "", status: "פעיל", phase: "תכנון", progress: 0, days_left: 0 };

// ── Sidebar ────────────────────────────────────────────────────────────────
function Sidebar({ activeNav, setActiveNav, sidebarOpen, setSidebarOpen }) {
  return (
    <aside style={{
      width: sidebarOpen ? "240px" : "72px",
      background: "rgba(13,27,46,0.97)",
      borderLeft: "1px solid rgba(201,168,76,0.15)",
      display: "flex", flexDirection: "column",
      transition: "width 0.3s ease",
      flexShrink: 0, position: "relative", zIndex: 10,
    }}>
      <div style={{ padding: "1.5rem 1rem", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <div style={{
            width: "40px", height: "40px", flexShrink: 0,
            background: "linear-gradient(135deg, #C9A84C, #8B6914)",
            borderRadius: "0.75rem", display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "1.3rem", fontWeight: 700,
            color: "#0D1B2E", fontFamily: "'Playfair Display', serif",
            boxShadow: "0 4px 20px rgba(201,168,76,0.3)",
          }}>ב</div>
          {sidebarOpen && (
            <div>
              <div style={{ color: "#C9A84C", fontWeight: 700, fontSize: "1rem", fontFamily: "'Playfair Display', serif" }}>בנייה.AI</div>
              <div style={{ color: "#8B9DB5", fontSize: "0.68rem" }}>ירושלים פרמיום</div>
            </div>
          )}
        </div>
      </div>
      <nav style={{ flex: 1, padding: "1rem 0.5rem" }}>
        {NAV_ITEMS.map(item => (
          <button key={item.id}
            onClick={() => setActiveNav(item.id)}
            style={{
              width: "100%", display: "flex", alignItems: "center", gap: "0.8rem",
              padding: "0.7rem 0.9rem", borderRadius: "0.75rem",
              background: activeNav === item.id ? "rgba(201,168,76,0.15)" : "transparent",
              border: "none", borderRight: activeNav === item.id ? "3px solid #C9A84C" : "3px solid transparent",
              color: activeNav === item.id ? "#C9A84C" : "#8B9DB5",
              cursor: "pointer", marginBottom: "0.2rem",
              fontSize: "0.85rem", fontWeight: activeNav === item.id ? 600 : 400,
              fontFamily: "'Assistant', sans-serif", textAlign: "right",
              justifyContent: "flex-start", transition: "all 0.15s",
            }}>
            <span style={{ fontSize: "1.1rem", flexShrink: 0, width: "20px", textAlign: "center" }}>{item.icon}</span>
            {sidebarOpen && <span>{item.label}</span>}
          </button>
        ))}
      </nav>
      <div style={{ padding: "1rem", borderTop: "1px solid rgba(201,168,76,0.1)" }}>
        {sidebarOpen && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{ width: "32px", height: "32px", background: "linear-gradient(135deg, #1B2A4A, #2D3F5A)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", border: "1px solid rgba(201,168,76,0.3)" }}>אב</div>
            <div>
              <div style={{ color: "#E8E0D0", fontSize: "0.8rem", fontWeight: 600 }}>אבי כהן</div>
              <div style={{ color: "#C9A84C", fontSize: "0.65rem" }}>מנהל ראשי</div>
            </div>
          </div>
        )}
      </div>
      <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
        position: "absolute", top: "50%", left: "-12px",
        width: "24px", height: "24px", borderRadius: "50%",
        background: "#1B2A4A", border: "1px solid rgba(201,168,76,0.3)",
        color: "#C9A84C", cursor: "pointer", fontSize: "0.7rem",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>{sidebarOpen ? "◂" : "▸"}</button>
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

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem",
    color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem",
    fontFamily: "'Assistant', sans-serif", outline: "none",
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "1.5rem", padding: "2rem", width: "500px", maxWidth: "90vw" }} dir="rtl">
        <h2 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", marginBottom: "1.5rem", fontSize: "1.3rem" }}>
          {project?.id ? "עריכת פרויקט" : "פרויקט חדש"}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {[
            { label: "שם הפרויקט *", key: "name", type: "text", full: true },
            { label: "לקוח", key: "client", type: "text" },
            { label: "תקציב (₪)", key: "budget", type: "number" },
            { label: "הוצאות (₪)", key: "spent", type: "number" },
            { label: "ימים שנותרו", key: "days_left", type: "number" },
            { label: "התקדמות (%)", key: "progress", type: "number" },
          ].map(f => (
            <div key={f.key} style={{ gridColumn: f.full ? "1 / -1" : "auto" }}>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => handle(f.key, e.target.value)} style={inputStyle} />
            </div>
          ))}
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>סטטוס</label>
            <select value={form.status} onChange={e => handle("status", e.target.value)} style={inputStyle}>
              {["פעיל", "סיכון", "חריגה", "הושלם", "מושהה"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>שלב</label>
            <select value={form.phase} onChange={e => handle("phase", e.target.value)} style={inputStyle}>
              {["תכנון", "יסודות", "שלד", "גמר", "מסירה"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem", justifyContent: "flex-start" }}>
          <button onClick={save} disabled={saving} style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.7rem 1.5rem", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Assistant', sans-serif" }}>
            {saving ? "שומר..." : "💾 שמור"}
          </button>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.7rem 1.5rem", cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Assistant', sans-serif" }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Projects Page ──────────────────────────────────────────────────────────
function ProjectsPage({ projects, loading, onAdd, onEdit, onDelete }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0" }}>ניהול פרויקטים</h1>
          <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>{projects.length} פרויקטים במערכת</div>
        </div>
        <button onClick={onAdd} style={{ background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.7rem 1.3rem", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem", fontFamily: "'Assistant', sans-serif" }}>
          + פרויקט חדש
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", color: "#8B9DB5", padding: "3rem" }}>טוען נתונים...</div>
      ) : (
        <div style={{ display: "grid", gap: "1rem" }}>
          {projects.map(p => {
            const pct = Math.min(p.progress, 100);
            const over = p.progress > 100;
            const warn = p.progress >= 90;
            const barColor = over ? "#E05C5C" : warn ? "#E0A84C" : "#C9A84C";
            return (
              <div key={p.id} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "1.2rem", padding: "1.2rem 1.5rem",
                display: "grid", gridTemplateColumns: "1fr auto", gap: "1rem", alignItems: "center",
              }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.4rem" }}>
                    <span style={{ color: "#E8E0D0", fontWeight: 600 }}>{p.name}</span>
                    <span style={{ background: over ? "rgba(224,92,92,0.2)" : warn ? "rgba(224,168,76,0.2)" : "rgba(201,168,76,0.15)", color: over ? "#E05C5C" : warn ? "#E0A84C" : "#C9A84C", borderRadius: "0.4rem", padding: "0.1rem 0.5rem", fontSize: "0.68rem", fontWeight: 600 }}>{p.status}</span>
                  </div>
                  <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginBottom: "0.6rem" }}>{p.client} · {p.phase} · עוד {p.days_left} ימים</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
                    <div style={{ flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "6px" }}>
                      <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "1rem" }} />
                    </div>
                    <span style={{ color: barColor, fontSize: "0.8rem", fontWeight: 700, minWidth: "36px" }}>{p.progress}%</span>
                    <span style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>{fmt(p.spent)} / {fmt(p.budget)}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={() => onEdit(p)} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>✏️ ערוך</button>
                  <button onClick={() => onDelete(p.id)} style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "0.5rem", color: "#E05C5C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.8rem" }}>🗑️ מחק</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Dashboard Page ─────────────────────────────────────────────────────────
function DashboardPage({ projects, loading }) {
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const totalSpent = projects.reduce((s, p) => s + (p.spent || 0), 0);
  const atRisk = projects.filter(p => p.progress >= 90).length;

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <div style={{ color: "#8B9DB5", fontSize: "0.78rem", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
          {new Date().toLocaleDateString("he-IL", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", color: "#E8E0D0", lineHeight: 1.1 }}>מרכז שליטה</h1>
        <div style={{ color: "#C9A84C", fontSize: "0.85rem", marginTop: "0.2rem" }}>ניהול פרויקטים הנדסיים · ירושלים</div>
      </div>

      {/* KPI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { icon: "🏗️", label: "פרויקטים פעילים", value: loading ? "..." : projects.length, sub: "מחובר Supabase" },
          { icon: "₪", label: "תקציב כולל", value: loading ? "..." : fmt(totalBudget), sub: "כל הפרויקטים" },
          { icon: "📊", label: "הוצאות בפועל", value: loading ? "..." : fmt(totalSpent), sub: totalBudget ? `${Math.round(totalSpent / totalBudget * 100)}% ניצול` : "" },
          { icon: "⚠️", label: "פרויקטים בסיכון", value: loading ? "..." : atRisk, sub: "מעל 90% ניצול" },
        ].map(card => (
          <div key={card.label} style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "1.5rem", padding: "1.5rem", position: "relative", overflow: "hidden" }}>
            <div style={{ fontSize: "1.8rem", marginBottom: "0.3rem" }}>{card.icon}</div>
            <div style={{ color: "#B8C4D4", fontSize: "0.75rem", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>{card.label}</div>
            <div style={{ color: "#C9A84C", fontSize: "1.8rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{card.value}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginTop: "0.3rem" }}>{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>תקציב מול ביצוע</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BUDGET_DATA}>
              <XAxis dataKey="month" tick={{ fill: "#8B9DB5", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#8B9DB5", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `₪${(v / 1000000).toFixed(1)}M`} />
              <Tooltip contentStyle={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "0.75rem", color: "#E8E0D0", fontSize: "0.8rem" }} formatter={v => [`₪${(v / 1000).toFixed(0)}K`]} />
              <Bar dataKey="תקציב" fill="rgba(201,168,76,0.25)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="ביצוע" fill="#C9A84C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>שלבי ביצוע</h2>
          <PieChart width={160} height={160} style={{ margin: "0 auto" }}>
            <Pie data={PIE_DATA} cx={80} cy={80} innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
              {PIE_DATA.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
          </PieChart>
          <div style={{ marginTop: "0.5rem" }}>
            {PIE_DATA.map(d => (
              <div key={d.name} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: d.color }} />
                <span style={{ color: "#B8C4D4", fontSize: "0.78rem", flex: 1 }}>{d.name}</span>
                <span style={{ color: "#C9A84C", fontSize: "0.78rem", fontWeight: 600 }}>{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects list */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 600, color: "#E8E0D0", marginBottom: "1rem" }}>פרויקטים פעילים</h2>
        {loading ? <div style={{ color: "#8B9DB5", textAlign: "center", padding: "2rem" }}>טוען מ-Supabase...</div> : projects.map(p => {
          const pct = Math.min(p.progress, 100);
          const barColor = p.progress > 100 ? "#E05C5C" : p.progress >= 90 ? "#E0A84C" : "#C9A84C";
          return (
            <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "0.9rem 1rem", marginBottom: "0.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                <span style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.88rem" }}>{p.name}</span>
                <span style={{ color: barColor, fontWeight: 700, fontSize: "0.88rem" }}>{p.progress}%</span>
              </div>
              <div style={{ color: "#8B9DB5", fontSize: "0.72rem", marginBottom: "0.4rem" }}>{p.client} · {p.phase}</div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "1rem", height: "5px" }}>
                <div style={{ width: `${pct}%`, height: "100%", background: barColor, borderRadius: "1rem" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* System Health */}
      <div style={{ marginTop: "1.5rem", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.5rem", padding: "1rem 1.5rem", display: "flex", gap: "2rem", alignItems: "center", flexWrap: "wrap" }}>
        <span style={{ color: "#8B9DB5", fontSize: "0.75rem", fontWeight: 600 }}>מצב מערכת</span>
        {[{ label: "Supabase DB", ok: true }, { label: "Gemini AI", ok: true }, { label: "Storage", ok: true }, { label: "Auth", ok: true }].map(s => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: s.ok ? "#5CC98A" : "#E05C5C", boxShadow: `0 0 8px ${s.ok ? "#5CC98A" : "#E05C5C"}` }} />
            <span style={{ color: "#B8C4D4", fontSize: "0.75rem" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Coming Soon ────────────────────────────────────────────────────────────
function ComingSoon({ title }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "60vh", gap: "1rem" }}>
      <div style={{ fontSize: "4rem" }}>🚧</div>
      <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#C9A84C", fontSize: "1.5rem" }}>{title}</h2>
      <p style={{ color: "#8B9DB5", fontSize: "0.9rem" }}>מודול זה נמצא בפיתוח — יהיה זמין בקרוב</p>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "add" | project object

  // טעינת פרויקטים מ-Supabase
  const fetchProjects = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("*").order("created_at", { ascending: false });
    if (!error) setProjects(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  // הוספה / עריכה
  const handleSave = async (form) => {
    if (form.id) {
      await supabase.from("projects").update({ ...form, budget: Number(form.budget), spent: Number(form.spent), progress: Number(form.progress), days_left: Number(form.days_left) }).eq("id", form.id);
    } else {
      await supabase.from("projects").insert([{ ...form, budget: Number(form.budget), spent: Number(form.spent), progress: Number(form.progress), days_left: Number(form.days_left) }]);
    }
    setModal(null);
    fetchProjects();
  };

  // מחיקה
  const handleDelete = async (id) => {
    if (!window.confirm("למחוק פרויקט זה?")) return;
    await supabase.from("projects").delete().eq("id", id);
    fetchProjects();
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0D1B2E 0%, #111827 50%, #0A1628 100%)", fontFamily: "'Assistant', 'Heebo', sans-serif", color: "#E8E0D0", display: "flex", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.3); border-radius: 2px; }
        select option { background: #0D1B2E; color: #E8E0D0; }
      `}</style>

      <Sidebar activeNav={activeNav} setActiveNav={setActiveNav} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main style={{ flex: 1, overflow: "auto", padding: "2rem" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", paddingBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ color: "#8B9DB5", fontSize: "0.8rem" }}>
            {NAV_ITEMS.find(n => n.id === activeNav)?.icon} {NAV_ITEMS.find(n => n.id === activeNav)?.label}
          </div>
          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
            <div style={{ background: "rgba(92,201,138,0.1)", border: "1px solid rgba(92,201,138,0.3)", borderRadius: "0.6rem", padding: "0.4rem 0.9rem", color: "#5CC98A", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span style={{ width: "6px", height: "6px", background: "#5CC98A", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #5CC98A" }} />
              מחובר · Supabase
            </div>
            <div style={{ color: "#C9A84C", fontSize: "0.78rem", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", padding: "0.4rem 0.9rem" }}>
              {new Date().toLocaleTimeString("he-IL")}
            </div>
          </div>
        </div>

        {/* Pages */}
        {activeNav === "dashboard" && <DashboardPage projects={projects} loading={loading} />}
        {activeNav === "projects" && <ProjectsPage projects={projects} loading={loading} onAdd={() => setModal("add")} onEdit={p => setModal(p)} onDelete={handleDelete} />}
        {activeNav === "quantities" && <ComingSoon title="בינראית — כתב כמויות" />}
        {activeNav === "scanner" && <ComingSoon title="סורק חשבוניות AI" />}
        {activeNav === "model3d" && <ComingSoon title="הדמיה תלת-ממדית" />}
        {activeNav === "finance" && <ComingSoon title="ניהול כספי ותזרים" />}
        {activeNav === "reports" && <ComingSoon title="דוחות ומסמכים" />}
        {activeNav === "security" && <ComingSoon title="אבטחה והרשאות" />}
      </main>

      {/* Modal */}
      {modal && (
        <ProjectModal
          project={modal === "add" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
