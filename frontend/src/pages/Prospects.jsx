import { useEffect, useState } from "react";
import "./Participants.css";

export default function Prospects() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // create form state
  const [newName, setNewName] = useState("");
  const [newApproached, setNewApproached] = useState("");
  const [newResponse, setNewResponse] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newSuggestedBy, setNewSuggestedBy] = useState("");
  const [newRemarks, setNewRemarks] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);


  // edit state (one row at a time)
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editApproached, setEditApproached] = useState("");
  const [editResponse, setEditResponse] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [editSuggestedBy, setEditSuggestedBy] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  async function load() {
    try {
      setError("");
      const res = await fetch("/api/prospects");
      if (!res.ok) throw new Error(await res.text());
      setItems(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      setError("");
      const payload = {
        name: newName,
        approached: newApproached || null,
        response: newResponse || null,
        domain: newDomain || null,
        suggested_by: newSuggestedBy || null,
        remarks: newRemarks || null,
      };

      const res = await fetch("/api/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setItems((prev) => [created, ...prev]);

      setNewName("");
      setNewApproached("");
      setNewResponse("");
      setNewDomain("");
      setNewSuggestedBy("");
      setNewRemarks("");
    } catch (e) {
      setError(String(e));
    }
  }

  function closeAddModal() {
    setShowAddModal(false);
    setNewName("");
    setNewApproached("");
    setNewResponse("");
    setNewDomain("");
    setNewSuggestedBy("");
    setNewRemarks("");
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEditName(p.name ?? "");
    setEditApproached(p.approached ?? "");
    setEditResponse(p.response ?? "");
    setEditDomain(p.domain ?? "");
    setEditSuggestedBy(p.suggested_by ?? "");
    setEditRemarks(p.remarks ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id) {
    try {
      setError("");
      const payload = {
        name: editName,
        approached: editApproached || null,
        response: editResponse || null,
        domain: editDomain || null,
        suggested_by: editSuggestedBy || null,
        remarks: editRemarks || null,
      };

      const res = await fetch(`/api/prospects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const updated = await res.json();

      setItems((prev) => prev.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (e) {
      setError(String(e));
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this prospect?")) return;
    try {
      setError("");
      const res = await fetch(`/api/prospects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) setEditingId(null);
    } catch (e) {
      setError(String(e));
    }
  }

  return (
    <div style={{ padding: 16 }}>
      <h2>Prospects</h2>

      {error && (
        <p style={{ color: "crimson", whiteSpace: "pre-wrap" }}>{error}</p>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <button
          type="button"
          className="k-btn k-btn--subtle"
          onClick={() => setShowAddModal(true)}
        >
          + Add prospect
        </button>
      </div>

      {showAddModal && (
        <div
          className="k-modal-backdrop"
          onClick={closeAddModal}
          role="dialog"
          aria-modal="true"
        >
          <div className="k-modal k-modal--form" onClick={(e) => e.stopPropagation()}>
            <button
              className="k-modal-close"
              type="button"
              onClick={closeAddModal}
              aria-label="Close"
            >
              ×
            </button>

            <h3 style={{ marginTop: 0 }}>Add prospect</h3>

            <form
              onSubmit={async (e) => {
                await handleCreate(e);
                closeAddModal();
              }}
            >
              <div className="k-edit-form">
                <div className="k-form-row">
                  <label htmlFor="p-name">Name</label>
                  <input
                    id="p-name"
                    className="k-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="p-approached">Approached</label>
                  <input
                    id="p-approached"
                    className="k-input"
                    value={newApproached}
                    onChange={(e) => setNewApproached(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="p-response">Response</label>
                  <input
                    id="p-response"
                    className="k-input"
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="p-domain">Domain</label>
                  <input
                    id="p-domain"
                    className="k-input"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="p-suggested">Suggested by</label>
                  <input
                    id="p-suggested"
                    className="k-input"
                    value={newSuggestedBy}
                    onChange={(e) => setNewSuggestedBy(e.target.value)}
                  />
                </div>

                <div className="k-form-row">
                  <label htmlFor="p-remarks">Remarks</label>
                  <input
                    id="p-remarks"
                    className="k-input k-input-long"
                    value={newRemarks}
                    onChange={(e) => setNewRemarks(e.target.value)}
                  />
                </div>

                <button type="submit" className="k-btn">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <table className="k-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Approached</th>
            <th>Response</th>
            <th>Domain</th>
            <th>Suggested by</th>
            <th>Remarks</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const isEditing = editingId === p.id;

            return (
              <tr key={p.id}>

                <td>
                  {isEditing ? (
                    <input className="k-input" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  ) : (
                    p.name
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input className="k-input" value={editApproached} onChange={(e) => setEditApproached(e.target.value)} />
                  ) : (
                    p.approached ?? ""
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input className="k-input" value={editResponse} onChange={(e) => setEditResponse(e.target.value)} />
                  ) : (
                    p.response ?? ""
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input className="k-input" value={editDomain} onChange={(e) => setEditDomain(e.target.value)} />
                  ) : (
                    p.domain ?? ""
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input className="k-input" value={editSuggestedBy} onChange={(e) => setEditSuggestedBy(e.target.value)} />
                  ) : (
                    p.suggested_by ?? ""
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <input className="k-input k-input-long" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} />
                  ) : (
                    p.remarks ?? ""
                  )}
                </td>

                <td>
                  {isEditing ? (
                    <>
                      <button className="k-btn" onClick={() => saveEdit(p.id)}>Save</button>{" "}
                      <button className="k-btn k-btn--subtle" onClick={cancelEdit}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <button className="k-btn" onClick={() => startEdit(p)}>Edit</button>{" "}
                      <button className="k-btn k-btn--subtle" onClick={() => handleDelete(p.id)}>Delete</button>
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