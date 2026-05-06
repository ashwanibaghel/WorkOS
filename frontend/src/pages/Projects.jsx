import { format } from "date-fns";
import {
  CalendarDays,
  CheckCircle2,
  Flag,
  FolderKanban,
  LayoutList,
  Plus,
  Sparkles,
  Target,
  Users
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../state/AuthContext.jsx";

const initialForm = {
  name: "",
  description: "",
  category: "engineering",
  priority: "medium",
  deliveryMode: "kanban",
  status: "planning",
  projectManager: "",
  startDate: "",
  dueDate: "",
  goals: "",
  successCriteria: "",
  tags: "",
  members: [],
  aiStarterPlan: true
};

const templates = [
  {
    label: "Engineering Build",
    icon: <FolderKanban size={14} />,
    patch: {
      category: "engineering",
      deliveryMode: "sprint",
      priority: "high",
      goals: "Ship production-ready MVP\nClose security and reliability gaps\nPrepare demo-ready workflow",
      successCriteria: "Core flows work end-to-end\nRBAC and validation are enforced\nDashboard metrics are live",
      tags: "backend, frontend, ai"
    }
  },
  {
    label: "Product Launch",
    icon: <Sparkles size={14} />,
    patch: {
      category: "product",
      deliveryMode: "milestone",
      priority: "high",
      goals: "Define launch scope\nCoordinate design, engineering, and QA\nMeasure adoption signals",
      successCriteria: "Launch checklist approved\nCritical issues resolved\nStakeholders have status visibility",
      tags: "launch, roadmap, growth"
    }
  },
  {
    label: "Client Delivery",
    icon: <Users size={14} />,
    patch: {
      category: "client",
      deliveryMode: "kanban",
      priority: "medium",
      goals: "Capture client requirements\nTrack deliverables and blockers\nMaintain clean audit trail",
      successCriteria: "Client sign-off received\nAll deliverables have owners\nNo overdue critical tasks",
      tags: "client, delivery, ops"
    }
  }
];

const categoryLabels = {
  engineering: "Engineering",
  product: "Product",
  design: "Design",
  marketing: "Marketing",
  operations: "Operations",
  research: "Research",
  client: "Client",
  other: "Other"
};

const priorityLabels = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical"
};

const splitLines = (value) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);

const splitTags = (value) =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);

const formatDate = (date) => (date ? format(new Date(date), "MMM d, yyyy") : "No deadline");

const nextTaskDate = (startDate, index) => {
  const base = startDate ? new Date(startDate) : new Date();
  base.setDate(base.getDate() + (index + 1) * 2);
  return base.toISOString();
};

export const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);

  const canManage = ["admin", "manager"].includes(user.role);
  const leadOptions = useMemo(() => (
    user.role === "admin" ? users.filter((item) => ["admin", "manager"].includes(item.role)) : []
  ), [user.role, users]);
  const assignableMembers = useMemo(() => (
    user.role === "manager"
      ? users.filter((item) => item.role === "member")
      : users.filter((item) => item.role !== "admin")
  ), [user.role, users]);

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((project) => project.status === "active").length,
    critical: projects.filter((project) => ["high", "critical"].includes(project.priority)).length
  }), [projects]);

  const load = async () => {
    const requests = [api.get("/projects")];
    if (canManage) requests.push(api.get("/users"));
    const [projectRes, userRes] = await Promise.all(requests);
    setProjects(projectRes.data.projects);
    if (userRes) setUsers(userRes.data.users);
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [canManage]);

  const updateForm = (patch) => setForm((current) => ({ ...current, ...patch }));

  const toggleMember = (memberId) => {
    setForm((current) => ({
      ...current,
      members: current.members.includes(memberId)
        ? current.members.filter((id) => id !== memberId)
        : [...current.members, memberId]
    }));
  };

  const buildProjectPayload = () => {
    const selectedMembers = Array.from(new Set([
      ...form.members,
      ...(form.projectManager ? [form.projectManager] : [])
    ]));

    return {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      priority: form.priority,
      deliveryMode: form.deliveryMode,
      status: form.status,
      projectManager: form.projectManager || null,
      goals: splitLines(form.goals),
      successCriteria: splitLines(form.successCriteria),
      tags: splitTags(form.tags),
      members: selectedMembers,
      ...(form.startDate ? { startDate: form.startDate } : {}),
      ...(form.dueDate ? { dueDate: form.dueDate } : {})
    };
  };

  const createStarterTasks = async (project) => {
    const goal = [
      project.name,
      project.description,
      ...splitLines(form.goals),
      ...splitLines(form.successCriteria)
    ].filter(Boolean).join("\n");

    const planRes = await api.post("/ai/breakdown", { goal, projectId: project._id });
    const starterTasks = (planRes.data.tasks || []).slice(0, 5);

    await Promise.all(starterTasks.map((task, index) => {
      const acceptance = task.acceptanceCriteria?.length
        ? `\n\nAcceptance criteria:\n${task.acceptanceCriteria.map((item) => `- ${item}`).join("\n")}`
        : "";

      return api.post("/tasks", {
        title: task.title,
        description: `${task.description || ""}${acceptance}`,
        projectId: project._id,
        assignedTo: form.projectManager || null,
        status: "todo",
        dueDate: nextTaskDate(form.startDate, index)
      });
    }));
  };

  const createProject = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || creating) return;

    setCreating(true);
    setError("");
    setNotice("");

    try {
      const res = await api.post("/projects", buildProjectPayload());
      const project = res.data.project;
      let starterMessage = "";

      if (form.aiStarterPlan) {
        try {
          await createStarterTasks(project);
          starterMessage = " AI starter tasks were generated and saved.";
        } catch (starterError) {
          starterMessage = ` Project created, but AI starter tasks could not be generated: ${starterError.message}`;
        }
      }

      setNotice(`${project.name} is ready.${starterMessage}`);
      setForm(initialForm);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="page projects-page">
      <div className="projects-hero">
        <div>
          <span className="projects-eyebrow">Workspace setup</span>
          <h1>Projects</h1>
          <p>Create structured team workspaces with ownership, timeline, risk priority, and AI-generated starter tasks.</p>
        </div>
        <div className="projects-hero-stats">
          <span><strong>{stats.total}</strong> total</span>
          <span><strong>{stats.active}</strong> active</span>
          <span><strong>{stats.critical}</strong> high risk</span>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {notice && <div className="success-banner"><CheckCircle2 size={16} /> {notice}</div>}

      {canManage && (
        <form className="project-create-card" onSubmit={createProject}>
          <div className="project-create-main">
            <div className="project-form-header">
              <div>
                <span className="projects-eyebrow">Launch setup</span>
                <h2>Create a new workspace</h2>
              </div>
              <div className="template-strip">
                {templates.map((template) => (
                  <button
                    type="button"
                    className="template-button"
                    key={template.label}
                    onClick={() => updateForm(template.patch)}
                  >
                    {template.icon}
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="project-form-grid">
              <label className="form-field field-wide">
                Project name
                <input
                  placeholder="Authentication platform revamp"
                  value={form.name}
                  onChange={(e) => updateForm({ name: e.target.value })}
                />
              </label>

              <label className="form-field field-wide">
                Description
                <textarea
                  placeholder="What problem is this project solving, and what should the team deliver?"
                  value={form.description}
                  onChange={(e) => updateForm({ description: e.target.value })}
                />
              </label>

              <label className="form-field">
                Category
                <select value={form.category} onChange={(e) => updateForm({ category: e.target.value })}>
                  {Object.entries(categoryLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>

              <label className="form-field">
                Priority
                <select value={form.priority} onChange={(e) => updateForm({ priority: e.target.value })}>
                  {Object.entries(priorityLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
                </select>
              </label>

              <label className="form-field">
                Delivery mode
                <select value={form.deliveryMode} onChange={(e) => updateForm({ deliveryMode: e.target.value })}>
                  <option value="kanban">Kanban flow</option>
                  <option value="sprint">Sprint execution</option>
                  <option value="milestone">Milestone delivery</option>
                </select>
              </label>

              <label className="form-field">
                Initial status
                <select value={form.status} onChange={(e) => updateForm({ status: e.target.value })}>
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="on-hold">On hold</option>
                </select>
              </label>

              <label className="form-field">
                Start date
                <input type="date" value={form.startDate} onChange={(e) => updateForm({ startDate: e.target.value })} />
              </label>

              <label className="form-field">
                Target date
                <input type="date" value={form.dueDate} onChange={(e) => updateForm({ dueDate: e.target.value })} />
              </label>

              <label className="form-field">
                Project lead
                {user.role === "admin" ? (
                  <select value={form.projectManager} onChange={(e) => updateForm({ projectManager: e.target.value })}>
                    <option value="">No dedicated lead yet</option>
                    {leadOptions.map((manager) => (
                      <option value={manager._id} key={manager._id}>{manager.name} - {manager.role}</option>
                    ))}
                  </select>
                ) : (
                  <div className="locked-lead">
                    <strong>{user.name}</strong>
                    <small>You are the default lead for projects you create.</small>
                  </div>
                )}
              </label>

              <label className="form-field">
                Tags
                <input
                  placeholder="security, api, launch"
                  value={form.tags}
                  onChange={(e) => updateForm({ tags: e.target.value })}
                />
              </label>

              <label className="form-field field-wide">
                Goals
                <textarea
                  placeholder={"One goal per line\nExample: Implement role-based onboarding"}
                  value={form.goals}
                  onChange={(e) => updateForm({ goals: e.target.value })}
                />
              </label>

              <label className="form-field field-wide">
                Success criteria
                <textarea
                  placeholder={"One acceptance signal per line\nExample: Manager can create and assign tasks end-to-end"}
                  value={form.successCriteria}
                  onChange={(e) => updateForm({ successCriteria: e.target.value })}
                />
              </label>
            </div>
          </div>

          <aside className="project-launch-panel">
            <div className="launch-panel-card">
              <div className="launch-panel-title">
                <Target size={16} />
                Team allocation
              </div>
              <div className="team-picker">
                {assignableMembers.length === 0 && <p>No assignable members available yet.</p>}
                {assignableMembers.map((member) => (
                  <label className="team-option" key={member._id}>
                    <input
                      type="checkbox"
                      checked={form.members.includes(member._id)}
                      onChange={() => toggleMember(member._id)}
                    />
                    <span>
                      <strong>{member.name}</strong>
                      <small>{member.role}</small>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="launch-panel-card">
              <div className="launch-panel-title">
                <Sparkles size={16} />
                AI starter plan
              </div>
              <label className="ai-toggle-row">
                <input
                  type="checkbox"
                  checked={form.aiStarterPlan}
                  onChange={(e) => updateForm({ aiStarterPlan: e.target.checked })}
                />
                Generate 3-5 starter tasks after project creation
              </label>
              <div className="launch-preview">
                <span><Flag size={13} /> {priorityLabels[form.priority]} priority</span>
                <span><LayoutList size={13} /> {form.deliveryMode}</span>
                <span><CalendarDays size={13} /> {form.dueDate ? formatDate(form.dueDate) : "Set target date"}</span>
              </div>
            </div>

            <button className="primary-button project-submit" disabled={creating}>
              <Plus size={16} />
              {creating ? "Creating..." : "Create workspace"}
            </button>
          </aside>
        </form>
      )}

      <div className="project-list project-list-pro">
        {projects.map((project) => (
          <Link className="project-card project-card-pro" to={`/projects/${project._id}`} key={project._id}>
            <div className="project-card-top">
              <span className="project-category">{categoryLabels[project.category] || "Project"}</span>
              <span className={`project-priority priority-${project.priority || "medium"}`}>
                {priorityLabels[project.priority] || "Medium"}
              </span>
            </div>
            <h2>{project.name}</h2>
            <p>{project.description || "No description yet."}</p>
            <div className="project-card-meta">
              <span><Users size={13} /> {project.members?.length || 0} members</span>
              <span><Target size={13} /> {project.projectManager?.name || "No lead"}</span>
              <span><CalendarDays size={13} /> {formatDate(project.dueDate)}</span>
            </div>
            {project.tags?.length > 0 && (
              <div className="project-tags">
                {project.tags.slice(0, 4).map((tag) => <small key={tag}>{tag}</small>)}
              </div>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
};
