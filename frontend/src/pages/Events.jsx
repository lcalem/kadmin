import { useEffect, useState } from "react";

export default function Events() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // create form state
  const [number, setNumber] = useState("");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [scriptFile, setScriptFile] = useState(null);

  // edit state (one row at a time)
  const [editingId, setEditingId] = useState(null);
  const [editNumber, setEditNumber] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editScriptFile, setEditScriptFile] = useState(null);

  async function loadEvents() {
    try {
      setError("");
      const res = await fetch("/api/events");
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setItems(data);
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setError("");

      const fd = new FormData();
      fd.append("number", number);
      fd.append("title", title);
      fd.append("date", date);
      if (scriptFile) fd.append("script", scriptFile);

      const res = await fetch("/api/events", { method: "POST", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();

      setItems((prev) => [created, ...prev]);

      setNumber("");
      setTitle("");
      setDate("");
      setScriptFile(null);
      const inp = document.getElementById("create-script-input");
      if (inp) inp.value = "";
    } catch (e) {
      setError(String(e));
    }
  }

  function startEdit(ev) {
    setEditingId(ev.id);
    setEditNumber(String(ev.number ?? ""));
    setEditTitle(ev.title ?? "");
    setEditDate(ev.date ?? ""); // should already be YYYY-MM-DD
    setEditScriptFile(null);
    const inp = document.getElementById("edit-script-input");
    if (inp) inp.value = "";
  }

  function cancelEdit() {
    setEditingId(null);
    setEditScriptFile(null);
  }

  async function saveEdit(id) {
    try {
      setError("");

      const fd = new FormData();
      fd.append("number", editNumber);
      fd.append("title", editTitle);
      fd.append("date", editDate);
      if (editScriptFile) fd.append("script", editScriptFile);

      const res = await fetch(`/api/events/${id}`, { method: "PUT", body: fd });
      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      setItems((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setEditingId(null);
      setEditScriptFile(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this event? (This will also remove its script file)")) return;
    try {
      setError("");
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((e) => e.id !== id));
      if (editingId === id) cancelEdit();
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Events</h2>

      {error && (
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>
      )}

      <h3>Add event</h3>
      <form onSubmit={handleCreate} style={{ marginBottom: 20 }}>
        <div>
          <label>
            Number{" "}
            <input
              type="number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Title{" "}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Date{" "}
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Script{" "}
            <input
              id="create-script-input"
              type="file"
              onChange={(e) => setScriptFile(e.target.files?.[0] || null)}
            />
          </label>
        </div>

        <button type="submit">Create</button>
      </form>

      <h3>List</h3>
      <table border="1" cellPadding="6" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Date</th>
            <th>Script</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((e) => {
            const isEditing = editingId === e.id;

            return (
              <tr key={e.id}>
                <td>
                  {isEditing ? (
                    <input
                      type="number"
                      value={editNumber}
                      onChange={(ev) => setEditNumber(ev.target.value)}
                      style={{ width: 90 }}
                    />
                  ) : (
                    e.number
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      value={editTitle}
                      onChange={(ev) => setEditTitle(ev.target.value)}
                    />
                  ) : (
                    e.title
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input
                      type="date"
                      value={editDate}
                      onChange={(ev) => setEditDate(ev.target.value)}
                    />
                  ) : (
                    e.date
                  )}
                </td>

                <td>
                  {e.script_files && e.script_files.length > 0 ? (
                    <a
                      href={`/api/events/${e.id}/script`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download
                    </a>
                  ) : (
                    "—"
                  )}

                  {isEditing && (
                    <div style={{ marginTop: 6 }}>
                      <input
                        id="edit-script-input"
                        type="file"
                        onChange={(ev) =>
                          setEditScriptFile(ev.target.files?.[0] || null)
                        }
                      />
                      <div style={{ fontSize: 12 }}>
                        (Pick a file to replace the script)
                      </div>
                    </div>
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(e.id)}>Save</button>{" "}
                      <button onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEdit(e)}>Edit</button>{" "}
                      <button onClick={() => handleDelete(e.id)}>Delete</button>
                    </>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}