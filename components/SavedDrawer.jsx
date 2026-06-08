import { X, Bookmark } from "lucide-react";
import { Card } from "./Card";

export default function SavedDrawer({ items, onClose, onUnsave }) {
  return (
    <>
      <div className="or-overlay" onClick={onClose} />
      <aside className="or-drawer">
        <div className="or-drawer-head">
          <Bookmark size={15} />
          <span>Хадгалсан мэдээ</span>
          <span className="or-drawer-count">{items.length}</span>
          <button className="or-drawer-close" onClick={onClose} aria-label="Хаах">
            <X size={18} />
          </button>
        </div>
        <div className="or-drawer-body">
          {items.length === 0 ? (
            <p className="or-drawer-empty">
              Хадгалсан мэдээ байхгүй байна.<br />
              Картны 🔖 товчийг дарж хадгалаарай.
            </p>
          ) : (
            <div className="or-drawer-grid">
              {items.map((a, i) => (
                <Card key={i} a={a} accent="#e8b04b" i={i} saved onSave={() => onUnsave(a)} />
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
