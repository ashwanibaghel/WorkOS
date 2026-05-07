import { format } from "date-fns";
import { AlertTriangle, BarChart3, CheckCircle2, Clock, Flag, ListTodo, RotateCcw, Trash2, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";
import { AiPanel } from "../components/AiPanel.jsx";
import { KanbanBoard } from "../components/KanbanBoard.jsx";
import { MemberManager } from "../components/MemberManager.jsx";
import { ProjectChat } from "../components/ProjectChat.jsx";
import { TaskForm } from "../components/TaskForm.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export const ProjectDetail = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [aiReviewResults, setAiReviewResults] = useState({});
  const [aiReviewingId, setAiReviewingId] = useState("");
  const [error, setError] = useState("");

  const canManage = ["admin", "manager"].includes(user.role);

  const load = async () => {
    const [projectRes, tasksRes, activityRes] = await Promise.all([
      api.get(`/projects/${projectId}`),
      api.get(`/tasks/project/${projectId}`),
      api.get(`/projects/${projectId}/activity`)
    ]);
    setProject(projectRes.data.project);
    setTasks(tasksRes.data.tasks);
    setLogs(activityRes.data.logs);
    if (canManage) {
      const userRes = await api.get("/users");
      setUsers(userRes.data.users);
    }
  };

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, [projectId]);

  useEffect(() => {
    const socket = getSocket();
    socket.connect();
    socket.emit("project:join", projectId);
    socket.on("task:created", (task) => setTasks((items) => [task, ...items]));
    socket.on("task:updated", (task) => setTasks((items) => items.map((item) => (item._id === task._id ? task : item))));
    socket.on("task:deleted", ({ taskId }) => setTasks((items) => items.filter((item) => item._id !== taskId)));
    return () => {
      socket.emit("project:leave", projectId);
      socket.off("task:created");
      socket.off("task:updated");
      socket.off("task:deleted");
    };
  }, [projectId]);

  const members = useMemo(() => project?.members || [], [project]);
  const taskAssignees = useMemo(() => (
    user.role === "manager" ? members.filter((member) => member.role === "member") : members
  ), [members, user.role]);
  const taskStats = useMemo(() => {
    const now = new Date();
    const todo = tasks.filter((task) => task.status === "todo").length;
    const inProgress = tasks.filter((task) => task.status === "in-progress").length;
    const review = tasks.filter((task) => task.status === "review").length;
    const done = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.filter((task) => task.status !== "done" && task.dueDate && new Date(task.dueDate) < now).length;
    const unassigned = tasks.filter((task) => !task.assignedTo).length;
    const completion = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return { todo, inProgress, review, done, overdue, unassigned, completion };
  }, [tasks]);
  const roleSummary = useMemo(() => roleCopy(user.role, user.name), [user.role, user.name]);

  const addTask = async (payload) => {
    const res = await api.post("/tasks", { ...payload, projectId });
    setTasks((items) => [res.data.task, ...items.filter((item) => item._id !== res.data.task._id)]);
  };

  const addMember = async (memberId) => {
    const res = await api.post(`/projects/${projectId}/members/${memberId}`);
    setProject(res.data.project);
  };

  const removeMember = async (memberId) => {
    const res = await api.delete(`/projects/${projectId}/members/${memberId}`);
    setProject(res.data.project);
  };

  const updateTask = async (taskId, updates) => {
    const res = await api.patch(`/tasks/${taskId}`, updates);
    setTasks((items) => items.map((item) => (item._id === taskId ? res.data.task : item)));
  };

  const runAiReview = async (task) => {
    setAiReviewingId(task._id);
    try {
      const res = await api.post(`/ai/tasks/${task._id}/review`);
      setAiReviewResults((items) => ({ ...items, [task._id]: res.data }));
    } finally {
      setAiReviewingId("");
    }
  };

  const toggleProjectStatus = async () => {
    const nextStatus = project.status === "completed" ? "active" : "completed";
    const res = await api.patch(`/projects/${projectId}`, { status: nextStatus });
    setProject(res.data.project);
  };

  const deleteProject = async () => {
    const confirmed = window.confirm("Delete this project, its tasks, and project chat?");
    if (!confirmed) return;
    await api.delete(`/projects/${projectId}`);
    navigate("/projects");
  };

  if (error) return <section className="page"><div className="error">{error}</div></section>;
  if (!project) return <section className="page">Loading project...</section>;

  return (
    <section className="page project-detail">
      <div className="project-detail-hero">
        <div className="project-detail-copy">
          <span className="project-detail-eyebrow">{project.status || "active"} project</span>
          <h1>{project.name}</h1>
          <p>{project.description || "No description yet."}</p>
          <div className="project-detail-meta">
            <span>{project.category || "project"}</span>
            <span>{project.priority || "medium"} priority</span>
            <span>{project.deliveryMode || "kanban"}</span>
            <span>{project.dueDate ? `Due ${format(new Date(project.dueDate), "MMM d, yyyy")}` : "No deadline"}</span>
            <span>{project.projectManager?.name || "No lead"}</span>
          </div>
        </div>
        <div className="project-health-card">
          <span>Completion</span>
          <strong>{taskStats.completion}%</strong>
          <small>{taskStats.done} of {tasks.length} tasks done</small>
          {canManage && (
            <div className="project-action-stack">
              <button className="success-button" onClick={toggleProjectStatus}>
                {project.status === "completed" ? <RotateCcw size={15} /> : <Flag size={15} />}
                {project.status === "completed" ? "Reopen" : "Finish"}
              </button>
              <button className="danger-button" onClick={deleteProject}>
                <Trash2 size={15} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="project-kpi-row">
        <ProjectKpi icon={<ListTodo size={16} />} label="Todo" value={taskStats.todo} />
        <ProjectKpi icon={<Clock size={16} />} label="In progress" value={taskStats.inProgress} />
        <ProjectKpi icon={<Flag size={16} />} label="Review" value={taskStats.review} danger={taskStats.review > 0} />
        <ProjectKpi icon={<CheckCircle2 size={16} />} label="Done" value={taskStats.done} />
        <ProjectKpi icon={<AlertTriangle size={16} />} label="Overdue" value={taskStats.overdue} danger={taskStats.overdue > 0} />
        <ProjectKpi icon={<Users size={16} />} label="Unassigned" value={taskStats.unassigned} danger={taskStats.unassigned > 0} />
      </div>

      <div className="project-flow-card">
        <div>
          <span>Workspace flow</span>
          <strong>{roleSummary.title}</strong>
          <small>{roleSummary.subtitle}</small>
        </div>
        <div className="project-workflow">
          {roleSummary.points.map((point, index) => (
            <span key={point}><strong>{index + 1}</strong>{point}</span>
          ))}
        </div>
      </div>

      {(project.goals?.length > 0 || project.successCriteria?.length > 0) && (
        <div className="project-brief">
          {project.goals?.length > 0 && (
            <div>
              <h2>Goals</h2>
              {project.goals.slice(0, 4).map((goal) => <p key={goal}>{goal}</p>)}
            </div>
          )}
          {project.successCriteria?.length > 0 && (
            <div>
              <h2>Success criteria</h2>
              {project.successCriteria.slice(0, 4).map((item) => <p key={item}>{item}</p>)}
            </div>
          )}
        </div>
      )}

      <div className="project-work">
        {canManage && project.status !== "completed" && (
          <div className="section-band task-create-section">
            <div className="section-title-row">
              <div>
                <h2>Create task</h2>
                <p>Add one clear work item, assign an owner, then track it on the board.</p>
              </div>
            </div>
            <TaskForm members={taskAssignees} onSubmit={addTask} />
          </div>
        )}
        {canManage && project.status === "completed" && (
          <div className="section-band completed-note">
            <strong>This project is finished.</strong>
            <span>Reopen it from the top control if the team needs to add or move work again.</span>
          </div>
        )}
        <div className="section-band project-board-section">
          <div className="section-title-row">
            <div>
              <h2>Task board</h2>
              <p>Members update their own assigned tasks. Managers see every change in real time.</p>
            </div>
            <span className="board-count"><BarChart3 size={14} /> {tasks.length} tasks</span>
          </div>
          <KanbanBoard
            tasks={tasks}
            onUpdateTask={updateTask}
            onAiReviewTask={canManage ? runAiReview : null}
            aiReviewResults={aiReviewResults}
            aiReviewingId={aiReviewingId}
            canManage={canManage && project.status !== "completed"}
            currentUser={user}
            locked={project.status === "completed"}
          />
        </div>
      </div>

      <ProjectChat projectId={projectId} currentUser={user} />

      <div className="project-support-grid">
        <MemberManager
          members={members}
          users={users}
          currentUser={user}
          canManage={canManage && project.status !== "completed"}
          onAdd={addMember}
          onRemove={removeMember}
        />
        <AiPanel projectId={projectId} onCreateTask={canManage && project.status !== "completed" ? addTask : null} />
        <div className="section-band compact">
          <h2>Activity</h2>
          {logs.length === 0 && <p className="muted">No activity yet.</p>}
          {logs.slice(0, 8).map((log) => (
            <div className="activity-row" key={log._id}>
              <span>{activityLabel(log.action)}</span>
              <small>{format(new Date(log.createdAt), "MMM d, HH:mm")}</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const ProjectKpi = ({ icon, label, value, danger = false }) => (
  <div className={`project-kpi ${danger ? "danger" : ""}`}>
    <span>{icon}</span>
    <div>
      <strong>{value}</strong>
      <small>{label}</small>
    </div>
  </div>
);

const roleCopy = (role, name) => {
  if (role === "manager") {
    return {
      title: "Manager workspace",
      subtitle: name,
      points: ["Plan tasks", "Assign owners", "Review submissions", "Finish project"]
    };
  }
  if (role === "member") {
    return {
      title: "Member workspace",
      subtitle: name,
      points: ["Read context", "Work assigned tasks", "Submit review", "Discuss in chat"]
    };
  }
  return {
    title: "Admin workspace",
    subtitle: name,
    points: ["Review health", "Manage access", "Discuss in chat", "Audit activity"]
  };
};

const activityLabel = (action) => ({
  "project.created": "Project created",
  "project.updated": "Project updated",
  "project.member_added": "Member added",
  "project.member_removed": "Member removed",
  "project.message_created": "Chat message sent",
  "task.created": "Task created",
  "task.updated": "Task updated",
  "ai.task_review": "AI task review",
  "task.deleted": "Task deleted",
  "ai.task_breakdown": "AI breakdown generated",
  "ai.dashboard_chat": "AI assistant used"
}[action] || action);
