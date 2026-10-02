import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Trash2,
  Check,
  Pencil,
  ListChecks,
  Search,
  X,
  CalendarDays,
} from "lucide-react";

/* ---------- Constants ---------- */

const PRIORITIES = {
  low: {
    label: "ต่ำ",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    active: "bg-emerald-500 text-white border-emerald-500",
    bar: "border-l-emerald-400",
  },
  medium: {
    label: "ปานกลาง",
    badge: "bg-amber-50 text-amber-700 ring-amber-200",
    active: "bg-amber-500 text-white border-amber-500",
    bar: "border-l-amber-400",
  },
  high: {
    label: "สูง",
    badge: "bg-rose-50 text-rose-700 ring-rose-200",
    active: "bg-rose-500 text-white border-rose-500",
    bar: "border-l-rose-400",
  },
};
const ORDER = ["low", "medium", "high"];

const CATEGORIES = {
  work: { label: "งาน", dot: "bg-sky-500", tag: "bg-sky-50 text-sky-700 ring-sky-200" },
  personal: { label: "ส่วนตัว", dot: "bg-violet-500", tag: "bg-violet-50 text-violet-700 ring-violet-200" },
  shopping: { label: "ช้อปปิ้ง", dot: "bg-pink-500", tag: "bg-pink-50 text-pink-700 ring-pink-200" },
  health: { label: "สุขภาพ", dot: "bg-teal-500", tag: "bg-teal-50 text-teal-700 ring-teal-200" },
};
const CAT_KEYS = Object.keys(CATEGORIES);

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

/* ---------- Date helpers (local time, ISO yyyy-mm-dd) ---------- */

const pad = (n) => String(n).padStart(2, "0");
const toISO = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isoFromToday = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return toISO(d);
};
const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
  });

// "overdue" | "today" | "normal" | null
const dueStatus = (todo, today) => {
  if (!todo.due) return null;
  if (todo.done) return "normal";
  if (todo.due < today) return "overdue";
  if (todo.due === today) return "today";
  return "normal";
};

/* ---------- Donut chart ---------- */

function Donut({ segments, total, percent }) {
  const R = 38;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-28 w-28 shrink-0" role="img" aria-label="สัดส่วนสถานะงาน">
      <g transform="rotate(-90 50 50)">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        {total > 0 &&
          segments.map((s) => {
            const len = (s.value / total) * C;
            const el = (
              <circle
                key={s.key}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDasharray={`${len} ${C - len}`}
                strokeDashoffset={-acc}
                style={{ transition: "all 400ms ease" }}
              />
            );
            acc += len;
            return el;
          })}
      </g>
      <text x="50" y="55" textAnchor="middle" fontSize="18" fontWeight="700" fill="#1e293b">
        {percent}%
      </text>
    </svg>
  );
}

/* ---------- Main component ---------- */

export default function TodoApp() {
  const [todos, setTodos] = useState(() => [
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high", category: "work", due: isoFromToday(-1) },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium", category: "shopping", due: isoFromToday(0) },
    { id: 3, text: "วิ่งออกกำลังกาย 30 นาที", done: true, priority: "low", category: "health", due: isoFromToday(0) },
    { id: 4, text: "นัดหมอฟัน", done: false, priority: "medium", category: "health", due: isoFromToday(3) },
    { id: 5, text: "อ่านหนังสือ 20 หน้า", done: false, priority: "low", category: "personal", due: "" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [due, setDue] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [editDue, setEditDue] = useState("");
  const [removing, setRemoving] = useState([]);
  const nextId = useRef(6);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) editRef.current.focus();
  }, [editingId]);

  const today = toISO(new Date());

  /* ----- actions ----- */

  const addTodo = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      { id: nextId.current++, text: t, done: false, priority, category, due },
      ...prev,
    ]);
    setText("");
    setDue("");
  };

  const toggle = (id) =>
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const removeWithAnimation = (ids) => {
    if (ids.length === 0) return;
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((r) => r.filter((x) => !ids.includes(x)));
    }, 300);
  };

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] } : t
      )
    );

  const cycleCategory = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, category: CAT_KEYS[(CAT_KEYS.indexOf(t.category) + 1) % CAT_KEYS.length] }
          : t
      )
    );

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDue(todo.due || "");
  };

  const saveEdit = () => {
    const t = editText.trim();
    if (t) {
      setTodos((prev) =>
        prev.map((x) => (x.id === editingId ? { ...x, text: t, due: editDue } : x))
      );
    }
    setEditingId(null);
  };

  /* ----- derived data ----- */

  const total = todos.length;
  const doneCount = todos.filter((t) => t.done).length;
  const remaining = total - doneCount;
  const overdueCount = todos.filter((t) => dueStatus(t, today) === "overdue").length;
  const activeCount = remaining - overdueCount;
  const percent = total ? Math.round((doneCount / total) * 100) : 0;

  const segments = [
    { key: "done", label: "เสร็จแล้ว", value: doneCount, color: "#6366f1" },
    { key: "active", label: "กำลังทำ", value: activeCount, color: "#94a3b8" },
    { key: "overdue", label: "เลยกำหนด", value: overdueCount, color: "#f43f5e" },
  ];

  const q = query.trim().toLowerCase();
  const visible = todos.filter((t) => {
    if (filter === "active" && t.done) return false;
    if (filter === "completed" && !t.done) return false;
    if (catFilter !== "all" && t.category !== catFilter) return false;
    if (q && !t.text.toLowerCase().includes(q)) return false;
    return true;
  });

  const emptyText = q
    ? `ไม่พบงานที่ตรงกับ "${query.trim()}"`
    : filter === "completed"
    ? "ยังไม่มีงานที่เสร็จ"
    : filter === "active"
    ? "ไม่มีงานที่ค้างอยู่ ยอดเยี่ยมมาก!"
    : "ยังไม่มีงานในหมวดนี้ เพิ่มงานใหม่ด้านบนได้เลย";

  /* ----- render ----- */

  return (
    <div
      className="min-h-screen w-full bg-slate-100 px-4 py-8 sm:py-12"
      style={{
        fontFamily:
          "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-md">
            <ListChecks size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จัดการงานประจำวันอย่างเป็นระเบียบ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[17rem_minmax(0,1fr)]">
          {/* ---------- Sidebar ---------- */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            {/* Categories */}
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-3 font-bold text-slate-800">หมวดหมู่</h2>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                {[["all", { label: "ทั้งหมด", dot: "bg-slate-400" }], ...Object.entries(CATEGORIES)].map(
                  ([key, c]) => {
                    const count =
                      key === "all" ? total : todos.filter((t) => t.category === key).length;
                    const active = catFilter === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setCatFilter(key)}
                        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition ${
                          active
                            ? "bg-indigo-600 font-medium text-white shadow"
                            : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${c.dot}`} />
                        <span className="flex-1">{c.label}</span>
                        <span
                          className={`rounded-full px-2 text-xs ${
                            active ? "bg-white/25 text-white" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className="rounded-2xl bg-white p-4 shadow-md">
              <h2 className="mb-3 font-bold text-slate-800">สถิติ</h2>
              <div className="flex items-center gap-4">
                <Donut segments={segments} total={total} percent={percent} />
                <ul className="min-w-0 flex-1 space-y-1.5 text-sm">
                  {segments.map((s) => (
                    <li key={s.key} className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="flex-1">{s.label}</span>
                      <span className="font-medium text-slate-800">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="mt-3 flex justify-between border-t border-slate-100 pt-3 text-sm text-slate-600">
                <span>
                  งานทั้งหมด <strong className="text-slate-800">{total}</strong>
                </span>
                <span>
                  สำเร็จ <strong className="text-slate-800">{percent}%</strong>
                </span>
              </div>
            </div>
          </aside>

          {/* ---------- Main ---------- */}
          <main className="min-w-0">
            {/* Add form */}
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-md">
              <div className="flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTodo()}
                  placeholder="เพิ่มงานใหม่..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100"
                />
                <button
                  onClick={addTodo}
                  disabled={!text.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">เพิ่ม</span>
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 text-sm text-slate-500">ความสำคัญ:</span>
                  {ORDER.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`rounded-full border px-3 py-1 text-sm transition ${
                        priority === p
                          ? PRIORITIES[p].active
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {PRIORITIES[p].label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 text-sm text-slate-500">หมวดหมู่:</span>
                  {CAT_KEYS.map((k) => (
                    <button
                      key={k}
                      onClick={() => setCategory(k)}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                        category === k
                          ? "border-indigo-600 bg-indigo-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${CATEGORIES[k].dot}`} />
                      {CATEGORIES[k].label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-20 text-sm text-slate-500">กำหนดส่ง:</span>
                  <input
                    type="date"
                    value={due}
                    onChange={(e) => setDue(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                  />
                  {due && (
                    <button
                      onClick={() => setDue("")}
                      className="text-sm text-slate-400 hover:text-slate-600"
                    >
                      ล้างวันที่
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหางาน..."
                className="w-full rounded-xl bg-white py-2.5 pl-11 pr-10 text-slate-800 placeholder-slate-400 shadow-md outline-none focus:ring-2 focus:ring-indigo-200"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="ล้างการค้นหา"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Status tabs */}
            <div className="mb-4 flex rounded-xl bg-white p-1 shadow-md">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`flex-1 rounded-lg px-2 py-2 text-sm font-medium transition ${
                    filter === f.key
                      ? "bg-indigo-600 text-white shadow"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* List */}
            <div>
              {visible.length === 0 && (
                <div className="rounded-2xl bg-white px-6 py-10 text-center text-slate-500 shadow-md">
                  {emptyText}
                </div>
              )}

              {visible.map((todo) => {
                const p = PRIORITIES[todo.priority];
                const cat = CATEGORIES[todo.category];
                const status = dueStatus(todo, today);
                const isRemoving = removing.includes(todo.id);
                const isEditing = editingId === todo.id;

                const dueClass =
                  status === "overdue"
                    ? "bg-red-100 text-red-700 ring-red-300"
                    : status === "today"
                    ? "bg-yellow-100 text-yellow-800 ring-yellow-300"
                    : "bg-slate-100 text-slate-600 ring-slate-200";
                const dueLabel =
                  status === "overdue"
                    ? `เลยกำหนด ${formatDate(todo.due)}`
                    : status === "today"
                    ? "ครบกำหนดวันนี้"
                    : todo.due
                    ? formatDate(todo.due)
                    : "";

                return (
                  <div
                    key={todo.id}
                    style={{
                      maxHeight: isRemoving ? 0 : 260,
                      opacity: isRemoving ? 0 : 1,
                      transform: isRemoving ? "translateX(32px)" : "translateX(0)",
                      marginBottom: isRemoving ? 0 : 12,
                      overflow: isRemoving ? "hidden" : "visible",
                      transition: "all 300ms ease",
                    }}
                  >
                    <div
                      className={`flex items-start gap-3 rounded-2xl border-l-4 bg-white p-3 shadow-md sm:p-4 ${p.bar}`}
                    >
                      <button
                        onClick={() => toggle(todo.id)}
                        aria-label="ทำเครื่องหมายว่าเสร็จ"
                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                          todo.done
                            ? "border-indigo-600 bg-indigo-600 text-white"
                            : "border-slate-300 bg-white hover:border-indigo-400"
                        }`}
                      >
                        {todo.done && <Check size={16} strokeWidth={3} />}
                      </button>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <div
                            className="space-y-2"
                            onBlur={(e) => {
                              if (!e.currentTarget.contains(e.relatedTarget)) saveEdit();
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit();
                              if (e.key === "Escape") setEditingId(null);
                            }}
                          >
                            <input
                              ref={editRef}
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-slate-800 outline-none ring-2 ring-indigo-100"
                            />
                            <input
                              type="date"
                              value={editDue}
                              onChange={(e) => setEditDue(e.target.value)}
                              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 outline-none focus:border-indigo-400"
                            />
                          </div>
                        ) : (
                          <p
                            onDoubleClick={() => startEdit(todo)}
                            title="ดับเบิลคลิกเพื่อแก้ไข"
                            className={`cursor-text select-none break-words text-slate-800 ${
                              todo.done ? "text-slate-400 line-through" : ""
                            }`}
                          >
                            {todo.text}
                          </p>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => cyclePriority(todo.id)}
                            title="คลิกเพื่อเปลี่ยนความสำคัญ"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                          >
                            {p.label}
                          </button>
                          <button
                            onClick={() => cycleCategory(todo.id)}
                            title="คลิกเพื่อเปลี่ยนหมวดหมู่"
                            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cat.tag}`}
                          >
                            {cat.label}
                          </button>
                          {todo.due && (
                            <span
                              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${dueClass}`}
                            >
                              <CalendarDays size={12} />
                              {dueLabel}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center">
                        <button
                          onClick={() => startEdit(todo)}
                          aria-label="แก้ไข"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          onClick={() => removeWithAnimation([todo.id])}
                          aria-label="ลบ"
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-md">
              <span className="text-sm text-slate-600">
                เหลืออีก <strong className="text-slate-800">{remaining}</strong> งานที่ต้องทำ
              </span>
              <button
                onClick={() => removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id))}
                disabled={doneCount === 0}
                className="text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300"
              >
                ล้างที่เสร็จแล้ว ({doneCount})
              </button>
            </div>

            <p className="mt-4 text-center text-xs text-slate-400">
              เคล็ดลับ: ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญหรือหมวดหมู่เพื่อสลับ
            </p>
          </main>
        </div>
      </div>
    </div>
  );
}
