import { useEffect, useState } from "react";

export default function Participants() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // create form state
  const [newName, setNewName] = useState("");
  const [newKtaname, setNewKtaname] = useState("");
  const [newNote, setNewNote] = useState("");
  const [newIsPlusone, setNewIsPlusone] = useState(false);

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

      // update UI
      setItems((prev) => [created, ...prev]);

      // reset form
      setNewName("");
      setNewKtaname("");
      setNewNote("");
      setNewIsPlusone(false);
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

  return (
    <div style={{ padding: 16 }}>
      <h2>Participants</h2>

      {error && (
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>
      )}

      <h3>Add participant</h3>
      <form onSubmit={handleCreate} style={{ marginBottom: 16 }}>
        <div>
          <label>
            Name{" "}
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Pseudo{" "}
            <input
              value={newKtaname}
              onChange={(e) => setNewKtaname(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Note{" "}
            <input
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Is +1{" "}
            <input
              type="checkbox"
              checked={newIsPlusone}
              onChange={(e) => setNewIsPlusone(e.target.checked)}
            />
          </label>
        </div>

        <button type="submit">Create</button>
      </form>

      <h3>List</h3>
      {loading ? (
        <p>Loading…</p>
      ) : (
        <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Pseudo</th>
              <th>Note</th>
              <th>+1</th>
              <th>Photo</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => {
              const isEditing = editingId === p.id;

              return (
                <tr key={p.id}>
                  <td>{p.id}</td>

                  <td>
                    {isEditing ? (
                      <input
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
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                      />
                    ) : (
                      p.note ?? ""
                    )}
                  </td>

                  <td style={{ textAlign: "center" }}>
                    {isEditing ? (
                      <input
                        type="checkbox"
                        checked={editIsPlusone}
                        onChange={(e) => setEditIsPlusone(e.target.checked)}
                      />
                    ) : p.is_plusone ? (
                      "✓"
                    ) : (
                      ""
                    )}
                  </td>
                
                  <td> 
                    {p.picture_file ? (
                        <img
                        src={`/api/participants/${p.id}/picture?v=${encodeURIComponent(
                            p.picture_file
                        )}`}
                        alt=""
                        style={{
                            width: 48,
                            height: 48,
                            objectFit: "cover",
                            borderRadius: 6,
                            display: "block",
                        }}
                        />
                    ) : (
                        "—"
                    )}

                    {isEditing && (
                        <div style={{ marginTop: 6 }}>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                        />
                        <button
                            type="button"
                            onClick={() => uploadPhoto(p.id)}
                            disabled={!editPhotoFile}
                            style={{ marginLeft: 8 }}
                        >
                            Upload
                        </button>
                        </div>
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
    </div>
  );
}