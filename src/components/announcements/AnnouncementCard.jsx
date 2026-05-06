import { useState } from "react";

const styles = `
  .ann-card {
    background: #fff;
    border: 1.5px solid #e8eaf2;
    border-radius: 18px;
    padding: 20px 22px;
    transition: transform 0.25s cubic-bezier(0.22,1,0.36,1),
                box-shadow 0.25s,
                border-color 0.25s,
                opacity 0.3s;
    position: relative;
    overflow: hidden;
  }
  .ann-card::before {
    content: '';
    position: absolute;
    left: 0; top: 0; bottom: 0;
    width: 4px;
    background: linear-gradient(180deg, #7c3aed, #db2777);
    border-radius: 2px 0 0 2px;
    opacity: 0;
    transition: opacity 0.25s;
  }
  .ann-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 36px rgba(30,30,46,0.1);
    border-color: #c4b5fd;
  }
  .ann-card:hover::before { opacity: 1; }

  .ann-card.is-read { opacity: 0.68; }
  .ann-card.is-read:hover { opacity: 0.9; }

  .ann-card.important {
    border-color: #fed7aa;
    background: #fffbf5;
  }
  .ann-card.important::before {
    background: linear-gradient(180deg, #f97316, #f59e0b);
  }
  .ann-card.important:hover { border-color: #fdba74; }

  .ann-card.removing {
    animation: cardOut 0.3s cubic-bezier(0.4,0,1,1) forwards;
  }

  .ann-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 8px;
  }

  .ann-card-title {
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 1rem;
    color: #1e1e2e;
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.3;
  }

  .ann-card-badges { display: flex; gap: 6px; flex-shrink: 0; }

  .ann-badge {
    font-size: 0.68rem;
    font-weight: 700;
    font-family: 'Syne', sans-serif;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    padding: 3px 9px;
    border-radius: 100px;
    border: 1.5px solid;
    white-space: nowrap;
  }
  .ann-badge.unread   { color: #7c3aed; border-color: #c4b5fd; background: #f5f3ff; }
  .ann-badge.important { color: #c2410c; border-color: #fed7aa; background: #fff7ed; }
  .ann-badge.pinned   { color: #0369a1; border-color: #bae6fd; background: #f0f9ff; }

  .ann-card-body {
    color: #323538;
    font-size: 0.88rem;
    line-height: 1.65;
    margin: 0 0 16px;
    font-weight: 600;
  }

  .ann-card-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  .ann-action-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 7px 13px;
    border-radius: 9px;
    border: 1.5px solid;
    font-family: 'Nunito', sans-serif;
    font-size: 0.8rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    line-height: 1;
    background: transparent;
  }

  .ann-btn-read {
    color: #7c3aed;
    border-color: #c4b5fd;
    background: #f5f3ff;
  }
  .ann-btn-read:hover {
    background: #ede9fe;
    border-color: #a78bfa;
    transform: translateY(-1px);
  }

  .ann-btn-analytics {
    color: #0369a1;
    border-color: #9ecbe4;
    background: #f0f9ff;
  }
  .ann-btn-analytics:hover {
    background: #e0f2fe;
    border-color: #7dd3fc;
    transform: translateY(-1px);
  }

  .ann-btn-delete {
    color: #dc2626;
    border-color: #fecaca;
    background: #fff5f5;
    margin-left: auto;
  }
  .ann-btn-delete:hover {
    background: #fee2e2;
    border-color: #f87171;
    transform: translateY(-1px);
  }

  .ann-confirm {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-left: auto;
    font-size: 0.8rem;
    color: #94a3b8;
    font-family: 'Nunito', sans-serif;
  }

  .ann-confirm-yes {
    background: #fee2e2;
    border: 1.5px solid #fca5a5;
    color: #dc2626;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ann-confirm-yes:hover { background: #fecaca; }

  .ann-confirm-no {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    color: #64748b;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 700;
    font-family: 'Nunito', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
  }
  .ann-confirm-no:hover { border-color: #cbd5e1; color: #334155; }

  @keyframes cardOut {
    to { opacity: 0; transform: translateX(24px) scale(0.97); }
  }
`;

const AnnouncementCard = ({ a, onRead, onDelete, onAnalytics }) => {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [removing, setRemoving] = useState(false);

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => onDelete(a._id), 290);
  };

  return (
    <>
      <style>{styles}</style>
      <div className={["ann-card", a.isRead ? "is-read" : "", a.important ? "important" : "", removing ? "removing" : ""].filter(Boolean).join(" ")}>
        <div className="ann-card-top">
          <h4 className="ann-card-title">{a.title}</h4>
          <div className="ann-card-badges">
            {!a.isRead && <span className="ann-badge unread">New</span>}
            {a.important && <span className="ann-badge important">🔥 Hot</span>}
            {a.pinned && <span className="ann-badge pinned">📌 Pinned</span>}
          </div>
        </div>

        <p className="ann-card-body">{a.body}</p>

        <div className="ann-card-actions">

          <button className="ann-action-btn ann-btn-analytics" onClick={() => onAnalytics(a._id)}>
            📊 Analytics
          </button>

          {!confirmDelete ? (
            <button className="ann-action-btn ann-btn-delete" onClick={() => setConfirmDelete(true)}>
              🗑 Delete
            </button>
          ) : (
            <div className="ann-confirm">
              Sure?
              <button className="ann-confirm-yes" onClick={handleDelete}>Delete</button>
              <button className="ann-confirm-no" onClick={() => setConfirmDelete(false)}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AnnouncementCard;