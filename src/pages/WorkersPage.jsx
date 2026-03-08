import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";

const fmt = (n) => !n ? "₪0" : `₪${Number(n).toLocaleString()}`;

const card = { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "1.2rem", padding: "1.2rem 1.5rem" };
const inputStyle = { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.6rem", color: "#E8E0D0", padding: "0.6rem 0.8rem", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif", outline: "none", boxSizing: "border-box" };
const btnGold = { background: "linear-gradient(135deg, #C9A84C, #8B6914)", border: "none", borderRadius: "0.75rem", color: "#0D1B2E", padding: "0.6rem 1.2rem", fontWeight: 700, cursor: "pointer", fontSize: "0.85rem", fontFamily: "'Assistant', sans-serif" };
const btnGhost = { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem", color: "#8B9DB5", padding: "0.5rem 1rem", cursor: "pointer", fontSize: "0.82rem", fontFamily: "'Assistant', sans-serif" };

const ROLES = ["קבלן", "פועל", "מנהל עבודה", "מהנדס", "אדריכל", "חשמלאי", "אינסטלטור", "טייח", "נגר", "פחחות ואיטום", "עגורנאי", "אחר"];
const STATUS_COLORS = { "פעיל": "#5CC98A", "לא פעיל": "#E05C5C", "בחופש": "#E0A84C", "בפרויקט": "#C9A84C" };

// ── Worker Modal ──────────────────────────────────────────────────────────
function WorkerModal({ worker, projects, onSave, onClose }) {
  const [form, setForm] = useState(worker || { name: "", role: "", phone: "", id_number: "", company: "", status: "פעיל", daily_rate: "", notes: "" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    if (form.id) {
      await supabase.from("workers").update({ ...form, daily_rate: Number(form.daily_rate) }).eq("id", form.id);
    } else {
      await supabase.from("workers").insert([{ ...form, daily_rate: Number(form.daily_rate) }]);
    }
    onSave();
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "500px", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontSize: "1.3rem" }}>{form.id ? "עריכת עובד" : "הוספת עובד"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B9DB5", cursor: "pointer", fontSize: "1.5rem" }}>×</button>
        </div>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          {[["name", "שם מלא *"], ["phone", "טלפון"], ["id_number", "ת.ז / מס׳ עובד"], ["company", "חברה / קבלן"], ["daily_rate", "שכר יומי (₪)"]].map(([k, p]) => (
            <div key={k}>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>{p}</label>
              <input type={k === "daily_rate" ? "number" : "text"} value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={inputStyle} placeholder={p} />
            </div>
          ))}
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תפקיד</label>
            <select value={form.role || ""} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} style={{ ...inputStyle }}>
              <option value="">בחר תפקיד</option>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>סטטוס</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle }}>
              {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>הערות</label>
            <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ ...inputStyle, height: "80px", resize: "vertical" }} placeholder="הערות נוספות..." />
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem" }}>
          <button onClick={save} disabled={saving} style={{ ...btnGold, flex: 1 }}>{saving ? "שומר..." : "💾 שמור"}</button>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Assignment Modal ──────────────────────────────────────────────────────
function AssignmentModal({ worker, projects, onSave, onClose }) {
  const [form, setForm] = useState({ project_id: "", role_in_project: worker.role || "", start_date: "", end_date: "", status: "פעיל" });
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!form.project_id) return;
    setSaving(true);
    await supabase.from("worker_assignments").insert([{ worker_id: worker.id, ...form }]);
    onSave();
    setSaving(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "420px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif", fontSize: "1.2rem" }}>שיוך {worker.name} לפרויקט</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B9DB5", cursor: "pointer", fontSize: "1.5rem" }}>×</button>
        </div>
        <div style={{ display: "grid", gap: "0.8rem" }}>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>פרויקט *</label>
            <select value={form.project_id} onChange={e => setForm(f => ({ ...f, project_id: e.target.value }))} style={{ ...inputStyle }}>
              <option value="">בחר פרויקט</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תפקיד בפרויקט</label>
            <input value={form.role_in_project} onChange={e => setForm(f => ({ ...f, role_in_project: e.target.value }))} style={inputStyle} placeholder="תפקיד" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תאריך התחלה</label>
              <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} />
            </div>
            <div>
              <label style={{ color: "#8B9DB5", fontSize: "0.75rem", display: "block", marginBottom: "0.3rem" }}>תאריך סיום</label>
              <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={inputStyle} />
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.5rem" }}>
          <button onClick={save} disabled={saving} style={{ ...btnGold, flex: 1 }}>{saving ? "שומר..." : "✅ שייך"}</button>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>ביטול</button>
        </div>
      </div>
    </div>
  );
}

// ── Worker Card ───────────────────────────────────────────────────────────
function WorkerCard({ worker, projects, assignments, onEdit, onDelete, onAssign }) {
  const workerAssignments = assignments.filter(a => a.worker_id === worker.id);
  const activeAssignment = workerAssignments.find(a => a.status === "פעיל");
  const project = activeAssignment ? projects.find(p => p.id === activeAssignment.project_id) : null;

  return (
    <div style={{ ...card, transition: "border-color 0.2s" }}
      onMouseEnter={e => e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "0.8rem", alignItems: "center" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: `linear-gradient(135deg, ${STATUS_COLORS[worker.status]}33, ${STATUS_COLORS[worker.status]}11)`, border: `2px solid ${STATUS_COLORS[worker.status]}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
            👷
          </div>
          <div>
            <div style={{ color: "#E8E0D0", fontWeight: 600, fontSize: "0.95rem" }}>{worker.name}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.75rem" }}>{worker.role} {worker.company ? `· ${worker.company}` : ""}</div>
          </div>
        </div>
        <span style={{ background: `${STATUS_COLORS[worker.status]}22`, color: STATUS_COLORS[worker.status], borderRadius: "0.4rem", padding: "0.15rem 0.6rem", fontSize: "0.72rem", fontWeight: 600 }}>{worker.status}</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem", marginTop: "0.8rem" }}>
        {worker.phone && <div style={{ fontSize: "0.78rem", color: "#B8C4D4" }}>📱 {worker.phone}</div>}
        {worker.daily_rate > 0 && <div style={{ fontSize: "0.78rem", color: "#C9A84C" }}>💰 {fmt(worker.daily_rate)}/יום</div>}
        {worker.id_number && <div style={{ fontSize: "0.78rem", color: "#8B9DB5" }}>🪪 {worker.id_number}</div>}
      </div>

      {project && (
        <div style={{ marginTop: "0.7rem", background: "rgba(201,168,76,0.08)", borderRadius: "0.5rem", padding: "0.4rem 0.7rem", fontSize: "0.75rem", color: "#C9A84C" }}>
          📍 {project.name} — {activeAssignment.role_in_project}
        </div>
      )}

      {workerAssignments.length > 0 && (
        <div style={{ marginTop: "0.5rem", fontSize: "0.72rem", color: "#8B9DB5" }}>
          {workerAssignments.length} שיוכים לפרויקטים
        </div>
      )}

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.8rem" }}>
        <button onClick={() => onAssign(worker)} style={{ background: "rgba(92,201,138,0.1)", border: "1px solid rgba(92,201,138,0.2)", borderRadius: "0.5rem", color: "#5CC98A", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.75rem" }}>+ שייך לפרויקט</button>
        <button onClick={() => onEdit(worker)} style={{ background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: "0.5rem", color: "#C9A84C", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.75rem" }}>✏️ ערוך</button>
        <button onClick={() => onDelete(worker.id)} style={{ background: "rgba(224,92,92,0.1)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: "0.5rem", color: "#E05C5C", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.75rem" }}>🗑️</button>
      </div>
    </div>
  );
}

// ── Makanat Import ────────────────────────────────────────────────────────
function MakanatImport({ onImport, onClose }) {
  const [step, setStep] = useState(1);
  const [csvData, setCsvData] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef();

  const parseCSV = (text) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    const sep = lines[0].includes("\t") ? "\t" : ",";
    const headers = lines[0].split(sep).map(h => h.trim().replace(/"/g, ""));
    return lines.slice(1).map(line => {
      const vals = line.split(sep).map(v => v.trim().replace(/"/g, ""));
      return Object.fromEntries(headers.map((h, i) => [h, vals[i] || ""]));
    }).filter(row => Object.values(row).some(v => v));
  };

  const parseExcel = (buffer) => {
    return new Promise((resolve) => {
      if (window.XLSX) {
        const wb = window.XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(window.XLSX.utils.sheet_to_json(ws, { defval: "" }));
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js";
      script.onload = () => {
        const wb = window.XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        resolve(window.XLSX.utils.sheet_to_json(ws, { defval: "" }));
      };
      script.onerror = () => resolve([]);
      document.head.appendChild(script);
    });
  };

  const handleFile = async (file) => {
    const isExcel = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");
    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const arr = new Uint8Array(buffer);
      const data = await parseExcel(arr);
      setCsvData(data);
      setStep(2);
    } else {
      const r = new FileReader();
      r.onload = e => {
        const data = parseCSV(e.target.result);
        setCsvData(data);
        setStep(2);
      };
      r.readAsText(file, "UTF-8");
    }
  };

  const findVal = (row, keys) => {
    for (const k of keys) {
      const found = Object.entries(row).find(([key]) => key.includes(k));
      if (found && found[1]) return String(found[1]).trim();
    }
    return "";
  };

  const mapWorker = (row) => {
    const name = findVal(row, ["שם", "name", "Name", "EMPLOYEE", "עובד"]) || Object.values(row).find(v => v && String(v).trim()) || "לא ידוע";
    return {
      name,
      phone: findVal(row, ["טלפון", "phone", "נייד", "mobile", "cel", "Phone"]),
      role: findVal(row, ["תפקיד", "role", "מקצוע", "job", "Job", "position", "Position"]),
      company: findVal(row, ["חברה", "company", "קבלן", "employer", "Employer"]),
      id_number: findVal(row, ["ת.ז", "תז", "id_number", "ID", "מספר", "passport"]),
      daily_rate: Number(findVal(row, ["שכר יומי", "שכר", "daily_rate", "rate", "salary"]).replace(/[^0-9.]/g, "") || 0),
      makanot_id: findVal(row, ["מזהה", "id_makanat", "worker_id", "workerid", "EmployeeID"]),
      notes: findVal(row, ["הערות", "notes", "remarks", "comment"]),
      status: "פעיל",
    };
  };

  const doImport = async () => {
    setImporting(true);
    const workers = csvData.map(mapWorker).filter(w => w.name && w.name !== "לא ידוע");
    for (const w of workers) {
      await supabase.from("workers").upsert([w], { onConflict: "makanot_id" });
    }
    onImport();
    setImporting(false);
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
      <div style={{ background: "#0D1B2E", border: "1px solid rgba(201,168,76,0.3)", borderRadius: "1.5rem", padding: "2rem", width: "100%", maxWidth: "580px", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ color: "#C9A84C", fontFamily: "'Playfair Display', serif" }}>ייבוא מ-מקאנו</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#8B9DB5", cursor: "pointer", fontSize: "1.5rem" }}>×</button>
        </div>

        {step === 1 && (
          <div>
            <div style={{ background: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: "0.8rem", padding: "1.2rem", marginBottom: "1.2rem" }}>
              <div style={{ color: "#C9A84C", fontWeight: 600, marginBottom: "0.5rem" }}>📋 איך לייצא ממקאנו:</div>
              <div style={{ color: "#B8C4D4", fontSize: "0.82rem", lineHeight: 1.8 }}>
                1. כנס לאתר מקאנו → לשונית <strong style={{ color: "#E8E0D0" }}>עובדים</strong><br />
                2. לחץ על <strong style={{ color: "#E8E0D0" }}>ייצוא / Export</strong><br />
                3. בחר פורמט <strong style={{ color: "#E8E0D0" }}>CSV</strong><br />
                4. העלה את הקובץ כאן ↓
              </div>
            </div>
            <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed rgba(201,168,76,0.3)", borderRadius: "0.8rem", padding: "2.5rem", textAlign: "center", cursor: "pointer" }}>
              <div style={{ fontSize: "2.5rem" }}>📂</div>
              <div style={{ color: "#C9A84C", fontWeight: 600, marginTop: "0.5rem" }}>לחץ להעלאת קובץ CSV</div>
              <div style={{ color: "#8B9DB5", fontSize: "0.75rem", marginTop: "0.3rem" }}>קובץ CSV / Excel מ-מקאנו</div>
            </div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        )}

        {step === 2 && (
          <div>
            <div style={{ color: "#5CC98A", marginBottom: "1rem", fontSize: "0.88rem" }}>✅ נמצאו {csvData.length} עובדים לייבוא</div>
            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.8rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                <thead>
                  <tr style={{ background: "rgba(201,168,76,0.1)" }}>
                    {["שם", "תפקיד", "טלפון", "חברה"].map(h => <th key={h} style={{ padding: "0.5rem", color: "#C9A84C", textAlign: "right" }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 10).map((row, i) => {
                    const w = mapWorker(row);
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <td style={{ padding: "0.5rem", color: "#E8E0D0" }}>{w.name}</td>
                        <td style={{ padding: "0.5rem", color: "#B8C4D4" }}>{w.role}</td>
                        <td style={{ padding: "0.5rem", color: "#8B9DB5" }}>{w.phone}</td>
                        <td style={{ padding: "0.5rem", color: "#8B9DB5" }}>{w.company}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {csvData.length > 10 && <div style={{ textAlign: "center", color: "#8B9DB5", padding: "0.5rem", fontSize: "0.75rem" }}>ועוד {csvData.length - 10} עובדים...</div>}
            </div>
            <div style={{ display: "flex", gap: "0.8rem", marginTop: "1.2rem" }}>
              <button onClick={doImport} disabled={importing} style={{ ...btnGold, flex: 1 }}>{importing ? "מייבא..." : `📥 ייבא ${csvData.length} עובדים`}</button>
              <button onClick={() => setStep(1)} style={{ ...btnGhost }}>חזור</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Workers Page ─────────────────────────────────────────────────────
export default function WorkersPage({ projects }) {
  const [workers, setWorkers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("הכל");
  const [filterStatus, setFilterStatus] = useState("הכל");
  const [view, setView] = useState("grid");

  const fetchAll = async () => {
    setLoading(true);
    const [w, a] = await Promise.all([
      supabase.from("workers").select("*").order("name"),
      supabase.from("worker_assignments").select("*"),
    ]);
    setWorkers(w.data || []);
    setAssignments(a.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteWorker = async (id) => {
    if (!window.confirm("למחוק עובד זה?")) return;
    await supabase.from("workers").delete().eq("id", id);
    fetchAll();
  };

  const filtered = workers.filter(w => {
    const matchSearch = !search || w.name.includes(search) || (w.phone || "").includes(search) || (w.company || "").includes(search);
    const matchRole = filterRole === "הכל" || w.role === filterRole;
    const matchStatus = filterStatus === "הכל" || w.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const stats = {
    total: workers.length,
    active: workers.filter(w => w.status === "פעיל").length,
    assigned: new Set(assignments.filter(a => a.status === "פעיל").map(a => a.worker_id)).size,
    totalCost: workers.reduce((s, w) => s + (Number(w.daily_rate) || 0), 0),
  };

  return (
    <div dir="rtl" style={{ fontFamily: "'Assistant', sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Assistant:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap'); @media(max-width:600px){.workers-grid{grid-template-columns:1fr!important}.workers-stats{grid-template-columns:1fr 1fr!important}}`}</style>

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.8rem", color: "#E8E0D0", marginBottom: "0.2rem" }}>ניהול עובדים</h1>
          <div style={{ color: "#8B9DB5", fontSize: "0.85rem" }}>{workers.length} עובדים במערכת</div>
        </div>
        <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
          <button onClick={() => setShowImport(true)} style={{ ...btnGhost, fontSize: "0.8rem" }}>📥 ייבוא מ-מקאנו</button>
          <button onClick={() => setModal({})} style={btnGold}>+ עובד חדש</button>
        </div>
      </div>

      {/* Stats */}
      <div className="workers-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
        {[
          { icon: "👷", label: "סה״כ עובדים", value: stats.total, color: "#C9A84C" },
          { icon: "✅", label: "פעילים", value: stats.active, color: "#5CC98A" },
          { icon: "📍", label: "משויכים לפרויקט", value: stats.assigned, color: "#B8C4D4" },
          { icon: "💰", label: "עלות יומית כוללת", value: fmt(stats.totalCost), color: "#E0A84C" },
        ].map(s => (
          <div key={s.label} style={{ ...card, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem" }}>{s.icon}</div>
            <div style={{ color: s.color, fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>{s.value}</div>
            <div style={{ color: "#8B9DB5", fontSize: "0.7rem" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ ...card, marginBottom: "1.2rem", display: "flex", gap: "0.8rem", flexWrap: "wrap", alignItems: "center" }}>
        <input value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, width: "200px" }} placeholder="🔍 חיפוש עובד..." />
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, width: "140px" }}>
          <option value="הכל">כל התפקידים</option>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: "130px" }}>
          <option value="הכל">כל הסטטוסים</option>
          {Object.keys(STATUS_COLORS).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginRight: "auto", display: "flex", gap: "0.4rem" }}>
          {["grid", "table"].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.03)", border: `1px solid ${view === v ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: "0.5rem", color: view === v ? "#C9A84C" : "#8B9DB5", padding: "0.3rem 0.7rem", cursor: "pointer", fontSize: "0.78rem" }}>
              {v === "grid" ? "⊞ כרטיסים" : "☰ טבלה"}
            </button>
          ))}
        </div>
      </div>

      {/* Workers List */}
      {loading ? (
        <div style={{ textAlign: "center", color: "#8B9DB5", padding: "3rem" }}>טוען עובדים...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: "center", padding: "3rem", color: "#8B9DB5" }}>
          <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>👷</div>
          <div>אין עובדים — הוסף עובד חדש או ייבא ממקאנו</div>
        </div>
      ) : view === "grid" ? (
        <div className="workers-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1rem" }}>
          {filtered.map(w => (
            <WorkerCard key={w.id} worker={w} projects={projects} assignments={assignments} onEdit={setModal} onDelete={deleteWorker} onAssign={setAssignModal} />
          ))}
        </div>
      ) : (
        <div style={card}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.2)" }}>
                  {["שם", "תפקיד", "חברה", "טלפון", "שכר יומי", "סטטוס", "פרויקט פעיל", "פעולות"].map(h => (
                    <th key={h} style={{ color: "#C9A84C", padding: "0.6rem 0.5rem", textAlign: "right", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(w => {
                  const activeAssignment = assignments.find(a => a.worker_id === w.id && a.status === "פעיל");
                  const project = activeAssignment ? projects.find(p => p.id === activeAssignment.project_id) : null;
                  return (
                    <tr key={w.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#E8E0D0", fontWeight: 600 }}>{w.name}</td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#B8C4D4" }}>{w.role}</td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#8B9DB5" }}>{w.company}</td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#B8C4D4" }}>{w.phone}</td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#C9A84C" }}>{fmt(w.daily_rate)}</td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <span style={{ background: `${STATUS_COLORS[w.status]}22`, color: STATUS_COLORS[w.status], borderRadius: "0.3rem", padding: "0.1rem 0.4rem", fontSize: "0.72rem" }}>{w.status}</span>
                      </td>
                      <td style={{ padding: "0.6rem 0.5rem", color: "#8B9DB5", fontSize: "0.78rem" }}>{project?.name || "-"}</td>
                      <td style={{ padding: "0.6rem 0.5rem" }}>
                        <div style={{ display: "flex", gap: "0.3rem" }}>
                          <button onClick={() => setAssignModal(w)} style={{ background: "rgba(92,201,138,0.1)", border: "none", borderRadius: "0.3rem", color: "#5CC98A", padding: "0.2rem 0.4rem", cursor: "pointer", fontSize: "0.72rem" }}>+ שייך</button>
                          <button onClick={() => setModal(w)} style={{ background: "rgba(201,168,76,0.1)", border: "none", borderRadius: "0.3rem", color: "#C9A84C", padding: "0.2rem 0.4rem", cursor: "pointer", fontSize: "0.72rem" }}>✏️</button>
                          <button onClick={() => deleteWorker(w.id)} style={{ background: "rgba(224,92,92,0.1)", border: "none", borderRadius: "0.3rem", color: "#E05C5C", padding: "0.2rem 0.4rem", cursor: "pointer", fontSize: "0.72rem" }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {modal !== null && <WorkerModal worker={modal?.id ? modal : null} projects={projects} onSave={() => { fetchAll(); setModal(null); }} onClose={() => setModal(null)} />}
      {assignModal && <AssignmentModal worker={assignModal} projects={projects} onSave={() => { fetchAll(); setAssignModal(null); }} onClose={() => setAssignModal(null)} />}
      {showImport && <MakanatImport onImport={() => { fetchAll(); setShowImport(false); }} onClose={() => setShowImport(false)} />}
    </div>
  );
}