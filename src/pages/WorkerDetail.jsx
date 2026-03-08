import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.2rem", padding: "1.2rem 1.5rem" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", outline: "none", boxSizing: "border-box" };
const btnGold = { background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.6rem 1.2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif" };
const btnGhost = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Assistant', sans-serif" };
const fmt = (n) => !n ? "₪0" : `₪${Number(n).toLocaleString()}`;

const STATUS_COLORS = { "פעיל": "#5CC98A", "לא פעיל": "#E05C5C", "בחופש": "#E0A84C", "בפרויקט": "#C9A84C" };
const ROLES = ["קבלן", "פועל", "מנהל עבודה", "מהנדס", "אדריכל", "חשמלאי", "אינסטלטור", "טייח", "נגר", "פחחות ואיטום", "עגורנאי", "אחר"];
const TABS = [
  { id: "overview", label: "פרופיל", icon: "👤" },
  { id: "assignments", label: "פרויקטים", icon: "📍" },
  { id: "attendance", label: "נוכחות", icon: "📅" },
  { id: "documents", label: "מסמכים", icon: "📄" },
  { id: "payments", label: "תשלומים", icon: "💰" },
];

// ── Overview Tab ──────────────────────────────────────────────────────────
function OverviewTab({ worker, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...worker });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await supabase.from("workers").update({
      name: form.name,
      role: form.role,
      phone: form.phone,
      id_number: form.id_number,
      company: form.company,
      status: form.status,
      daily_rate: Number(form.daily_rate),
      notes: form.notes,
    }).eq("id", worker.id);
    onUpdate();
    setEditing(false);
    setSaving(false);
  };

  const fields = [
    { k: "name", label: "שם מלא", icon: "👤" },
    { k: "role", label: "תפקיד", icon: "🔧", type: "select", options: ROLES },
    { k: "phone", label: "טלפון", icon: "📱" },
    { k: "id_number", label: "ת.ז / מס׳ עובד", icon: "🪪" },
    { k: "company", label: "חברה / קבלן", icon: "🏢" },
    { k: "daily_rate", label: "שכר יומי", icon: "💰", type: "number" },
    { k: "status", label: "סטטוס", icon: "🔵", type: "select", options: Object.keys(STATUS_COLORS) },
    { k: "makanot_id", label: "מזהה מקאנו", icon: "🔗" },
  ];

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      {/* Profile Card */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: `linear-gradient(135deg, ${STATUS_COLORS[worker.status] || "#C9A84C"}33, ${STATUS_COLORS[worker.status] || "#C9A84C"}11)`, border: `2px solid ${STATUS_COLORS[worker.status] || "#C9A84C"}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>👷</div>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", color: "#E8E0D0", fontSize: "1.4rem", marginBottom: "0.2rem" }}>{worker.name}</h2>
            <div style={{ color: "#8B9DB5", fontSize: "0.82rem" }}>{worker.role} {worker.company ? `· ${worker.company}` : ""}</div>
            <span style={{ background: `${STATUS_COLORS[worker.status]}22`, color: STATUS_COLORS[worker.status], borderRadius: "0.4rem", padding: "0.15rem 0.6rem", fontSize: "0.72rem", fontWeight: 600, marginTop: "0.3rem", display: "inline-block" }}>{worker.status}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem" }}>
          {worker.phone && (
            <a href={`https://wa.me/972${worker.phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" style={{ ...btnGhost, textDecoration: "none", fontSize: "0.78rem", display: "flex", alignItems: "center", gap: "0.3rem" }}>
              💬 WhatsApp
            </a>
          )}
          <button onClick={() => setEditing(!editing)} style={editing ? btnGold : btnGhost}>{editing ? "❌ ביטול" : "✏️ ערוך"}</button>
        </div>
      </div>

      {/* Edit / View Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "0.8rem" }}>
        {fields.map(f => (
          <div key={f.k} style={{ ...card, padding: "0.9rem 1rem" }}>
            <div style={{ color: "#8B9DB5", fontSize: "0.7rem", marginBottom: "0.4rem" }}>{f.icon} {f.label}</div>
            {editing ? (
              f.type === "select" ? (
                <select value={form[f.k] || ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ ...inputStyle, padding: "0.4rem 0.6rem" }}>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input type={f.type || "text"} value={form[f.k] || ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} style={{ ...inputStyle, padding: "0.4rem 0.6rem" }} />
              )
            ) : (
              <div style={{ color: "#E8E0D0", fontWeight: 500, fontSize: "0.88rem" }}>
                {f.k === "daily_rate" ? fmt(worker[f.k]) : (worker[f.k] || "—")}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Notes */}
      <div style={card}>
        <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginBottom: "0.5rem" }}>📝 הערות</div>
        {editing ? (
          <textarea value={form.notes || ""} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, height: "100px", resize: "vertical" }} placeholder="הערות על העובד..." />
        ) : (
          <div style={{ color: "#B8C4D4", fontSize: "0.85rem", lineHeight: 1.6 }}>{worker.notes || "אין הערות"}</div>
        )}
      </div>

      {editing && (
        <button onClick={save} disabled={saving} style={{ ...btnGold, width: "100%", padding: "0.8rem" }}>
          {saving ? "שומר..." : "💾 שמור שינויים"}
        </button>
      )}
    </div>
  );
}

// ── Assignments Tab ───────────────────────────────────────────────────────
function AssignmentsTab({ worker, projects, assignments, onRefresh }) {
  const [form, setForm] = useState({ project_id: "", role_in_project: worker.role || "", start_date: "", end_date: "" });
  const [saving, setSaving] = useState(false);

  const add = async () => {
    if (!form.project_id) return;
    setSaving(true);
    await supabase.from("worker_assignments").insert([{ worker_id: worker.id, ...form, status: "פעיל" }]);
    setForm({ project_id: "", role_in_project: worker.role || "", start_date: "", end_date: "" });
    onRefresh();
    setSaving(false);
  };

  const remove = async (id) => {
    await supabase.from("worker_assignments").delete().eq("id", id);
    onRefresh();
  };

  const toggle = async (id, status) => {
    await supabase.from("worker_assignments").update({ status: status === "פעיל" ? "הושלם" : "פעיל" }).eq("id", id);
    onRefresh();
  };

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>+ שיוך לפרויקט חדש</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
          <div style={{ gridColumn: "1/-1" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>פרויקט</label>
            <select value={form.project_id} onChange={e => setForm(p => ({ ...p, project_id: e.target.value }))} style={inputStyle}>
              <option value="">בחר פרויקט</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תפקיד</label>
            <input value={form.role_in_project} onChange={e => setForm(p => ({ ...p, role_in_project: e.target.value }))} style={inputStyle} placeholder="תפקיד בפרויקט" />
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תאריך התחלה</label>
            <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} style={inputStyle} />
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תאריך סיום</label>
            <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} style={inputStyle} />
          </div>
        </div>
        <button onClick={add} disabled={saving} style={{ ...btnGold, marginTop: "1rem", width: "100%" }}>{saving ? "שומר..." : "✅ שייך לפרויקט"}</button>
      </div>

      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>פרויקטים ({assignments.length})</h3>
        {assignments.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>לא משויך לשום פרויקט עדיין</div>
        ) : (
          <div style={{ display: "grid", gap: "0.7rem" }}>
            {assignments.map(a => {
              const project = projects.find(p => p.id === a.project_id);
              return (
                <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.8rem", padding: "0.9rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.88rem" }}>{project?.name || "פרויקט לא ידוע"}</div>
                    <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginTop: "0.2rem" }}>
                      {a.role_in_project} {a.start_date ? `· ${a.start_date}` : ""} {a.end_date ? `→ ${a.end_date}` : ""}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ background: a.status === "פעיל" ? "rgba(92,201,138,0.15)" : "rgba(139,157,181,0.15)", color: a.status === "פעיל" ? "#5CC98A" : "#8B9DB5", borderRadius: "0.4rem", padding: "0.15rem 0.5rem", fontSize: "0.72rem" }}>{a.status}</span>
                    <button onClick={() => toggle(a.id, a.status)} style={{ background: "rgba(201,168,76,0.1)", border: "none", borderRadius: "0.4rem", color: "#C9A84C", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.72rem" }}>🔄</button>
                    <button onClick={() => remove(a.id)} style={{ background: "rgba(224,92,92,0.1)", border: "none", borderRadius: "0.4rem", color: "#E05C5C", padding: "0.2rem 0.5rem", cursor: "pointer", fontSize: "0.72rem" }}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Attendance Tab ────────────────────────────────────────────────────────
function AttendanceTab({ worker }) {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], hours: 8, notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Load from localStorage for now
    const saved = JSON.parse(localStorage.getItem(`attendance_${worker.id}`) || "[]");
    setRecords(saved);
  }, [worker.id]);

  const add = () => {
    const newRecords = [{ ...form, id: Date.now() }, ...records];
    setRecords(newRecords);
    localStorage.setItem(`attendance_${worker.id}`, JSON.stringify(newRecords));
    setForm(p => ({ ...p, notes: "" }));
  };

  const remove = (id) => {
    const newRecords = records.filter(r => r.id !== id);
    setRecords(newRecords);
    localStorage.setItem(`attendance_${worker.id}`, JSON.stringify(newRecords));
  };

  const totalHours = records.reduce((s, r) => s + Number(r.hours), 0);
  const totalPay = totalHours * (worker.daily_rate / 8);

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
        {[{ label: "ימי עבודה", value: records.length, color: "#C9A84C" }, { label: "שעות כוללות", value: totalHours, color: "#5CC98A" }, { label: "עלות מצטברת", value: fmt(totalPay), color: "#E0A84C" }].map(s => (
          <div key={s.label} style={{ ...card, textAlign: "center", padding: "1rem" }}>
            <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>+ רישום נוכחות</h3>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>תאריך</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ width: "80px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>שעות</label>
            <input type="number" value={form.hours} onChange={e => setForm(p => ({ ...p, hours: e.target.value }))} style={inputStyle} min="1" max="24" />
          </div>
          <div style={{ flex: 1, minWidth: "130px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>הערה</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="אופציונלי" />
          </div>
          <button onClick={add} style={btnGold}>+ הוסף</button>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>היסטוריית נוכחות</h3>
        {records.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>אין רישומי נוכחות עדיין</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                  {["תאריך", "שעות", "עלות יומית", "הערה", ""].map(h => <th key={h} style={{ color: "#C9A84C", padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.5rem", color: "#E8E0D0" }}>{r.date}</td>
                    <td style={{ padding: "0.5rem", color: "#5CC98A" }}>{r.hours}ש׳</td>
                    <td style={{ padding: "0.5rem", color: "#C9A84C" }}>{fmt(r.hours * worker.daily_rate / 8)}</td>
                    <td style={{ padding: "0.5rem", color: "#8B9DB5" }}>{r.notes}</td>
                    <td style={{ padding: "0.5rem" }}><button onClick={() => remove(r.id)} style={{ background: "none", border: "none", color: "#E05C5C", cursor: "pointer" }}>🗑️</button></td>
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

// ── Documents Tab ─────────────────────────────────────────────────────────
function DocumentsTab({ worker }) {
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`docs_${worker.id}`) || "[]");
    setDocs(saved);
  }, [worker.id]);

  const addDoc = (file) => {
    const newDocs = [{ id: Date.now(), name: file.name, size: `${(file.size / 1024).toFixed(0)} KB`, date: new Date().toLocaleDateString("he-IL"), type: file.name.split(".").pop() }, ...docs];
    setDocs(newDocs);
    localStorage.setItem(`docs_${worker.id}`, JSON.stringify(newDocs));
  };

  const removeDoc = (id) => {
    const newDocs = docs.filter(d => d.id !== id);
    setDocs(newDocs);
    localStorage.setItem(`docs_${worker.id}`, JSON.stringify(newDocs));
  };

  const DOC_TYPES = ["חוזה עבודה", "תעודת זהות", "רישיון מקצועי", "ביטוח", "אישור בטיחות", "אחר"];

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>📄 מסמכי עובד</h3>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          {DOC_TYPES.map(t => (
            <label key={t} style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.4rem 0.8rem", cursor: "pointer", fontSize: "0.75rem" }}>
              + {t}
              <input type="file" style={{ display: "none" }} onChange={e => addDoc(e.target.files[0])} />
            </label>
          ))}
        </div>
        {docs.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>אין מסמכים עדיין</div>
        ) : (
          <div style={{ display: "grid", gap: "0.6rem" }}>
            {docs.map(d => (
              <div key={d.id} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "0.7rem", padding: "0.7rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "0.7rem", alignItems: "center" }}>
                  <span style={{ fontSize: "1.3rem" }}>{d.type === "pdf" ? "📄" : "📎"}</span>
                  <div>
                    <div style={{ color: "#E8E0D0", fontSize: "0.85rem", fontWeight: 500 }}>{d.name}</div>
                    <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>{d.size} · {d.date}</div>
                  </div>
                </div>
                <button onClick={() => removeDoc(d.id)} style={{ background: "rgba(224,92,92,0.1)", border: "none", borderRadius: "0.4rem", color: "#E05C5C", padding: "0.3rem 0.5rem", cursor: "pointer", fontSize: "0.75rem" }}>🗑️</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Payments Tab ──────────────────────────────────────────────────────────
function PaymentsTab({ worker }) {
  const [payments, setPayments] = useState([]);
  const [form, setForm] = useState({ date: new Date().toISOString().split("T")[0], amount: worker.daily_rate || 0, type: "שכר", notes: "" });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(`payments_${worker.id}`) || "[]");
    setPayments(saved);
  }, [worker.id]);

  const add = () => {
    const newPayments = [{ ...form, id: Date.now() }, ...payments];
    setPayments(newPayments);
    localStorage.setItem(`payments_${worker.id}`, JSON.stringify(newPayments));
    setForm(p => ({ ...p, notes: "" }));
  };

  const remove = (id) => {
    const newPayments = payments.filter(p => p.id !== id);
    setPayments(newPayments);
    localStorage.setItem(`payments_${worker.id}`, JSON.stringify(newPayments));
  };

  const total = payments.reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div style={{ display: "grid", gap: "1.2rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ color: "#C9A84C", fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{fmt(total)}</div>
          <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>סה״כ תשלומים</div>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ color: "#5CC98A", fontSize: "1.4rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{payments.length}</div>
          <div style={{ color: "#8B9DB5", fontSize: "0.72rem" }}>מספר עסקאות</div>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>+ רישום תשלום</h3>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: 1, minWidth: "120px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>תאריך</label>
            <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ width: "110px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>סכום (₪)</label>
            <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} />
          </div>
          <div style={{ width: "120px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>סוג</label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
              {["שכר", "מקדמה", "בונוס", "החזר הוצאות", "אחר"].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div style={{ flex: 1, minWidth: "100px" }}>
            <label style={{ color: "#8B9DB5", fontSize: "0.72rem", display: "block", marginBottom: "0.3rem" }}>הערה</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={inputStyle} placeholder="אופציונלי" />
          </div>
          <button onClick={add} style={btnGold}>+ הוסף</button>
        </div>
      </div>
      <div style={card}>
        <h3 style={{ color: "#E8E0D0", fontSize: "0.95rem", marginBottom: "1rem", fontWeight: 600 }}>היסטוריית תשלומים</h3>
        {payments.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8B9DB5", padding: "2rem" }}>אין תשלומים רשומים</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                  {["תאריך", "סוג", "סכום", "הערה", ""].map(h => <th key={h} style={{ color: "#C9A84C", padding: "0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <td style={{ padding: "0.5rem", color: "#E8E0D0" }}>{p.date}</td>
                    <td style={{ padding: "0.5rem" }}><span style={{ background: "rgba(201,168,76,0.1)", color: "#C9A84C", borderRadius: "0.3rem", padding: "0.1rem 0.4rem", fontSize: "0.72rem" }}>{p.type}</span></td>
                    <td style={{ padding: "0.5rem", color: "#5CC98A", fontWeight: 600 }}>{fmt(p.amount)}</td>
                    <td style={{ padding: "0.5rem", color: "#8B9DB5" }}>{p.notes}</td>
                    <td style={{ padding: "0.5rem" }}><button onClick={() => remove(p.id)} style={{ background: "none", border: "none", color: "#E05C5C", cursor: "pointer" }}>🗑️</button></td>
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

// ── Main Worker Detail ────────────────────────────────────────────────────
export default function WorkerDetail({ worker: initialWorker, projects, onBack }) {
  const [worker, setWorker] = useState(initialWorker);
  const [activeTab, setActiveTab] = useState("overview");
  const [assignments, setAssignments] = useState([]);

  const fetchAssignments = async () => {
    const { data } = await supabase.from("worker_assignments").select("*").eq("worker_id", worker.id);
    setAssignments(data || []);
  };

  const fetchWorker = async () => {
    const { data } = await supabase.from("workers").select("*").eq("id", worker.id).single();
    if (data) setWorker(data);
  };

  useEffect(() => { fetchAssignments(); }, [worker.id]);

  const activeAssignment = assignments.find(a => a.status === "פעיל");
  const activeProject = activeAssignment ? projects.find(p => p.id === activeAssignment.project_id) : null;

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'); * { box-sizing: border-box; }`}</style>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <button onClick={onBack} style={{ ...btnGhost, marginBottom: "1rem", fontSize: "0.8rem" }}>← חזרה לעובדים</button>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0", marginBottom: "0.2rem" }}>{worker.name}</h1>
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ color: "#8B9DB5", fontSize: "0.82rem" }}>🔧 {worker.role || "ללא תפקיד"}</span>
              {worker.company && <span style={{ color: "#8B9DB5", fontSize: "0.82rem" }}>🏢 {worker.company}</span>}
              {activeProject && <span style={{ color: "#C9A84C", fontSize: "0.82rem" }}>📍 {activeProject.name}</span>}
              <span style={{ background: `${STATUS_COLORS[worker.status]}22`, color: STATUS_COLORS[worker.status], borderRadius: "0.4rem", padding: "0.15rem 0.6rem", fontSize: "0.75rem", fontWeight: 600 }}>{worker.status}</span>
            </div>
          </div>
          {worker.phone && (
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <a href={`tel:${worker.phone}`} style={{ ...btnGhost, textDecoration: "none", fontSize: "0.78rem" }}>📞 {worker.phone}</a>
              <a href={`https://wa.me/972${worker.phone.replace(/^0/, "")}`} target="_blank" rel="noreferrer" style={{ ...btnGold, textDecoration: "none", fontSize: "0.78rem" }}>💬 WhatsApp</a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0.3rem", marginBottom: "1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", borderBottom: activeTab === t.id ? "2px solid #C9A84C" : "2px solid transparent", color: activeTab === t.id ? "#C9A84C" : "#8B9DB5", padding: "0.6rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Assistant', sans-serif", fontWeight: activeTab === t.id ? 600 : 400, whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span>{t.icon}</span><span>{t.label}</span>
            {t.id === "assignments" && assignments.length > 0 && <span style={{ background: "#C9A84C", color: "#0D1B2E", borderRadius: "1rem", padding: "0 0.4rem", fontSize: "0.65rem", fontWeight: 700 }}>{assignments.length}</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && <OverviewTab worker={worker} onUpdate={() => { fetchWorker(); }} />}
      {activeTab === "assignments" && <AssignmentsTab worker={worker} projects={projects} assignments={assignments} onRefresh={fetchAssignments} />}
      {activeTab === "attendance" && <AttendanceTab worker={worker} />}
      {activeTab === "documents" && <DocumentsTab worker={worker} />}
      {activeTab === "payments" && <PaymentsTab worker={worker} />}
    </div>
  );
}