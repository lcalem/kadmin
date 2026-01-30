import { useEffect, useState, useRef } from "react";
import "./Events.css";

function formatNight(dateStr) {
  if (!dateStr) return "";

  // dateStr is "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);

  // Use UTC to avoid timezone shifting the day
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + 1)); // handles month boundaries automatically

  const months = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ];

  const dd1 = String(start.getUTCDate()).padStart(2, "0");
  const mm1 = months[start.getUTCMonth()];
  const dd2 = String(end.getUTCDate()).padStart(2, "0");
  const mm2 = months[end.getUTCMonth()];
  const yyyy = start.getUTCFullYear(); // same year by your assumption

  if (mm1 === mm2) {
    return `Dans la nuit du ${dd1} au ${dd2} ${mm1} ${yyyy}`;
  }
  return `Dans la nuit du ${dd1} ${mm1} au ${dd2} ${mm2} ${yyyy}`;
}

function eventCoverUrl(ev) {
  if (!ev?.cover_photo) return null;
  return `/api/events/${ev.id}/cover?v=${encodeURIComponent(ev.cover_photo)}`;
}

export default function Events() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // create form state 
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [storyUpload, setStoryUpload] = useState(null);
  const [notesUpload, setNotesUpload] = useState(null);
  const [scriptFile, setScriptFile] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [speakerName, setSpeakerName] = useState("");
  const [speakerKtaname, setSpeakerKtaname] = useState("");
  const [speakerLabo, setSpeakerLabo] = useState("");
  const [speakerPhotoFile, setSpeakerPhotoFile] = useState(null);

  // modal + edit state
  const [selected, setSelected] = useState(null); // selected event object
  const [isEditing, setIsEditing] = useState(false);
  const [editNumber, setEditNumber] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editScriptFile, setEditScriptFile] = useState(null);
  const [isEditingCover, setIsEditingCover] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const editFormRef = useRef(null);

  async function loadEvents() {
    try {
      setError("");
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error(await res.text());
      setItems(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  function closeAddModal() {
    setShowAddModal(false);
    setNumber("");
    setTitle("");
    setDate("");
    setScriptFile(null);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  // close modal on Escape
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setSelected(null);
        setIsEditing(false);
        setEditScriptFile(null);
        setIsEditingCover(false);
        setCoverFile(null);
        closeAddModal();
      }
    }
    if (selected) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selected]);

  useEffect(() => {
    if (isEditing && editFormRef.current) {
      editFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [isEditing]);

  async function uploadCover() {
    if (!selected || !coverFile) return;

    const fd = new FormData();
    fd.append("file", coverFile);

    const res = await fetch(`/api/events/${selected.id}/cover`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());

    const updated = await res.json();

    setItems((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    setSelected(updated);

    setCoverFile(null);
    setIsEditingCover(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setError("");

      const fd = new FormData();
      // event data
      fd.append("number", number);
      fd.append("title", title);
      fd.append("date", date);
      if (storyUpload) fd.append("story_file", storyUpload);
      if (notesUpload) fd.append("notes_file", notesUpload);
      if (scriptFile) fd.append("script", scriptFile);

      // speaker data
      fd.append("speaker_name", speakerName);
      fd.append("speaker_ktaname", speakerKtaname);
      fd.append("speaker_labo", speakerLabo);
      if (speakerPhotoFile) fd.append("speaker_picture", speakerPhotoFile);

      const res = await fetch("/api/events", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();

      setItems((prev) => [created, ...prev]);

      setNumber("");
      setTitle("");
      setDate("");
      setScriptFile(null);
      setSpeakerName("");
      setSpeakerKtaname("");
      setSpeakerLabo("");
      setSpeakerPhotoFile(null);
      const inp = document.getElementById("create-script-input");
      if (inp) inp.value = "";
    } catch (e) {
      setError(String(e));
    }
  }

  function openModal(ev) {
    setSelected(ev);
    setIsEditing(false);
    setEditNumber(String(ev.number ?? ""));
    setEditTitle(ev.title ?? "");
    setEditDate(ev.date ?? "");
    setEditScriptFile(null);
    setIsEditingCover(false);
    setCoverFile(null);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      setError("");

      const fd = new FormData();
      fd.append("number", editNumber);
      fd.append("title", editTitle);
      fd.append("date", editDate);
      if (editScriptFile) fd.append("script", editScriptFile);

      const res = await fetch(`/api/events/${selected.id}`, { method: "PUT", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      setItems((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
      setSelected(updated);
      setIsEditing(false);
      setEditScriptFile(null);
      setIsEditingCover(false);
      setCoverFile(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDeleteSelected() {
    if (!selected) return;
    if (!window.confirm("Delete this event? (This will also remove its script file)")) return;

    try {
      setError("");
      const res = await fetch(`/api/events/${selected.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());

      setItems((prev) => prev.filter((e) => e.id !== selected.id));
      setSelected(null);
      setIsEditing(false);
      setEditScriptFile(null);
      setIsEditingCover(false);
      setCoverFile(null);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div className="events-page">
      <h2>Events</h2>
      {error && <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <button type="button" className="k-btn k-btn--subtle" onClick={() => setShowAddModal(true)}>
          + Nouvelle Descente
        </button>
      </div>

      {showAddModal && (
        <div
          className="event-modal-backdrop"
          onClick={closeAddModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="event-modal-close"
              type="button"
              onClick={closeAddModal}
              aria-label="Close"
            >
              ×
            </button>

            <div className="event-modal-body">
              <h3 className="event-modal-title">Nouvelle Descente</h3>

              <div className="k-edit-form">
                <div className="k-form-section">
                  <div className="k-form-section-title">Descente</div>
                </div>
                <div className="k-form-row">
                  <label htmlFor="create-number">Numéro</label>
                  <input
                    id="create-number"
                    className="k-input"
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    required
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="create-title">Titre</label>
                  <input
                    id="create-title"
                    className="k-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="create-date">Date</label>
                  <input
                    id="create-date"
                    className="k-input"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="k-form-row">
                  <label>Récit (optionnel)</label>
                  <div className="k-filepicker k-filepicker--inline">
                    <label className="k-btn k-btn--subtle k-filepicker__btn">
                      Choose file
                      <input
                        type="file"
                        accept=".md,.txt"
                        className="k-filepicker__input"
                        onChange={(e) => setStoryUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                    <span className="k-filepicker__name">
                      {storyUpload ? storyUpload.name : "No file selected"}
                    </span>
                  </div>
                </div>

                <div className="k-form-row">
                  <label>Notes (optionnelles)</label>
                  <div className="k-filepicker k-filepicker--inline">
                    <label className="k-btn k-btn--subtle k-filepicker__btn">
                      Choose file
                      <input
                        type="file"
                        accept=".md,.txt"
                        className="k-filepicker__input"
                        onChange={(e) => setNotesUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                    <span className="k-filepicker__name">
                      {notesUpload ? notesUpload.name : "No file selected"}
                    </span>
                  </div>
                </div>

                <div className="k-form-row">
                  <label>Script (optionnel)</label>

                  <div className="k-filepicker k-filepicker--inline">
                    <label className="k-btn k-btn--subtle k-filepicker__btn">
                      Choose file
                      <input
                        type="file"
                        className="k-filepicker__input"
                        onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    <span className="k-filepicker__name">
                      {scriptFile ? scriptFile.name : "No file selected"}
                    </span>
                  </div>
                </div>

                <hr className="k-form-divider" />

                <div className="k-form-section">
                  <div className="k-form-section-title">Orateur / Oratrice</div>
                </div>

                <div className="k-form-row">
                  <label htmlFor="create-speaker-name">Nom</label>
                  <input
                    id="create-speaker-name"
                    className="k-input"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    required
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="create-speaker-ktaname">Pseudo (optionnel)</label>
                  <input
                    id="create-speaker-ktaname"
                    className="k-input"
                    value={speakerKtaname}
                    onChange={(e) => setSpeakerKtaname(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="create-speaker-labo">Labo (optionnel)</label>
                  <input
                    id="create-speaker-labo"
                    className="k-input"
                    value={speakerLabo}
                    onChange={(e) => setSpeakerLabo(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label>Photo (optionnelle)</label>

                  <div className="k-filepicker k-filepicker--inline">
                    <label className="k-btn k-btn--subtle k-filepicker__btn">
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        className="k-filepicker__input"
                        onChange={(e) => setSpeakerPhotoFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    <span className="k-filepicker__name">
                      {speakerPhotoFile ? speakerPhotoFile.name : "No file selected"}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="k-btn"
                  onClick={() => {
                    // call handleCreate with a fake event
                    const fakeEvent = { preventDefault: () => {} };
                    handleCreate(fakeEvent)
                      .then(() => closeAddModal())
                      .catch((e) => setError(String(e)));
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="event-grid">
        {items.map((ev) => (
          <button key={ev.id} className="event-bubble" type="button" onClick={() => openModal(ev)}>
            <div className="event-avatar">
              {eventCoverUrl(ev) ? (
                <img src={eventCoverUrl(ev)} alt={ev.title || `Event ${ev.number}`} />
              ) : (
                <div className="event-avatar--placeholder">#{ev.number}</div>
              )}
            </div>
            <div className="event-title">
              <span className="event-title-text">{ev.title}</span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <div className="event-modal-backdrop" onClick={() => setSelected(null)} role="dialog" aria-modal="true">
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="event-modal-close" type="button" onClick={() => setSelected(null)} aria-label="Close">
              ×
            </button>

            <div className="event-modal-body">
              <h3 className="event-modal-title">
                #{selected.number} — {selected.title}
              </h3>
              <div className="event-modal-subtitle">{formatNight(selected.date)}</div>
              <div className="event-modal-cover">
                {eventCoverUrl(selected) ? (
                  <img src={eventCoverUrl(selected)} alt={selected.title || `Event ${selected.number}`} />
                ) : (
                  <div className="event-modal-cover--placeholder">#{selected.number}</div>
                )}
                <button
                  className="event-cover-edit"
                  type="button"
                  onClick={() => {
                    setIsEditingCover((v) => {
                      const next = !v;
                      if (next) {
                        setIsEditing(false);
                        setEditScriptFile(null);
                      } else {
                        setCoverFile(null);
                      }
                      return next;
                    });
                  }}
                  aria-label="Change cover image"
                  title="Change cover image"
                >
                  ✏️
                </button>
              </div>

              {isEditingCover && (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div className="k-filepicker k-filepicker--inline">
                    <label className="k-btn k-btn--subtle k-filepicker__btn">
                      Choose file
                      <input
                        type="file"
                        accept="image/*"
                        className="k-filepicker__input"
                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                      />
                    </label>

                    <span className="k-filepicker__name">
                      {coverFile ? coverFile.name : "Choose a cover image…"}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="k-btn k-btn--subtle"
                    disabled={!coverFile}
                    onClick={() => {
                      uploadCover().catch((e) => {
                        console.error(e);
                        setError(String(e));
                      });
                    }}
                  >
                    Upload cover
                  </button>
                </div>
              )}

              {selected.story && (
                <div>
                  <h4 style={{ marginBottom: 6 }}>Story</h4>
                  <div style={{ color: "var(--text)", opacity: 0.95, whiteSpace: "pre-wrap" }}>
                    {selected.story}
                  </div>
                </div>
              )}

              {selected.notes && (
                <div>
                  <h4 style={{ marginBottom: 6 }}>Notes</h4>
                  <div style={{ color: "var(--text)", opacity: 0.95, whiteSpace: "pre-wrap" }}>
                    {selected.notes}
                  </div>
                </div>
              )}

              <div className="event-actions">
                {selected.script_files && selected.script_files.length > 0 ? (
                  <a className="k-btn k-btn--subtle" href={`/api/events/${selected.id}/script`} target="_blank" rel="noopener noreferrer">
                    Download script
                  </a>
                ) : (
                  <span style={{ color: "var(--muted)", fontFamily: "var(--font-sans)" }}>No script</span>
                )}

                <button type="button" className="k-btn k-btn--subtle" onClick={() => {
                    setIsEditing((v) => {
                      const next = !v;
                      if (next) {
                        setIsEditingCover(false);
                        setCoverFile(null);
                      }
                      return next;
                    });
                  }}>
                  {isEditing ? "Close edit" : "Edit"}
                </button>

                <button type="button" className="k-btn k-btn--subtle" onClick={handleDeleteSelected}>
                  Delete
                </button>
              </div>

              {isEditing && (
                <div
                  ref={editFormRef}
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    paddingTop: 14,
                  }}
                >
                  <h4 style={{ marginTop: 0 }}>Edit event</h4>

                  <div className="k-edit-form">
                    <div className="k-form-row">
                      <label htmlFor="edit-number">Number</label>
                      <input
                        id="edit-number"
                        className="k-input"
                        type="number"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                      />
                    </div>

                    <div className="k-form-row">
                      <label htmlFor="edit-title">Title</label>
                      <input
                        id="edit-title"
                        className="k-input"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                      />
                    </div>

                    <div className="k-form-row">
                      <label htmlFor="edit-date">Date</label>
                      <input
                        id="edit-date"
                        className="k-input"
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                    </div>

                    <div className="k-form-row">
                      <label>Replace script</label>

                      <div className="k-filepicker k-filepicker--inline">
                        <label className="k-btn k-btn--subtle k-filepicker__btn">
                          Choose file
                          <input
                            type="file"
                            className="k-filepicker__input"
                            onChange={(e) => setEditScriptFile(e.target.files?.[0] || null)}
                          />
                        </label>

                        <span className="k-filepicker__name">
                          {editScriptFile ? editScriptFile.name : "No file selected"}
                        </span>
                      </div>
                    </div>

                    <button type="button" className="k-btn" onClick={saveEdit}>
                      Save
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}