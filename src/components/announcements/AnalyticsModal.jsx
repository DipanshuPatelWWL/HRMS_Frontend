import { useEffect, useState } from "react";

const styles = `
  .ann-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15,10,30,0.45);
    backdrop-filter: blur(5px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
    animation: backdropIn 0.22s ease both;
  }

  .ann-modal-box {
    background: #fff;
    border: 1.5px solid #e8eaf2;
    border-radius: 24px;
    width: 100%;
    max-width: 490px;
    max-height: 88vh;
    overflow-y: auto;
    padding: 32px;
    position: relative;
    animation: modalIn 0.32s cubic-bezier(0.22,1,0.36,1) both;
    box-shadow: 0 32px 80px rgba(30,30,46,0.18), 0 4px 12px rgba(30,30,46,0.06);
  }
  .ann-modal-box::-webkit-scrollbar { width: 4px; }
  .ann-modal-box::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 4px; }

  .ann-modal-close {
    position: absolute;
    top: 18px; right: 18px;
    width: 32px; height: 32px;
    border-radius: 50%;
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    color: #252627;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 0.82rem;
    transition: all 0.2s;
  }
  .ann-modal-close:hover {
    background: #fee2e2;
    border-color: #fca5a5;
    color: #dc2626;
    transform: rotate(90deg);
  }

  .ann-modal-heading {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1.45rem;
    color: #1e1e2e;
    letter-spacing: -0.03em;
    margin: 0 0 4px;
  }

  .ann-modal-sub {
    font-size: 0.84rem;
    color: #343536;
    margin: 0 0 26px;
    font-weight: 500;
  }

  .ann-stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 22px;
  }

  .ann-stat-card {
    background: #f8fafc;
    border: 1.5px solid #e8eaf2;
    border-radius: 14px;
    padding: 16px 12px;
    text-align: center;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ann-stat-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(30,30,46,0.07); }

  .ann-stat-num {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 2rem;
    letter-spacing: -0.04em;
    line-height: 1;
    margin-bottom: 4px;
  }
  .ann-stat-card:nth-child(1) .ann-stat-num { color: #7c3aed; }
  .ann-stat-card:nth-child(2) .ann-stat-num { color: #059669; }
  .ann-stat-card:nth-child(3) .ann-stat-num { color: #dc2626; }

  .ann-stat-label {
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #333536;
    font-family: 'Syne', sans-serif;
  }

  .ann-prog-wrap {
    background: #f1f5f9;
    border-radius: 100px;
    height: 7px;
    overflow: hidden;
    margin-bottom: 26px;
  }
  .ann-prog-bar {
    height: 100%;
    background: linear-gradient(90deg, #7c3aed, #059669);
    border-radius: 100px;
    transition: width 0.85s cubic-bezier(0.22,1,0.36,1);
  }

  .ann-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    margin: 0 0 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .ann-section-title.seen { color: #059669; }
  .ann-section-title.unseen { color: #dc2626; }
  .ann-section-title::after {
    content: ''; flex: 1; height: 1px; background: currentColor; opacity: 0.15;
  }

  .ann-user-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 22px; }

  .ann-user-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 13px;
    border-radius: 11px;
    background: #f8fafc;
    border: 1.5px solid #f1f5f9;
    animation: rowIn 0.28s cubic-bezier(0.22,1,0.36,1) both;
    transition: background 0.18s;
  }
  .ann-user-row:hover { background: #f1f5f9; }

  .ann-user-av {
    width: 30px; height: 30px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    flex-shrink: 0;
  }
  .ann-user-av.seen   { background: #d1fae5; color: #059669; border: 1.5px solid #a7f3d0; }
  .ann-user-av.unseen { background: #fee2e2; color: #dc2626; border: 1.5px solid #fecaca; }

  .ann-user-name { font-size: 0.87rem; color: #0c0c0c; font-family: 'Nunito', sans-serif; font-weight: 600; flex: 1; }
  .ann-user-icon { font-size: 0.88rem; }

  .ann-close-btn {
    width: 100%;
    background: #f8fafc;
    border: 1.5px solid #555d6d;
    border-radius: 12px;
    padding: 12px;
    color: #0d0d0e;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
    margin-top: 4px;
  }
  .ann-close-btn:hover { background: #ebeef0; color: #000000; border-color: #000000; }

  @keyframes backdropIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes modalIn {
    from { opacity: 0; transform: scale(0.94) translateY(14px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes rowIn {
    from { opacity: 0; transform: translateX(-8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
`;

const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

const AnalyticsModal = ({ data, onClose }) => {
  const [barWidth, setBarWidth] = useState(0);

  useEffect(() => {
    if (!data) return;
    const pct = data.analytics.total > 0
      ? (data.analytics.read.length / data.analytics.total) * 100 : 0;
    const t = setTimeout(() => setBarWidth(pct), 80);
    return () => clearTimeout(t);
  }, [data]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  if (!data) return null;

  const { total, read, notRead } = data.analytics;
  const pct = total > 0 ? Math.round((read.length / total) * 100) : 0;

  return (
    <>
      <style>{styles}</style>
      <div className="ann-modal-backdrop" onClick={handleBackdrop}>
        <div className="ann-modal-box">
          <button className="ann-modal-close" onClick={onClose}>✕</button>

          <h3 className="ann-modal-heading">📊 Reach Analytics</h3>
          <p className="ann-modal-sub">{pct}% of recipients have seen this</p>

          <div className="ann-stats-row">
            {[{ label: "Total", value: total }, { label: "Seen", value: read.length }, { label: "Unseen", value: notRead.length }].map(({ label, value }) => (
              <div key={label} className="ann-stat-card">
                <div className="ann-stat-num">{value}</div>
                <div className="ann-stat-label">{label}</div>
              </div>
            ))}
          </div>

          <div className="ann-prog-wrap">
            <div className="ann-prog-bar" style={{ width: `${barWidth}%` }} />
          </div>

          {read.length > 0 && (
            <>
              <div className="ann-section-title seen">✅ Seen</div>
              <div className="ann-user-list">
                {read.map((u, i) => (
                  <div key={u._id} className="ann-user-row" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="ann-user-av seen">{initials(u.name)}</div>
                    <span className="ann-user-name">{u.name}</span>
                    <span className="ann-user-icon">✅</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {notRead.length > 0 && (
            <>
              <div className="ann-section-title unseen">❌ Not Seen</div>
              <div className="ann-user-list">
                {notRead.map((u, i) => (
                  <div key={u._id} className="ann-user-row" style={{ animationDelay: `${i * 0.04}s` }}>
                    <div className="ann-user-av unseen">{initials(u.name)}</div>
                    <span className="ann-user-name">{u.name}</span>
                    <span className="ann-user-icon">❌</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <button className="ann-close-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
};

export default AnalyticsModal;