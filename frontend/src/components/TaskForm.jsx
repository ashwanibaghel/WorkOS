import { Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";

export const TaskForm = ({ members, onSubmit }) => {
  const [form, setForm] = useState({ title: "", description: "", assignedTo: "", dueDate: "" });
  const [generating, setGenerating] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!form.title.trim()) return;
    await onSubmit({ ...form, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null });
    setForm({ title: "", description: "", assignedTo: "", dueDate: "" });
  };

  const generateDescription = async () => {
    if (!form.title.trim()) return;
    setGenerating(true);
    try {
      const res = await api.post("/ai/description", { title: form.title });
      const text = [
        res.data.description,
        "",
        "Steps:",
        ...res.data.steps.map((step) => `- ${step}`),
        "",
        "Edge cases:",
        ...res.data.edgeCases.map((edge) => `- ${edge}`),
        "",
        "Acceptance criteria:",
        ...res.data.acceptanceCriteria.map((item) => `- ${item}`)
      ].join("\n");
      setForm((current) => ({ ...current, description: text }));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <label className="task-field task-title-field">
        <span>Task title</span>
        <input placeholder="What needs to be done?" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </label>
      <button type="button" className="ghost-button" onClick={generateDescription} disabled={generating}>
        <Sparkles size={16} /> {generating ? "Generating" : "Describe"}
      </button>
      <label className="task-field">
        <span>Assignee</span>
        <select value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
          <option value="">Unassigned</option>
          {members.map((member) => <option key={member._id} value={member._id}>{member.name}</option>)}
        </select>
      </label>
      <label className="task-field">
        <span>Due date</span>
        <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      </label>
      <label className="task-field task-description-field">
        <span>Description</span>
        <textarea placeholder="Add details, acceptance criteria, or click Describe after entering a title." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      </label>
      <button className="primary-button"><Plus size={16} /> Add task</button>
    </form>
  );
};
