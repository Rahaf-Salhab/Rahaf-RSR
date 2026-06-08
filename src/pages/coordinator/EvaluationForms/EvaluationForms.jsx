import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import styles from "./EvaluationForms.module.css";
import {
  Add, Search, Visibility, Edit, Delete, FilterList,
  MoreVert, Publish,
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

const normalizeStatus = (status) => {
  if (status === 1 || status === "draft") return "draft";
  if (status === 2 || status === "published") return "published";
  return String(status).toLowerCase();
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
  const [openDropdown, setOpenDropdown] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const [publishingId, setPublishingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // ── Create limit state ──────────────────────────────────────────────
  const [canCreate, setCanCreate] = useState(true);
  const [createTooltip, setCreateTooltip] = useState("");
  const [semesterStartDate, setSemesterStartDate] = useState(null);

  useEffect(() => { fetchForms(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest(`.${styles.dropdownWrapper}`)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const checkCreateLimit = (normalizedForms, semesterStartDate) => {
    const semesterStart = semesterStartDate ? new Date(semesterStartDate) : null;

    const activeForms = normalizedForms.filter(f => {
      if (f.status !== "draft" && f.status !== "published") return false;
      // لو عندنا تاريخ بداية الفصل، نشوف بس الفورمز اللي اتعملت بعده
      if (semesterStart) {
        const createdAt = new Date(f.createdAt);
        return createdAt >= semesterStart;
      }
      return true;
    });

    const hasSupervisor = activeForms.some(f => f.assignTo === "Supervisor");
    const hasExaminer = activeForms.some(f => f.assignTo === "Examiner");
    if (hasSupervisor && hasExaminer) {
      setCanCreate(false);
      setCreateTooltip("You already have one form for Supervisor and one for Examiner this semester.");
    } else {
      setCanCreate(true);
      setCreateTooltip("");
    }
  };

  const fetchForms = async () => {
    setLoading(true);
    try {
      // جيب الفورمز والفصل الحالي بنفس الوقت
      const [formsRes, semesterRes] = await Promise.allSettled([
        api.get("/Coordinator/EvaluationForms"),
        api.get("/Semester/ActiveSemester"),
      ]);

      const semesterStartDate =
        semesterRes.status === "fulfilled"
          ? semesterRes.value.data?.semester?.startDate
          : null;

      setSemesterStartDate(semesterStartDate);

      const normalized = (formsRes.status === "fulfilled" ? formsRes.value.data || [] : [])
        .filter(f => f.status !== 3 && f.status !== "3")
        .map(f => ({ ...f, status: normalizeStatus(f.status) }));

      setForms(normalized);
      checkCreateLimit(normalized, semesterStartDate);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (e, id) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 150,
    });
    setOpenDropdown(openDropdown === id ? null : id);
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      const form = forms.find(f => f.id === id);
      if (form?.status === "published") {
        await api.post(`/Coordinator/EvaluationForms/${id}/draft`, {});
      }
      await api.delete(`/Coordinator/EvaluationForms/${id}`);
      const updated = forms.filter(f => f.id !== id);
      setForms(updated);
      setDeleteId(null);
      checkCreateLimit(updated, semesterStartDate);
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id) => {
    setPublishingId(id);
    setOpenDropdown(null);
    try {
      await api.post(`/Coordinator/EvaluationForms/${id}/publish`, {});
      setForms(prev => prev.map(f => f.id === id ? { ...f, status: "published" } : f));
    } catch (err) {
      console.error(err);
    } finally {
      setPublishingId(null);
    }
  };

  const handleOpenView = async (f, viewOnlyMode) => {
    setOpenDropdown(null);
    try {
      const res = await api.get(`/Coordinator/EvaluationForms/${f.id}`);
      const formData = { ...res.data, status: normalizeStatus(res.data.status) };
      setViewForm(formData);
      setViewOnly(viewOnlyMode);
    } catch (err) {
      console.error(err);
      setViewForm(f);
      setViewOnly(viewOnlyMode);
    }
  };

  const handleEditSave = (updatedForm) => {
    setForms(prev => prev.map(f =>
      f.id === updatedForm.id
        ? { ...updatedForm, status: normalizeStatus(updatedForm.status) }
        : f
    ));
    setViewForm(null);
  };

  const filtered = forms.filter(f => {
    const matchSearch = f.title?.toLowerCase().includes(search.toLowerCase());
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
        <button
          className={styles.createBtn}
          onClick={() => canCreate && navigate("/coordinator/create-evaluation-form")}
          disabled={!canCreate}
          title={createTooltip}
          style={!canCreate ? { opacity: 0.5, cursor: "not-allowed" } : {}}
        >
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
          {canCreate && (
            <button className={styles.createBtn} onClick={() => navigate("/coordinator/create-evaluation-form")}>
              <Add fontSize="small" /> Create your first form
            </button>
          )}
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
                      {f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : "-"}
                    </span>
                  </td>
                  <td className={styles.date}>{timeAgo(f.createdAt)}</td>
                  <td>
                    <div className={styles.dropdownWrapper}>
                      <button
                        className={styles.menuBtn}
                        onClick={(e) => handleMenuClick(e, f.id)}
                        disabled={publishingId === f.id || deletingId === f.id}
                      >
                        <MoreVert fontSize="small" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dropdown Portal */}
      {openDropdown && (
        <div
          className={styles.dropdownMenu}
          style={{ top: dropdownPos.top, left: dropdownPos.left, position: "absolute" }}
        >
          {(() => {
            const f = forms.find(x => x.id === openDropdown);
            if (!f) return null;
            return (
              <>
                <button
                  className={styles.dropdownItem}
                  onClick={() => handleOpenView(f, true)}
                >
                  <Visibility fontSize="small" style={{ color: "#1e40af" }} /> View
                </button>

                {f.status === "draft" && (
                  <>
                    <button
                      className={styles.dropdownItem}
                      onClick={() => handleOpenView(f, false)}
                    >
                      <Edit fontSize="small" style={{ color: "#92400e" }} /> Edit
                    </button>
                    <div className={styles.dropdownDivider} />
                    <button
                      className={`${styles.dropdownItem} ${styles.dropdownPublish}`}
                      onClick={() => handlePublish(f.id)}
                      disabled={publishingId === f.id}
                    >
                      <Publish fontSize="small" />
                      {publishingId === f.id ? "Publishing..." : "Publish"}
                    </button>
                  </>
                )}

                <div className={styles.dropdownDivider} />
                <button
                  className={`${styles.dropdownItem} ${styles.dropdownDelete}`}
                  onClick={() => { setDeleteId(f.id); setOpenDropdown(null); }}
                >
                  <Delete fontSize="small" /> Delete
                </button>
              </>
            );
          })()}
        </div>
      )}

      {viewForm && (
        <ViewEditModal
          form={viewForm}
          viewOnly={viewOnly}
          onClose={() => setViewForm(null)}
          onSave={(updated) => handleEditSave(updated)}
        />
      )}

      {deleteId && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>Delete Form</h3>
            <p className={styles.modalText}>Are you sure you want to delete this form? This action cannot be undone.</p>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setDeleteId(null)}>Cancel</button>
              <button
                className={styles.confirmDeleteBtn}
                onClick={() => handleDelete(deleteId)}
                disabled={deletingId === deleteId}
              >
                {deletingId === deleteId ? "Deleting..." : "Delete"}
              </button>
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
  const [saving, setSaving] = useState(false);
  const [addingField, setAddingField] = useState(false);

  const handleAddField = async () => {
    if (!newField.fieldName.trim() || newField.minValue === "" || newField.maxValue === "") {
      setFieldError("All fields are required.");
      return;
    }
    if (Number(newField.minValue) >= Number(newField.maxValue)) {
      setFieldError("Min value must be less than Max value.");
      return;
    }
    setFieldError("");
    setAddingField(true);
    try {
      const res = await api.post(`/Coordinator/EvaluationForms/${form.id}/fields`, {
        fieldName: newField.fieldName,
        minValue: Number(newField.minValue),
        maxValue: Number(newField.maxValue),
        isRequired: true,
      });
      setFields(prev => [...prev, res.data]);
      setNewField({ fieldName: "", minValue: "", maxValue: "" });
      setShowAddField(false);
    } catch (err) {
      console.error(err);
      setFieldError("Failed to add field. Please try again.");
    } finally {
      setAddingField(false);
    }
  };

  const handleDeleteField = async (fieldId) => {
    try {
      await api.delete(`/Coordinator/EvaluationForms/fields/${fieldId}`);
      setFields(prev => prev.filter(f => f.id !== fieldId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateField = async (fieldId, updatedField) => {
    try {
      await api.put(`/Coordinator/EvaluationForms/fields/${fieldId}`, {
        fieldName: updatedField.fieldName,
        minValue: Number(updatedField.minValue),
        maxValue: Number(updatedField.maxValue),
        isRequired: updatedField.isRequired ?? true,
      });
      setFields(fields.map(x => x.id === fieldId ? { ...x, ...updatedField } : x));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) { setSaveError("Form title is required."); return; }
    if (fields.length === 0) { setSaveError("Please add at least one field."); return; }
    for (const f of fields) {
      if (f.minValue !== "" && f.maxValue !== "" && Number(f.minValue) >= Number(f.maxValue)) {
        setSaveError(`Min value must be less than Max value in field "${f.fieldName}".`);
        return;
      }
    }
    setSaveError("");
    setSaving(true);
    try {
      const res = await api.put(`/Coordinator/EvaluationForms/${form.id}`, {
        title, assignTo, description,
      });
      onSave({ ...form, ...res.data, title, assignTo, description, fields });
    } catch (err) {
      console.error(err);
      setSaveError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.largeModal}>
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
              <textarea
                className={styles.modalTextarea}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
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
                            <input
                              className={styles.tableInput}
                              value={f.fieldName}
                              onBlur={(e) => handleUpdateField(f.id, { ...f, fieldName: e.target.value })}
                              onChange={(e) => setFields(fields.map(x => x.id === f.id ? { ...x, fieldName: e.target.value } : x))}
                            />
                          ) : f.fieldName}
                        </td>
                        <td><span className={styles.typeBadge}>Integer</span></td>
                        <td>
                          {isEdit ? (
                            <input
                              type="number"
                              className={styles.tableInput}
                              value={f.minValue}
                              onBlur={(e) => handleUpdateField(f.id, { ...f, minValue: e.target.value })}
                              onChange={(e) => { setFields(fields.map(x => x.id === f.id ? { ...x, minValue: e.target.value } : x)); setSaveError(""); }}
                            />
                          ) : f.minValue ?? "-"}
                        </td>
                        <td>
                          {isEdit ? (
                            <input
                              type="number"
                              className={styles.tableInput}
                              value={f.maxValue}
                              onBlur={(e) => handleUpdateField(f.id, { ...f, maxValue: e.target.value })}
                              onChange={(e) => { setFields(fields.map(x => x.id === f.id ? { ...x, maxValue: e.target.value } : x)); setSaveError(""); }}
                            />
                          ) : f.maxValue ?? "-"}
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
                  <button className={styles.saveBtn} onClick={handleAddField} disabled={addingField}>
                    {addingField ? "Adding..." : "Add"}
                  </button>
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

        <div className={styles.modalFooter}>
          <button className={styles.cancelBtn} onClick={onClose}>
            {isEdit ? "Cancel" : "Close"}
          </button>
          {isEdit && (
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}