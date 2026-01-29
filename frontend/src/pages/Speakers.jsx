import { useEffect, useState } from "react";
import "./Speakers.css";

function speakerPictureUrl(s) {
  if (!s.picture_file) return null;
  return `/api/speaker/${s.id}/picture?v=${encodeURIComponent(s.picture_file)}`;
}

export default function Speakers() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null); // speaker object
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);

  useEffect(() => {
    fetch("/api/speakers")
      .then((r) => r.ok ? r.json() : r.text().then((t) => Promise.reject(t)))
      .then(setItems)
      .catch((e) => setError(String(e)));
  }, []);

  // close modal on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setSelected(null);
        setShowPhotoUpload(false);
        setPhotoFile(null);
      }
    }
    if (selected) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  async function uploadSpeakerPhoto() {
    if (!selected || !photoFile) return;

    const fd = new FormData();
    fd.append("file", photoFile);

    const res = await fetch(`/api/speaker/${selected.id}/picture`, {
      method: "POST",
      body: fd,
    });

    if (!res.ok) {
      throw new Error(await res.text());
    }

    const updated = await res.json();

    // update list
    setItems((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );

    // update currently selected speaker
    setSelected(updated);

    // reset UI
    setPhotoFile(null);
    setShowPhotoUpload(false);
  }

  return (
    <div className="speakers-page">
      <h2>Speakers</h2>
      {error && <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>}

      <div className="speaker-grid">
        {items.map((s) => {
          const url = speakerPictureUrl(s);
          return (
            <button
              key={s.id}
              className="speaker-bubble"
              type="button"
              onClick={() => {
                setSelected(s);
                setShowPhotoUpload(false);
                setPhotoFile(null);
              }}
            >
              <div className="speaker-avatar">
                {url ? (
                  <img src={url} alt={s.name || "Speaker"} />
                ) : (
                  <div className="speaker-avatar--placeholder" aria-hidden="true" />
                )}
              </div>
              <div className="speaker-name">{s.name}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div
          className="speaker-modal-backdrop"
          onClick={() => {
            setSelected(null);
            setShowPhotoUpload(false);
            setPhotoFile(null);
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="speaker-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="speaker-modal-close"
              type="button"
              onClick={() => {
                setSelected(null);
                setShowPhotoUpload(false);
                setPhotoFile(null);
              }}
              aria-label="Close"
            >
              ×
            </button>

            <div className="speaker-modal-body">
              <div className="speaker-modal-photo">
                {speakerPictureUrl(selected) ? (
                  <img src={speakerPictureUrl(selected)} alt={selected.name || "Speaker"} />
                ) : (
                  <div className="speaker-modal-photo--placeholder" />
                )}

                <button
                  className="speaker-photo-edit"
                  type="button"
                  onClick={() => setShowPhotoUpload((v) => !v)}
                  aria-label="Change speaker photo"
                  title="Change speaker photo"
                >
                  ✏️
                </button>
              </div>

              <div className="speaker-modal-info">
                <h3 className="speaker-modal-title">{selected.name}</h3>

                <div className="speaker-meta">
                  {selected.ktaname && (
                    <div>
                      <span className="speaker-meta-label">Pseudo</span>
                      <span className="speaker-meta-value">{selected.ktaname}</span>
                    </div>
                  )}
                  {selected.labo && (
                    <div>
                      <span className="speaker-meta-label">Lab</span>
                      <span className="speaker-meta-value">{selected.labo}</span>
                    </div>
                  )}
                  {selected.event_numbers?.length > 0 && (
                    <div>
                      <span className="speaker-meta-label">Ktorphée</span>
                      <span className="speaker-meta-value">
                        #{selected.event_numbers.join(", #")}
                      </span>
                    </div>
                  )}
                </div>
                {showPhotoUpload && (
                  <div className="speaker-upload">
                    <div className="k-filepicker k-filepicker--inline">
                      <label className="k-btn k-btn--subtle k-filepicker__btn">
                        Choose file
                        <input
                          type="file"
                          accept="image/*"
                          className="k-filepicker__input"
                          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                        />
                      </label>

                      <span className="k-filepicker__name">
                        {photoFile ? photoFile.name : "Choose an image…"}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="k-btn k-btn--subtle"
                      disabled={!photoFile}
                      onClick={() => {
                        uploadSpeakerPhoto().catch((e) => {
                          console.error(e);
                          alert("Failed to upload speaker photo");
                        });
                      }}
                    >
                      Upload
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}