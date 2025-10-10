import { useState } from "react";
import { buildDiceBearUrl } from "../../utils/buildDiceBearUrl";

const STYLES = ["thumbs", "lorelei", "adventurer", "botttsNeutral", "identicon"];
const SEEDS  = ["purdue", "samson", "eagle", "lion", "koala", "titan", "nova", "bolt", "delta"];

export default function AvatarPicker({ initialStyle = "thumbs", initialSeed = "samson", onSelect }) {
  const [style, setStyle] = useState(initialStyle);

  const handlePick = (s, sd) => {
    const url = buildDiceBearUrl({ style: s, seed: sd, size: 256, extra: "&radius=50" });
    onSelect({ style: s, seed: sd, url });
  };

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Style tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {STYLES.map((s) => (
          <button
            key={s}
            onClick={() => setStyle(s)}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: s === style ? "2px solid #6b46c1" : "1px solid #ccc",
              cursor: "pointer",
              background: s === style ? "#f5f3ff" : "white",
              textTransform: "capitalize",
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Grid of avatar options */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))", gap: 12 }}>
        {SEEDS.map((sd) => {
          const url = buildDiceBearUrl({ style, seed: sd, size: 128, extra: "&radius=50" });
          return (
            <button
              key={`${style}-${sd}`}
              onClick={() => handlePick(style, sd)}
              style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
              aria-label={`Choose ${style} ${sd}`}
              title={`Choose ${style} • ${sd}`}
            >
              <img
                src={url}
                alt={`${style} ${sd}`}
                width={96}
                height={96}
                style={{ borderRadius: "50%", boxShadow: "0 0 0 2px #eee" }}
                loading="lazy"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
