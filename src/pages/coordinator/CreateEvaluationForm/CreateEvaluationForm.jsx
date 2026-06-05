import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axiosInstance";
import styles from "./CreateEvaluationForm.module.css";
import { Delete, Add, Info, Edit, Save, Publish } from "@mui/icons-material";

const ASSIGN_OPTIONS = ["Supervisor", "Examiner"];

export default function CreateEvaluationForm() {
  const navigate = useNavigate();

  const [formTitle, setFormTitle] = useState("");
  const [assignTo, setAssignTo] = useState("Supervisor");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState([]);
  const [showAddField, setShowAddField] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isEditMode, setIsEditMode] = useState(true);
  const [savedId, setSavedId] = useState(null);
  const [fieldError, setFieldError] = useState("");
  const [addingField, setAddingField] = useState(false);

  const [newField, setNewField] = useState({
    fieldName: "",
    minValue: "",
    maxValue: "",
  });

  const ensureFormCreated = async () => {
    if (savedId) return savedId;
    const payload = {
      title: formTitle,
      assignTo,
      description,
      status: 0,
    };
    const res = await api.post("/Coordinator/EvaluationForms", payload);
    const id = res.data.id;
    setSavedId(id);
    return id;
  };

  const handleAddField = async () => {
    if (!newField.fieldName.trim() || newField.minValue === "" || newField.maxValue === "") {
      setFieldError("All fields are required.");
      return;
    }
    if (Number(newField.minValue) >= Number(newField.maxValue)) {
      setFieldError("Min value must be less than Max value.");
      return;
    }
    if (!formTitle.trim()) {
      setFieldError("Please enter a form title before adding fields.");
      return;
    }

    setFieldError("");
    setAddingField(true);
    try {
      const formId = await ensureFormCreated();
      const res = await api.post(`/Coordinator/EvaluationForms/${formId}/fields`, {
        fieldName: newField.fieldName,
        minValue: Number(newField.minValue),
        maxValue: Number(newField.maxValue),
        isRequired: true,
      });
      setFields((prev) => [...prev, res.data]);
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
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
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
    } catch (err) {
      console.error(err);
    }
  };

  const validate = () => {
    if (!formTitle.trim()) { setError("Please enter a form title."); return false; }
    if (fields.length === 0) { setError("Please add at least one field."); return false; }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const formId = await ensureFormCreated();
      await api.post(`/Coordinator/EvaluationForms/${formId}/draft`, {});
      setSuccess("Saved as draft successfully!");
      setIsEditMode(false);
      setTimeout(() => navigate("/coordinator/evaluation-forms"), 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditMode(true);
    setSuccess("");
    setError("");
  };

  const handlePublish = async () => {
    if (!validate()) return;
    setLoading(true);
    setError("");
    try {
      const formId = await ensureFormCreated();
      await api.post(`/Coordinator/EvaluationForms/${formId}/publish`, {});
      setSuccess("Form published successfully!");
      setIsEditMode(false);
      setTimeout(() => navigate("/coordinator/evaluation-forms"), 1500);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Create Evaluation Form</h1>
        <p className={styles.pageSubtitle}>
          Create a new form template to collect data from professors at the beginning of the academic semester
        </p>
      </div>

      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.successMsg}>{success}</p>}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Semester Form Details</h2>
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Form Title</label>
            <input
              type="text"
              placeholder="e.g. Fall 2026 Course Implementation Report"
              value={formTitle}
              onChange={(e) => { setFormTitle(e.target.value); setError(""); }}
              className={styles.input}
              disabled={!isEditMode}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Assign To</label>
            <div style={{ position: "relative" }}>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className={styles.select}
                disabled={!isEditMode}
              >
                {ASSIGN_OPTIONS.map((o) => <option key={o}>{o}</option>)}
              </select>
              <span className={styles.selectArrow}>▾</span>
            </div>
          </div>
        </div>
        <div className={styles.fieldGroup} style={{ marginTop: "16px" }}>
          <label className={styles.label}>Description</label>
          <textarea
            placeholder="Brief instructions for professors about what to fill"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            disabled={!isEditMode}
          />
        </div>
      </div>

      <div className={styles.section}>
        <div>
          <h2 className={styles.sectionTitle}>Form Fields</h2>
          <p className={styles.sectionSubtitle}>Add the fields that professors must fill</p>
        </div>

        <div className={styles.note}>
          <Info fontSize="small" sx={{ color: "#3b82f6" }} />
          <span><strong>Note:</strong> Min/Max values are used to set the grade range for each field</span>
        </div>

        {fields.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Field Name</th>
                  <th>Type</th>
                  <th>Min Value</th>
                  <th>Max Value</th>
                  {isEditMode && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {fields.map((f) => (
                  <tr key={f.id}>
                    <td>
                      {isEditMode ? (
                        <input
                          className={styles.tableInput}
                          value={f.fieldName}
                          onChange={(e) => setFields(fields.map(x => x.id === f.id ? { ...x, fieldName: e.target.value } : x))}
                          onBlur={(e) => handleUpdateField(f.id, { ...f, fieldName: e.target.value })}
                        />
                      ) : f.fieldName}
                    </td>
                    <td><span className={styles.typeBadge}>Integer</span></td>
                    <td>
                      {isEditMode ? (
                        <input
                          type="number"
                          className={styles.tableInput}
                          value={f.minValue}
                          onChange={(e) => setFields(fields.map(x => x.id === f.id ? { ...x, minValue: e.target.value } : x))}
                          onBlur={(e) => handleUpdateField(f.id, { ...f, minValue: e.target.value })}
                        />
                      ) : f.minValue ?? "-"}
                    </td>
                    <td>
                      {isEditMode ? (
                        <input
                          type="number"
                          className={styles.tableInput}
                          value={f.maxValue}
                          onChange={(e) => setFields(fields.map(x => x.id === f.id ? { ...x, maxValue: e.target.value } : x))}
                          onBlur={(e) => handleUpdateField(f.id, { ...f, maxValue: e.target.value })}
                        />
                      ) : f.maxValue ?? "-"}
                    </td>
                    {isEditMode && (
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

        {showAddField && isEditMode && (
          <div className={styles.addFieldBox}>
            <div className={styles.addFieldRow}>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Field Name <span className={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Implementation"
                  value={newField.fieldName}
                  onChange={(e) => { setNewField({ ...newField, fieldName: e.target.value }); setFieldError(""); }}
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Min Value <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  value={newField.minValue}
                  onChange={(e) => { setNewField({ ...newField, minValue: e.target.value }); setFieldError(""); }}
                  className={styles.input}
                />
              </div>
              <div className={styles.fieldGroup}>
                <label className={styles.label}>
                  Max Value <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  value={newField.maxValue}
                  onChange={(e) => { setNewField({ ...newField, maxValue: e.target.value }); setFieldError(""); }}
                  className={styles.input}
                />
              </div>
            </div>
            {fieldError && <p className={styles.fieldErrorMsg}>{fieldError}</p>}
            <div className={styles.addFieldActions}>
              <button className={styles.cancelBtn} onClick={() => { setShowAddField(false); setFieldError(""); }}>Cancel</button>
              <button className={styles.confirmBtn} onClick={handleAddField} disabled={addingField}>
                {addingField ? "Adding..." : "Add"}
              </button>
            </div>
          </div>
        )}

        {!showAddField && isEditMode && (
          <button className={styles.addFieldBtn} onClick={() => setShowAddField(true)}>
            <Add fontSize="small" /> Add Field
          </button>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.draftBtn} onClick={handleSaveDraft} disabled={loading || !isEditMode}>
          <Save fontSize="small" /> Save as Draft
        </button>
        <button className={styles.editBtn} onClick={handleEdit} disabled={loading || isEditMode}>
          <Edit fontSize="small" /> Edit
        </button>
        <button className={styles.publishBtn} onClick={handlePublish} disabled={loading}>
          {loading ? <span className={styles.spinner} /> : <><Publish fontSize="small" /> Publish</>}
        </button>
      </div>
    </div>
  );
}