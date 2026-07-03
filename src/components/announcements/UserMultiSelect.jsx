import { useState, useRef, useEffect } from "react";
import { formatRole } from "../../utils/roleFormatter";

const styles = `
  .emp-select-wrap { position: relative; width: 100%; font-family: 'Nunito', sans-serif; }

  .emp-select-trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 14px;
    cursor: pointer;
    font-family: 'Nunito', sans-serif;
    font-size: 0.9rem;
    color: #1e1e2e;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    text-align: left;
    min-height: 46px;
  }
  .emp-select-trigger:hover { border-color: #a78bfa; background: #fff; }
  .emp-select-trigger.open {
    border-color: #7c3aed;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(124,58,237,0.1);
  }

  .emp-trigger-left {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    flex: 1;
    min-width: 0;
  }

  .emp-chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, rgba(124,58,237,0.1), rgba(219,39,119,0.07));
    border: 1px solid rgba(124,58,237,0.22);
    color: #6d28d9;
    padding: 3px 9px 3px 8px;
    border-radius: 100px;
    font-size: 0.78rem;
    font-weight: 700;
    white-space: nowrap;
    animation: chipIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
  }

 .emp-chip-remove {
    color: #a78bfa;
    cursor: pointer;
    font-size: 0.72rem;
    line-height: 1;
    margin-left: 2px;
    transition: color 0.15s, transform 0.15s;
    display: flex;
    align-items: center;
    user-select: none;
}
  .emp-chip-remove:hover { color: #db2777; transform: scale(1.2); }

  .emp-trigger-placeholder { color: #94a3b8; font-size: 0.88rem; }

  .emp-chevron {
    flex-shrink: 0;
    color: #94a3b8;
    transition: transform 0.25s, color 0.2s;
  }
  .emp-select-trigger.open .emp-chevron { transform: rotate(180deg); color: #7c3aed; }

  /* ---- Dropdown ---- */
  .emp-dropdown {
    position: absolute;
    top: calc(100% + 6px);
    left: 0; right: 0;
    background: #fff;
    border: 1.5px solid #e2e8f0;
    border-radius: 14px;
    box-shadow: 0 16px 48px rgba(30,30,46,0.13), 0 4px 12px rgba(30,30,46,0.06);
    z-index: 300;
    overflow: hidden;
    animation: dropdownIn 0.2s cubic-bezier(0.22,1,0.36,1) both;
  }

  .emp-search-wrap {
    padding: 10px 12px 8px;
    border-bottom: 1px solid #f1f5f9;
    position: sticky;
    top: 0;
    background: #fff;
    z-index: 1;
  }

  .emp-search {
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 9px;
    padding: 8px 12px 8px 34px;
    font-family: 'Nunito', sans-serif;
    font-size: 0.85rem;
    color: #1e1e2e;
    outline: none;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }
  .emp-search:focus { border-color: #a78bfa; background: #fff; }
  .emp-search::placeholder { color: #72787e; }

  .emp-search-icon {
    position: absolute;
    left: 22px;
    top: 50%;
    transform: translateY(-50%);
    color: #94a3b8;
    pointer-events: none;
    font-size: 0.85rem;
  }

  .emp-list { max-height: 230px; overflow-y: auto; }
  .emp-list::-webkit-scrollbar { width: 4px; }
  .emp-list::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  /* Select All row */
  .emp-option-all {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    cursor: pointer;
    background: #faf5ff;
    border-bottom: 1.5px solid #ede9fe;
    transition: background 0.15s;
    font-size: 0.88rem;
    font-weight: 700;
    color: #6d28d9;
    font-family: 'Nunito', sans-serif;
  }
  .emp-option-all:hover { background: #ede9fe; }

  /* Regular rows */
  .emp-option {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    cursor: pointer;
    transition: background 0.15s;
    font-size: 0.875rem;
    font-family: 'Nunito', sans-serif;
    color: #334155;
    border-bottom: 1px solid #f8fafc;
  }
  .emp-option:last-child { border-bottom: none; }
  .emp-option:hover { background: #faf5ff; }
  .emp-option.selected { background: #faf5ff; color: #6d28d9; }

  /* Checkbox */
  .emp-checkbox {
    width: 17px; height: 17px;
    border: 2px solid #cbd5e1;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.15s;
    background: #fff;
    font-size: 10px;
    color: transparent;
  }
  .emp-option.selected .emp-checkbox,
  .emp-option-all.all-selected .emp-checkbox {
    background: linear-gradient(135deg, #7c3aed, #db2777);
    border-color: transparent;
    color: #fff;
  }
  .emp-option-all.partial .emp-checkbox {
    background: #ede9fe;
    border-color: #a78bfa;
    color: #7c3aed;
  }

  /* Avatar */
  .emp-avatar {
    width: 28px; height: 28px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ede9fe, #fce7f3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.65rem;
    font-weight: 800;
    color: #7c3aed;
    font-family: 'Syne', sans-serif;
    flex-shrink: 0;
    border: 1.5px solid rgba(124,58,237,0.15);
  }

  .emp-option-meta { flex: 1; min-width: 0; }
  .emp-option-name {
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }
  .emp-option-role {
    font-size: 0.72rem;
    color: #94a3b8;
    font-weight: 500;
    text-transform: capitalize;
    line-height: 1.2;
  }

  .emp-count-right {
    font-size: 0.72rem;
    font-weight: 700;
    color: #222124;
    background: rgba(64, 11, 156, 0.24);
    border-radius: 100px;
    padding: 2px 8px;
    white-space: nowrap;
  }

  .emp-empty-msg {
    padding: 20px;
    text-align: center;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .emp-footer {
    padding: 8px 14px;
    border-top: 1px solid #f1f5f9;
    background: #fafafa;
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 500;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .emp-clear-btn {
    background: none;
    border: none;
    color: #f87171;
    font-size: 0.75rem;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    padding: 0;
    transition: color 0.15s;
  }
  .emp-clear-btn:hover { color: #dc2626; }

  @keyframes chipIn {
    from { opacity: 0; transform: scale(0.85); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes dropdownIn {
    from { opacity: 0; transform: translateY(-6px) scale(0.98); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }
`;

const initials = (name = "") =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const ROLE_LABEL = {
    employee: "Employee",
    hr: "HR",
    manager: "Manager",
    tl: "Team Lead",
    superadmin: "Super Admin",
};

const UserMultiSelect = ({ value = [], onChange, employees = [] }) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef(null);
    const searchRef = useRef(null);

    const filtered = employees.filter((e) =>
        `${e.name} ${e.role}`.toLowerCase().includes(search.toLowerCase())
    );

    const allSelected = employees.length > 0 && value.length === employees.length;
    const someSelected = value.length > 0 && !allSelected;

    const toggleAll = () => {
        onChange(allSelected ? [] : employees.map((e) => e._id));
    };

    const toggleOne = (id) => {
        onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    };

    const removeChip = (e, id) => {
        e.stopPropagation();
        onChange(value.filter((v) => v !== id));
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) {
                setOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Auto-focus search when opening
    useEffect(() => {
        if (open && searchRef.current) searchRef.current.focus();
    }, [open]);

    const selectedEmployees = employees.filter((e) => value.includes(e._id));

    return (
        <>
            <style>{styles}</style>
            <div className="emp-select-wrap" ref={ref}>
                {/* Trigger */}
                <button
                    type="button"
                    className={`emp-select-trigger ${open ? "open" : ""}`}
                    onClick={() => setOpen((o) => !o)}
                >
                    <div className="emp-trigger-left">
                        {selectedEmployees.length === 0 ? (
                            <span className="emp-trigger-placeholder">
                                {employees.length === 0 ? "No employees available" : "Select specific employees… (optional)"}
                            </span>
                        ) : allSelected ? (
                            <span className="emp-chip">
                                All {employees.length} employees
                                <span
                                    className="emp-chip-remove"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChange([]);
                                    }}
                                >
                                    ✕
                                </span>
                            </span>
                        ) : (
                            selectedEmployees.map((emp) => (
                                <span key={emp._id} className="emp-chip">
                                    {emp.name.split(" ")[0]}
                                    <span
                                        className="emp-chip-remove"
                                        onClick={(ev) => removeChip(ev, emp._id)}
                                    >
                                        ✕
                                    </span>
                                </span>
                            ))
                        )}
                    </div>
                    <svg className="emp-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>

                {/* Dropdown */}
                {open && (
                    <div className="emp-dropdown">
                        {/* Search */}
                        <div className="emp-search-wrap" style={{ position: "relative" }}>
                            <span className="emp-search-icon">🔍</span>
                            <input
                                ref={searchRef}
                                className="emp-search"
                                placeholder="Search by name or role…"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="emp-list">
                            {/* Select All — only show when not searching */}
                            {!search && employees.length > 0 && (
                                <div
                                    className={`emp-option-all ${allSelected ? "all-selected" : ""} ${someSelected ? "partial" : ""}`}
                                    onClick={toggleAll}
                                >
                                    <div className="emp-checkbox">
                                        {allSelected ? "✓" : someSelected ? "—" : ""}
                                    </div>
                                    <span style={{ flex: 1 }}>
                                        {allSelected ? "Deselect All" : "Select All"}
                                    </span>
                                    <span className="emp-count-right">{employees.length} people</span>
                                </div>
                            )}

                            {filtered.length === 0 ? (
                                <div className="emp-empty-msg">
                                    {employees.length === 0 ? "No employees loaded" : "No results found"}
                                </div>
                            ) : (
                                filtered.map((emp) => {
                                    const isSelected = value.includes(emp._id);
                                    return (
                                        <div
                                            key={emp._id}
                                            className={`emp-option ${isSelected ? "selected" : ""}`}
                                            onClick={() => toggleOne(emp._id)}
                                        >
                                            <div className="emp-checkbox">{isSelected ? "✓" : ""}</div>
                                            <div className="emp-avatar">{initials(emp.name)}</div>
                                            <div className="emp-option-meta">
                                                <div className="emp-option-name">{emp.name}</div>
                                                <div className="emp-option-role">
                                                    {formatRole(emp.role)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {value.length > 0 && (
                            <div className="emp-footer">
                                <span>{value.length} selected</span>
                                <button className="emp-clear-btn" onClick={() => onChange([])}>
                                    Clear all
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};

export default UserMultiSelect;