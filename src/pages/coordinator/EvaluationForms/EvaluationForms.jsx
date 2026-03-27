import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockApi as api } from "../../../api/axiosInstance";
import styles from "./EvaluationForms.module.css";
import {
  Add, Search, Visibility, Edit, Delete, FilterList
} from "@mui/icons-material";

const STATUS_OPTIONS = ["All Status", "Published", "Draft"];
const ASSIGN_OPTIONS = ["All Roles", "Supervisor", "Examiner"];

const timeAgo = (dateString) => {
  const now = new Date();
  const date = new Date(dateString);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff} seconds ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} days ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)} months ago`;
  return `${Math.floor(diff / 31536000)} years ago`;
};

export default function EvaluationForms() {
  const navigate = useNavigate();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [assignFilter, setAssignFilter] = useState("All Roles");
  const [deleteId, setDeleteId] = useState(null);
  const [viewForm, setViewForm] = useState(null);
  const [viewOnly, setViewOnly] = useState(false);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    setLoading(true);
    try {
      // 🔴 MOCK
      const res = await api.get("/evaluationForms");
      setForms(res.data);
      //  REAL
      // const res = await api.get("/evaluation-forms");
      // setForms(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      //  MOCK
      await api.delete(`/evaluationForms/${id}`);
      //  REAL
      // await api.delete(`/evaluation-forms/${id}`);
      setForms(prev => prev.filter(f => f.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditSave = async (updatedForm) => {
    try {
      // 🔴 MOCK
      await api.put(`/evaluationForms/${updatedForm.id}`, updatedForm);
      // ✅ REAL
      // await api.patch(`/evaluation-forms/${updatedForm.id}`, updatedForm);
      setForms(prev => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = forms.filter(f => {
    const matchSearch = f.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All Status" || f.status === statusFilter.toLowerCase();
    const matchAssign = assignFilter === "All Roles" || f.assignTo === assignFilter;
    return matchSearch && matchStatus && matchAssign;
  });

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Evaluation Forms</h1>
          <p className={styles.pageSubtitle}>Manage all evaluation forms</p>
        </div>
        <button className={styles.createBtn} onClick={() => navigate("/coordinator/create-evaluation-form")}>
          <Add fontSize="small" /> Create Form
        </button>
      </div>

      <div className={styles.filtersBox}>
        <div className={styles.searchWrapper}>
          <Search className={styles.searchIcon} fontSize="small" />
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <FilterList fontSize="small" style={{ color: "#888" }} />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={styles.filterSelect}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className={styles.filterGroup}>
            <select value={assignFilter} onChange={(e) => setAssignFilter(e.target.value)} className={styles.filterSelect}>
              {ASSIGN_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <p>No evaluation forms found.</p>
          <button className={styles.createBtn} onClick={() => navigate("/coordinator/create-evaluation-form")}>
            <Add fontSize="small" /> Create your first form
          </button>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Assign To</th>
                <th>Fields</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f, i) => (
                <tr key={f.id}>
                  <td className={styles.num}>{i + 1}</td>
                  <td className={styles.titleCell}>{f.title}</td>
                  <td>
                    <span className={`${styles.assignBadge} ${f.assignTo === "Supervisor" ? styles.supervisor : styles.examiner}`}>
                      {f.assignTo}
                    </span>
                  </td>
                  <td>{f.fields?.length || 0} fields</td>
                  <td>
                    <span className={`${styles.statusBadge} ${f.status === "published" ? styles.published : styles.draft}`}>
                      {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                    </span>
                  </td>
                  <td className={styles.date}>{timeAgo(f.createdAt)}</td>
                  <td>
                    <div className={styles.actions}>
                      <button
                        className={styles.viewBtn}
                        onClick={() => { setViewForm(f); setViewOnly(true); }}
                        title="View"
                      >
                        <Visibility fontSize="small" />
                      </button>
                      <button
                        className={styles.editActionBtn}
                        onClick={() => { setViewForm(f); setViewOnly(false); }}
                        title="Edit"
                      >
                        <Edit fontSize="small" />
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteId(f.id)}
                        title="Delete"
                      >
                        <Delete fontSize="small" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewForm && (
        <ViewEditModal
          form={viewForm}
          viewOnly={viewOnly}
          onClose={() => setViewForm(null)}
          onSave={(updated) => { handleEditSave(updated); setViewForm(null); }}
        />
      )}

      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Form</h3>
            <p className={styles.modalText}>Are you sure you want to delete this form? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button className={styles.confirmDeleteBtn} onClick={() => handleDelete(deleteId)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── View / Edit Modal ───────────────────────────────────────────────
function ViewEditModal({ form, viewOnly, onClose, onSave }) {
  const [isEdit, setIsEdit] = useState(!viewOnly);
  const [title, setTitle] = useState(form.title);
  const [assignTo, setAssignTo] = useState(form.assignTo);
  const [description, setDescription] = useState(form.description || "");
  const [fields, setFields] = useState(form.fields || []);
  const [showAddField, setShowAddField] = useState(false);
  const [newField, setNewField] = useState({ fieldName: "", minValue: "", maxValue: "" });
  const [fieldError, setFieldError] = useState("");
  const [saveError, setSaveError] = useState("");

  const handleAddField = () => {
    if (!newField.fieldName.trim() || newField.minValue === "" || newField.maxValue === "") {
      setFieldError("All fields are required.");
      return;
    }
    if (Number(newField.minValue) >= Number(newField.maxValue)) {
      setFieldError("Min value must be less than Max value.");
      return;
    }
    setFieldError("");
    setFields(prev => [...prev, { ...newField, id: Date.now() }]);
    setNewField({ fieldName: "", minValue: "", maxValue: "" });
    setShowAddField(false);
  };

  const handleDeleteField = (id) => {
    setFields(prev => prev.filter(f => f.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) { setSaveError("Form title is required."); return; }
    if (fields.length === 0) { setSaveError("Please add at least one field."); return; }

    // validate min < max for all fields
    for (const f of fields) {
      if (f.minValue !== "" && f.maxValue !== "" && Number(f.minValue) >= Number(f.maxValue)) {
        setSaveError(`Min value must be less than Max value in field "${f.fieldName}".`);
        return;
      }
    }

    setSaveError("");
    onSave({ ...form, title, assignTo, description, fields });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.largeModal}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>{isEdit ? "Edit Form" : "View Form"}</h3>
          <div className={styles.modalHeaderActions}>
            {viewOnly && !isEdit && (
              <button className={styles.editActionBtn} onClick={() => setIsEdit(true)}>
                <Edit fontSize="small" /> Edit
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.modalBody}>
          {saveError && <p className={styles.fieldErrorMsg}>{saveError}</p>}

          <div className={styles.modalRow}>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Form Title</label>
              {isEdit ? (
                <input
                  className={styles.modalInput}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setSaveError(""); }}
                />
              ) : <p className={styles.modalValue}>{title}</p>}
            </div>
            <div className={styles.modalField}>
              <label className={styles.modalLabel}>Assign To</label>
              {isEdit ? (
                <select className={styles.modalInput} value={assignTo} onChange={(e) => setAssignTo(e.target.value)}>
                  <option>Supervisor</option>
                  <option>Examiner</option>
                </select>
              ) : (
                <span className={`${styles.assignBadge} ${assignTo === "Supervisor" ? styles.supervisor : styles.examiner}`}>
                  {assignTo}
                </span>
              )}
            </div>
          </div>

          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Description</label>
            {isEdit ? (
              <textarea className={styles.modalTextarea} value={description} onChange={(e) => setDescription(e.target.value)} />
            ) : <p className={styles.modalValue}>{description || "-"}</p>}
          </div>

          <div>
            <label className={styles.modalLabel}>Form Fields</label>
            {fields.length > 0 && (
              <div className={styles.tableWrapper} style={{ marginTop: "8px" }}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Field Name</th>
                      <th>Type</th>
                      <th>Min</th>
                      <th>Max</th>
                      {isEdit && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map(f => (
                      <tr key={f.id}>
                        <td>
                          {isEdit ? (
                            <input className={styles.tableInput} value={f.fieldName}
                              onChange={(e) => setFields(fields.map(x => x.id === f.id ? { ...x, fieldName: e.target.value } : x))}
                            />
                          ) : f.fieldName}
                        </td>
                        <td><span className={styles.typeBadge}>Integer</span></td>
                        <td>
                          {isEdit ? (
                            <input type="number" className={styles.tableInput} value={f.minValue}
                              onChange={(e) => { setFields(fields.map(x => x.id === f.id ? { ...x, minValue: e.target.value } : x)); setSaveError(""); }}
                            />
                          ) : f.minValue || "-"}
                        </td>
                        <td>
                          {isEdit ? (
                            <input type="number" className={styles.tableInput} value={f.maxValue}
                              onChange={(e) => { setFields(fields.map(x => x.id === f.id ? { ...x, maxValue: e.target.value } : x)); setSaveError(""); }}
                            />
                          ) : f.maxValue || "-"}
                        </td>
                        {isEdit && (
                          <td>
                            <button className={styles.deleteBtn} onClick={() => handleDeleteField(f.id)}>
                              <Delete fontSize="small" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {isEdit && showAddField && (
              <div className={styles.addFieldBox}>
                <div className={styles.addFieldRow}>
                  <div>
                    <label className={styles.modalLabel}>Field Name <span className={styles.required}>*</span></label>
                    <input
                      className={styles.modalInput}
                      placeholder="e.g. Implementation"
                      value={newField.fieldName}
                      onChange={(e) => { setNewField({ ...newField, fieldName: e.target.value }); setFieldError(""); }}
                    />
                  </div>
                  <div>
                    <label className={styles.modalLabel}>Min Value <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      className={styles.modalInput}
                      value={newField.minValue}
                      onChange={(e) => { setNewField({ ...newField, minValue: e.target.value }); setFieldError(""); }}
                    />
                  </div>
                  <div>
                    <label className={styles.modalLabel}>Max Value <span className={styles.required}>*</span></label>
                    <input
                      type="number"
                      className={styles.modalInput}
                      value={newField.maxValue}
                      onChange={(e) => { setNewField({ ...newField, maxValue: e.target.value }); setFieldError(""); }}
                    />
                  </div>
                </div>
                {fieldError && <p className={styles.fieldErrorMsg}>{fieldError}</p>}
                <div className={styles.modalActions} style={{ marginTop: "10px" }}>
                  <button className={styles.cancelBtn} onClick={() => { setShowAddField(false); setFieldError(""); }}>Cancel</button>
                  <button className={styles.saveBtn} onClick={handleAddField}>Add</button>
                </div>
              </div>
            )}

            {isEdit && !showAddField && (
              <button className={styles.addFieldBtn} onClick={() => setShowAddField(true)}>
                <Add fontSize="small" /> Add Field
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {isEdit ? "Cancel" : "Close"}
          </button>
          {isEdit && (
            <button className={styles.saveBtn} onClick={handleSave}>Save Changes</button>
          )}
        </div>
      </div>
    </div>
  );
}