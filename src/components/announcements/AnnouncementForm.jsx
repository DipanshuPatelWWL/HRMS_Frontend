import { useState, useEffect } from "react";
import API from "../../services/api";
import EmployeeMultiSelect from "../announcements/UserMultiSelect";
import { toast } from "react-toastify";
import StopwatchLoader from "../common/StopwatchLoader";

const AnnouncementForm = ({ onSuccess, employees = [], editTarget = null, onCancelEdit }) => {
  const [form, setForm] = useState({
    title: "",
    body: "",
    targetRoles: [],
    targetUsers: [],
    important: false,
    pinned: false,
  });
  const [loading, setLoading] = useState(false);

  const isEditing = Boolean(editTarget);

  useEffect(() => {
    if (editTarget) {
      setForm({
        title: editTarget.title ?? "",
        body: editTarget.body ?? "",
        targetRoles: editTarget.targetRoles ?? [],
        targetUsers: (editTarget.targetUsers ?? []).map((u) =>
          typeof u === "object" ? u._id : u
        ),
        important: editTarget.important ?? false,
        pinned: editTarget.pinned ?? false,
      });
    } else {
      setForm({ title: "", body: "", targetRoles: [], targetUsers: [], important: false, pinned: false });
    }
  }, [editTarget]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isEditing) {
        await API.put(`/announcements/${editTarget._id}`, form);
        toast.success("Announcement updated!");
      } else {
        await API.post("/announcements", form);
        toast.success("Announcement published!");
      }
      setForm({ title: "", body: "", targetRoles: [], targetUsers: [], important: false, pinned: false });
      onSuccess();
    } catch (err) {
      toast.error(err?.response?.data?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .af-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          border: 1px solid #f1f5f9;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          margin-bottom: 24px;
        }

        .af-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .af-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .af-title {
          margin: 0;
          font-size: 17px;
          font-weight: 700;
          color: #0a0f1e;
        }

        .af-edit-badge {
          background: #fffbeb;
          border: 1px solid #fde68a;
          color: #b45309;
          font-size: 11px;
          font-weight: 700;
          padding: 3px 10px;
          border-radius: 20px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .af-cancel-btn {
          padding: 7px 14px;
          background: #f1f5f9;
          color: #0a0f1e;
          border: none;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: background 0.12s;
        }
        .af-cancel-btn:hover { background: #e2e8f0; }

        .af-form { display: flex; flex-direction: column; gap: 14px; }

        .af-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          color: #0a0f1e;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .af-input,
        .af-textarea,
        .af-select {
          width: 100%;
          padding: 11px 14px;
          border-radius: 10px;
          border: 1.5px solid #e2e8f0;
          font-size: 14px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #0a0f1e;
          outline: none;
          background: #f8fafc;
          box-sizing: border-box;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-weight: 500;
        }
        .af-input:focus,
        .af-textarea:focus,
        .af-select:focus {
          border-color: #3b5bdb;
          box-shadow: 0 0 0 3px rgba(59,91,219,0.12);
          background: white;
        }
          .af-role-select {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.af-role-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: #f8fafc;
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.af-role-pill:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
  background: #eff6ff;
}
.af-role-pill.active {
  background: #eff6ff;
  border-color: #3b5bdb;
  color: #1d4ed8;
}
.af-role-pill-check {
  width: 16px;
  height: 16px;
  border-radius: 5px;
  border: 2px solid #cbd5e1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  background: white;
  flex-shrink: 0;
  transition: all 0.15s;
}
.af-role-pill.active .af-role-pill-check {
  background: #3b5bdb;
  border-color: #3b5bdb;
  color: white;
}
        .af-input::placeholder,
        .af-textarea::placeholder { color: #94a3b8; }

        .af-textarea {
          resize: vertical;
          min-height: 110px;
          line-height: 1.6;
        }

        .af-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233b5bdb' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          cursor: pointer;
        }

        .af-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          flex-wrap: wrap;
        }

        .af-row-select { flex: 1; min-width: 160px; }

        .af-toggles {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .af-toggle {
          display: flex;
          align-items: center;
          gap: 7px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all 0.15s;
          user-select: none;
          white-space: nowrap;
        }
        .af-toggle:hover {
          border-color: #93c5fd;
          color: #1d4ed8;
          background: #eff6ff;
        }
        .af-toggle.active {
          background: #eff6ff;
          border-color: #93c5fd;
          color: #1d4ed8;
        }

        .af-toggle-box {
          width: 16px;
          height: 16px;
          border-radius: 5px;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          background: white;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .af-toggle.active .af-toggle-box {
          background: #3b5bdb;
          border-color: #3b5bdb;
          color: white;
        }

        .af-submit {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #3b5bdb, #4c6ef5);
          border: none;
          border-radius: 10px;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(59,91,219,0.3);
          transition: transform 0.12s, box-shadow 0.12s, opacity 0.12s;
          margin-top: 2px;
        }
        .af-submit:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(59,91,219,0.4);
        }
        .af-submit:active:not(:disabled) { transform: none; box-shadow: none; }
        .af-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        /* ── Responsive ── */
        @media (max-width: 600px) {
          .af-card { padding: 16px; border-radius: 16px; }
          .af-title { font-size: 15px; }
          .af-row { flex-direction: column; }
          .af-row-select { width: 100%; }
          .af-toggles { width: 100%; }
          .af-toggle { flex: 1; justify-content: center; }
        }

        @media (max-width: 380px) {
          .af-card { padding: 14px 12px; }
          .af-toggle { padding: 9px 10px; font-size: 12px; }
        }
      `}</style>

      <div className="af-card">
        {/* Header */}
        <div className="af-header">
          <div className="af-header-left">
            <h3 className="af-title">
              {isEditing ? "Edit Announcement" : "New Announcement"}
            </h3>
            {isEditing && <span className="af-edit-badge">Editing</span>}
          </div>
          {isEditing && (
            <button className="af-cancel-btn" type="button" onClick={onCancelEdit}>
              ✕ Cancel
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={submit} className="af-form">
          {/* Title */}
          <div>
            <label className="af-label">Title</label>
            <input
              className="af-input"
              placeholder="Announcement title…"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label className="af-label">Message</label>
            <textarea
              className="af-textarea"
              placeholder="Write your message here…"
              value={form.body}
              onChange={(e) => set("body", e.target.value)}
              required
            />
          </div>

          {/* Role + Toggles */}
          <div>
            <label className="af-label">Target Audience</label>
            <div className="af-role-select" style={{ marginBottom: "10px" }}>
              {[
                { value: "all", label: "All roles" },
                { value: "employee", label: "Employee" },
                { value: "hr", label: "HR" },
                { value: "manager", label: "Manager" },
                { value: "tl", label: "Team Lead" },
              ].map(({ value, label }) => {
                const isActive = form.targetRoles.includes(value);
                return (
                  <div
                    key={value}
                    className={`af-role-pill ${isActive ? "active" : ""}`}
                    onClick={() =>
                      set(
                        "targetRoles",
                        isActive
                          ? form.targetRoles.filter((r) => r !== value)
                          : [...form.targetRoles, value]
                      )
                    }
                  >
                    <span className="af-role-pill-check">{isActive ? "✓" : ""}</span>
                    {label}
                  </div>
                );
              })}

              <div className="af-toggles">
                {[
                  { key: "important", emoji: "🔥", label: "Important" },
                  { key: "pinned", emoji: "📌", label: "Pinned" },
                ].map(({ key, emoji, label }) => (
                  <div
                    key={key}
                    className={`af-toggle ${form[key] ? "active" : ""}`}
                    onClick={() => set(key, !form[key])}
                  >
                    <span className="af-toggle-box">{form[key] ? "✓" : ""}</span>
                    {emoji} {label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Employee multi-select */}
          <div>
            <label className="af-label">Specific Users (optional)</label>
            <EmployeeMultiSelect
              value={form.targetUsers}
              onChange={(val) => set("targetUsers", val)}
              employees={employees}
            />
          </div>

          {/* Submit */}
          <button className="af-submit" type="submit" disabled={loading}>
            {loading && <StopwatchLoader />}
            {loading
              ? isEditing ? "Updating…" : "Publishing…"
              : isEditing ? "Update Announcement" : "Publish Announcement"}
          </button>
        </form >
      </div >
    </>
  );
};

export default AnnouncementForm;