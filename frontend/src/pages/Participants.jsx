import { useEffect, useState } from "react";
import "./Participants.css";

export default function Participants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lightboxUrl, setLightboxUrl] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // create form state
  const [newName, setNewName] = useState("");
  const [newKtaname, setNewKtaname] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newIsPlusone, setNewIsPlusone] = useState(false);
  const [newPhotoFile, setNewPhotoFile] = useState(null);

  // edit state
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editKtaname, setEditKtaname] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editIsPlusone, setEditIsPlusone] = useState(false);
  const [editPhotoFile, setEditPhotoFile] = useState(null);

  async function loadParticipants() {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/participants");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadParticipants();
  }, []);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") setLightboxUrl(null);
    }
    if (lightboxUrl) window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxUrl]);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        name: newName,
        ktaname: newKtaname || null,
        note: newNote || null,
        is_plusone: newIsPlusone,
      };

      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      let finalParticipant = created;

      if (newPhotoFile) {
        finalParticipant = await uploadPhotoFor(created.id, newPhotoFile);
      }

      // update UI
      setItems((prev) => [finalParticipant, ...prev]);

      // reset form
      setNewName("");
      setNewKtaname("");
      setNewNote("");
      setNewIsPlusone(false);
      setNewPhotoFile(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this participant?")) return;
    try {
      setError("");
      const res = await fetch(`/api/participants/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());

      setItems((prev) => prev.filter((p) => p.id !== id));

      // if we were editing this one, exit edit mode
      if (editingId === id) {
        setEditingId(null);
      }
    } catch (e) {
      setError(String(e));
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name ?? "");
    setEditKtaname(p.ktaname ?? "");
    setEditNote(p.note ?? "");
    setEditIsPlusone(Boolean(p.is_plusone));
    setEditPhotoFile(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditPhotoFile(null);
  }

  async function saveEdit(id) {
    try {
      setError("");

      const payload = {
        name: editName,
        ktaname: editKtaname || null,
        note: editNote || null,
        is_plusone: editIsPlusone,
      };

      const res = await fetch(`/api/participants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
      setEditPhotoFile(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function uploadPhoto(participantId) {
    try {
        if (!editPhotoFile) return;

        const fd = new FormData();
        fd.append("file", editPhotoFile);

        const res = await fetch(`/api/participants/${participantId}/picture`, {
            method: "POST",
            body: fd,
        });
        if (!res.ok) throw new Error(await res.text());

        const updated = await res.json();
        setItems((prev) => prev.map((p) => (p.id === participantId ? updated : p)));
        setEditPhotoFile(null);
    } catch(e) {
        setError(String(e))
    }
  }

  async function uploadPhotoFor(participantId, file) {
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch(`/api/participants/${participantId}/picture`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error(await res.text());
    return await res.json(); // returns updated participant
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Participants</h2>

      {error && (
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          className="k-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add participant
        </button>
      </div>

      {showAddModal && (
        <div
          className="k-modal-backdrop"
          onClick={() => setShowAddModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="k-modal k-modal--form" onClick={(e) => e.stopPropagation()}>
            <button
              className="k-modal-close"
              onClick={() => setShowAddModal(false)}
              aria-label="Close"
              type="button"
            >
              ×
            </button>

            <h3 style={{ marginTop: 0 }}>Add participant</h3>

            <form
              onSubmit={async (e) => {
                await handleCreate(e);
                setShowAddModal(false); // close on success
              }}
            >
              <div className="k-form-row">
                <label htmlFor="name">Name</label>
                <input
                  id="name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                />
              </div>

              <div className="k-form-row">
                <label htmlFor="pseudo">Pseudo</label>
                <input
                  id="pseudo"
                  value={newKtaname}
                  onChange={(e) => setNewKtaname(e.target.value)}
                />
              </div>

              <div className="k-form-row">
                <label htmlFor="note">Note</label>
                <input
                  id="note"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                />
              </div>

              <div className="k-form-row k-form-row--inline">
                <label className="k-checkbox">
                  <span>Is +1</span>
                  <input
                    type="checkbox"
                    checked={newIsPlusone}
                    onChange={(e) => setNewIsPlusone(e.target.checked)}
                  />
                  <span className="k-checkmark" />
                </label>
              </div>

              <div className="k-form-row">
                <label>Photo</label>

                <div className="k-filepicker k-filepicker--inline">
                  <label className="k-btn k-btn--subtle k-filepicker__btn">
                    Choose file
                    <input
                      type="file"
                      accept="image/*"
                      className="k-filepicker__input"
                      onChange={(e) => setNewPhotoFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  <span className="k-filepicker__name">
                    {newPhotoFile ? newPhotoFile.name : "Choose an image…"}
                  </span>
                </div>
              </div>

              <button type="submit">Create</button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <table className="k-table">
          <thead>
            <tr>
              <th></th> {/* photo column has no header */}
              <th className="col-name">Name</th>
              <th>Pseudo</th>
              <th>Note</th>
              <th>+1</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const isEditing = editingId === p.id;

              return (
                <tr key={p.id}>

                  <td className="k-avatar-cell">
                    {p.picture_file ? (
                      <img
                        className="k-avatar"
                        src={`/api/participants/${p.id}/picture?v=${encodeURIComponent(p.picture_file)}`}
                        alt=""
                        onClick={() =>
                          setLightboxUrl(
                            `/api/participants/${p.id}/picture?v=${encodeURIComponent(p.picture_file)}`
                          )
                        }
                      />
                    ) : (
                      <div className="k-avatar k-avatar--placeholder" aria-hidden="true" />
                    )}

                    {isEditing && (
                      <div className="k-upload">
                        <div className="k-filepicker">
                          <label className="k-btn k-btn--subtle k-filepicker__btn">
                            Choose file
                            <input
                              type="file"
                              accept="image/*"
                              className="k-filepicker__input"
                              onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                            />
                          </label>

                          <span className="k-filepicker__name">
                            {editPhotoFile ? editPhotoFile.name : "No file selected"}
                          </span>

                          <button
                            type="button"
                            className="k-btn k-btn--subtle"
                            onClick={() => uploadPhoto(p.id)}
                            disabled={!editPhotoFile}
                          >
                            Upload
                          </button>
                        </div>
                      </div>
                    )}
                  </td>

                  <td className="col-name">
                    {isEditing ? (
                      <input
                        className="k-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      p.name
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        className="k-input"
                        value={editKtaname}
                        onChange={(e) => setEditKtaname(e.target.value)}
                      />
                    ) : (
                      p.ktaname ?? ""
                    )}
                  </td>

                  <td>
                    {isEditing ? (
                      <input
                        className="k-input k-input-long"
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                    ) : (
                      p.note ?? ""
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {isEditing ? (
                      <label className="k-checkbox k-checkbox--compact">
                        <input
                          type="checkbox"
                          checked={editIsPlusone}
                          onChange={(e) => setEditIsPlusone(e.target.checked)}
                        />
                        <span className="k-checkmark" />
                      </label>
                    ) : p.is_plusone ? (
                      "✓"
                    ) : (
                      ""
                    )}
                  </td>
                  
                  <td>
                    {isEditing ? (
                      <>
                        <button onClick={() => saveEdit(p.id)}>Save</button>{" "}
                        <button onClick={cancelEdit}>Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(p)}>Edit</button>{" "}
                        <button onClick={() => handleDelete(p.id)}>Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {lightboxUrl && (
      <div
        className="k-modal-backdrop"
        onClick={() => setLightboxUrl(null)}
        role="dialog"
        aria-modal="true"
      >
        <div className="k-modal" onClick={(e) => e.stopPropagation()}>
          <button
            className="k-modal-close"
            onClick={() => setLightboxUrl(null)}
            aria-label="Close"
            type="button"
          >
            ×
          </button>
          <img className="k-modal-img" src={lightboxUrl} alt="Participant photo" />
        </div>
      </div>
    )}

    </div>
  );
}