import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, Pencil, ListChecks } from "lucide-react";

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

const FILTERS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "active", label: "ยังไม่เสร็จ" },
  { key: "completed", label: "เสร็จแล้ว" },
];

const EMPTY_TEXT = {
  all: "ยังไม่มีงาน เพิ่มงานแรกของคุณด้านบนได้เลย",
  active: "ไม่มีงานที่ค้างอยู่ ยอดเยี่ยมมาก!",
  completed: "ยังไม่มีงานที่เสร็จ",
};

export default function TodoApp() {
  const [todos, setTodos] = useState([
    { id: 1, text: "ส่งรายงานประจำสัปดาห์", done: false, priority: "high" },
    { id: 2, text: "ซื้อของเข้าบ้าน", done: false, priority: "medium" },
    { id: 3, text: "อ่านหนังสือ 20 หน้า", done: true, priority: "low" },
  ]);
  const [text, setText] = useState("");
  const [priority, setPriority] = useState("medium");
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const [removing, setRemoving] = useState([]);
  const nextId = useRef(4);
  const editRef = useRef(null);

  useEffect(() => {
    if (editingId !== null && editRef.current) editRef.current.focus();
  }, [editingId]);

  const addTodo = () => {
    const t = text.trim();
    if (!t) return;
    setTodos((prev) => [
      { id: nextId.current++, text: t, done: false, priority },
      ...prev,
    ]);
    setText("");
  };

  const toggle = (id) =>
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const removeWithAnimation = (ids) => {
    setRemoving((r) => [...r, ...ids]);
    setTimeout(() => {
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemoving((r) => r.filter((x) => !ids.includes(x)));
    }, 300);
  };

  const cyclePriority = (id) =>
    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, priority: ORDER[(ORDER.indexOf(t.priority) + 1) % 3] }
          : t
      )
    );

  const startEdit = (todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const saveEdit = () => {
    const t = editText.trim();
    if (t) {
      setTodos((prev) =>
        prev.map((x) => (x.id === editingId ? { ...x, text: t } : x))
      );
    }
    setEditingId(null);
  };

  const remaining = todos.filter((t) => !t.done).length;
  const completedCount = todos.length - remaining;
  const visible = todos.filter((t) =>
    filter === "all" ? true : filter === "active" ? !t.done : t.done
  );

  return (
    <div
      className="min-h-screen w-full bg-slate-100 px-4 py-8 sm:py-12"
      style={{
        fontFamily:
          "'Noto Sans Thai', 'Sarabun', 'Leelawadee UI', Tahoma, system-ui, sans-serif",
      }}
    >
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-indigo-600 shadow-md">
            <ListChecks size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">รายการงานของฉัน</h1>
            <p className="text-sm text-slate-500">จัดการงานประจำวันอย่างเป็นระเบียบ</p>
          </div>
        </div>

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
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500">ความสำคัญ:</span>
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
        </div>

        {/* Filter tabs */}
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
              {EMPTY_TEXT[filter]}
            </div>
          )}

          {visible.map((todo) => {
            const p = PRIORITIES[todo.priority];
            const isRemoving = removing.includes(todo.id);
            return (
              <div
                key={todo.id}
                style={{
                  maxHeight: isRemoving ? 0 : 220,
                  opacity: isRemoving ? 0 : 1,
                  transform: isRemoving ? "translateX(32px)" : "translateX(0)",
                  marginBottom: isRemoving ? 0 : 12,
                  overflow: isRemoving ? "hidden" : "visible",
                  transition: "all 300ms ease",
                }}
              >
                <div
                  className={`flex items-center gap-3 rounded-2xl border-l-4 bg-white p-3 shadow-md sm:p-4 ${p.bar}`}
                >
                  <button
                    onClick={() => toggle(todo.id)}
                    aria-label="ทำเครื่องหมายว่าเสร็จ"
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition ${
                      todo.done
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 bg-white hover:border-indigo-400"
                    }`}
                  >
                    {todo.done && <Check size={16} strokeWidth={3} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    {editingId === todo.id ? (
                      <input
                        ref={editRef}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full rounded-lg border border-indigo-300 bg-white px-2 py-1 text-slate-800 outline-none ring-2 ring-indigo-100"
                      />
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
                  </div>

                  <button
                    onClick={() => cyclePriority(todo.id)}
                    title="คลิกเพื่อเปลี่ยนความสำคัญ"
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${p.badge}`}
                  >
                    {p.label}
                  </button>

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
            onClick={() =>
              removeWithAnimation(todos.filter((t) => t.done).map((t) => t.id))
            }
            disabled={completedCount === 0}
            className="text-sm font-medium text-rose-600 transition hover:text-rose-700 disabled:cursor-not-allowed disabled:text-slate-300"
          >
            ล้างที่เสร็จแล้ว ({completedCount})
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          เคล็ดลับ: ดับเบิลคลิกที่ข้อความเพื่อแก้ไข · คลิกป้ายความสำคัญเพื่อสลับระดับ
        </p>
      </div>
    </div>
  );
}
