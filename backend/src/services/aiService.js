import { openrouter } from "../config/openrouter.js";
import { env } from "../config/env.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Project } from "../models/Project.js";
import { Task } from "../models/Task.js";
import { AppError } from "../utils/AppError.js";
import { assertProjectAccess } from "./projectService.js";
import { activityService } from "./activityService.js";
import { dashboardService } from "./dashboardService.js";

const ensureAiConfigured = () => {
  if (!openrouter) throw new AppError("OpenRouter is not configured. Set OPENROUTER_API_KEY.", 503);
};

const parseJsonContent = (text) => {
  if (!text) throw new AppError("AI returned an empty response", 502);
  try {
    return JSON.parse(text);
  } catch (_error) {
    const match = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (match?.[1]) return JSON.parse(match[1]);
    throw new AppError("AI returned invalid JSON", 502, { raw: text.slice(0, 500) });
  }
};

const createCompletion = async ({ model, instructions, input, schema, name, strictSchema = true }) => {
  const messages = [
    {
      role: "system",
      content: strictSchema
        ? instructions
        : `${instructions}\nReturn only valid JSON matching this schema. Do not include markdown.\n${JSON.stringify(schema)}`
    },
    { role: "user", content: input }
  ];

  const request = {
    model,
    messages,
    temperature: 0.2
  };

  if (strictSchema) {
    request.provider = { require_parameters: true };
    request.response_format = {
      type: "json_schema",
      json_schema: { name, strict: true, schema }
    };
  }

  return openrouter.chat.completions.create(request);
};

const structuredResponse = async ({ instructions, input, schema, name }) => {
  ensureAiConfigured();
  const models = Array.from(new Set([env.openrouterModel, "openrouter/free"]));
  let lastError;

  for (const model of models) {
    try {
      const response = await createCompletion({ model, instructions, input, schema, name, strictSchema: true });
      return parseJsonContent(response.choices?.[0]?.message?.content);
    } catch (error) {
      lastError = error;
    }
  }

  for (const model of models) {
    try {
      const response = await createCompletion({ model, instructions, input, schema, name, strictSchema: false });
      return parseJsonContent(response.choices?.[0]?.message?.content);
    } catch (error) {
      lastError = error;
    }
  }

  throw new AppError("AI provider request failed", lastError?.status || 502, {
    provider: "OpenRouter",
    model: env.openrouterModel,
    reason: lastError?.message
  });
};

const taskSchema = {
  type: "object",
  additionalProperties: false,
  required: ["tasks"],
  properties: {
    tasks: {
      type: "array",
      minItems: 1,
      maxItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["title", "description", "priority", "estimatedHours", "acceptanceCriteria"],
        properties: {
          title: { type: "string" },
          description: { type: "string" },
          priority: { type: "string", enum: ["low", "medium", "high"] },
          estimatedHours: { type: "number" },
          acceptanceCriteria: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
};

const descriptionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["description", "steps", "edgeCases", "acceptanceCriteria"],
  properties: {
    description: { type: "string" },
    steps: { type: "array", items: { type: "string" } },
    edgeCases: { type: "array", items: { type: "string" } },
    acceptanceCriteria: { type: "array", items: { type: "string" } }
  }
};

const assistantSchema = {
  type: "object",
  additionalProperties: false,
  required: ["answer", "recommendedActions", "risks"],
  properties: {
    answer: { type: "string" },
    recommendedActions: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } }
  }
};

const summarySchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "progress", "delays", "risks", "nextSteps"],
  properties: {
    summary: { type: "string" },
    progress: { type: "string" },
    delays: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    nextSteps: { type: "array", items: { type: "string" } }
  }
};

const taskReviewSchema = {
  type: "object",
  additionalProperties: false,
  required: ["recommendation", "confidence", "summary", "checklist", "risks", "suggestedManagerAction"],
  properties: {
    recommendation: { type: "string", enum: ["approve", "changes_requested", "needs_human_review"] },
    confidence: { type: "number", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    checklist: { type: "array", items: { type: "string" } },
    risks: { type: "array", items: { type: "string" } },
    suggestedManagerAction: { type: "string" }
  }
};

const getProjectContext = async (projectId, user) => {
  const project = await assertProjectAccess(projectId, user);
  const tasks = await Task.find({ projectId })
    .select("title description status dueDate assignedTo createdAt completedAt")
    .populate("assignedTo", "name role")
    .sort({ createdAt: -1 })
    .lean();
  const activity = await ActivityLog.find({ projectId })
    .sort({ createdAt: -1 })
    .limit(20)
    .select("action metadata createdAt")
    .lean();

  return { project, tasks, activity };
};

const compactTask = (task) => ({
  title: task.title,
  status: task.status,
  dueDate: task.dueDate,
  project: task.projectId?.name,
  assignedTo: task.assignedTo?.name
});

const compactDashboardContext = (overview) => ({
  role: overview.role,
  totals: {
    users: overview.totalUsers,
    projects: overview.projectCount,
    tasks: overview.totalTasks,
    completed: overview.completedTasks,
    pending: overview.pendingTasks,
    overdue: overview.overdueTasks,
    unassigned: overview.unassignedTasks,
    completionRate: overview.completionRate,
    efficiency: overview.efficiency,
    avgCompletionHours: overview.avgCompletionHours
  },
  statusBreakdown: overview.statusBreakdown,
  projects: overview.projects?.slice(0, 6).map((project) => ({
    name: project.name,
    description: project.description,
    memberCount: project.members?.length || 0
  })),
  riskAlerts: overview.riskAlerts,
  deterministicInsights: overview.aiInsights,
  overdueTasks: overview.overdueList?.slice(0, 6).map(compactTask),
  dueSoon: overview.dueSoon?.slice(0, 6).map(compactTask),
  myTasks: overview.myTasks?.slice(0, 6).map(compactTask),
  visibleTasks: overview.dashboardTasks?.slice(0, 12).map(compactTask),
  workload: overview.workload?.slice(0, 8).map((item) => ({
    user: item.user?.name || "Unassigned",
    active: item.active,
    done: item.done,
    total: item.total,
    overdue: item.overdue,
    completionRate: item.completionRate
  })),
  recentNotifications: overview.notifications?.slice(0, 5).map((item) => ({
    type: item.type,
    message: item.message,
    read: item.read,
    createdAt: item.createdAt
  })),
  recentActivity: overview.recentActivity?.slice(0, 6).map((item) => ({
    action: item.action,
    actor: item.userId?.name,
    project: item.projectId?.name,
    createdAt: item.createdAt
  }))
});

export const aiService = {
  async breakdown({ goal, projectId }, user) {
    const context = projectId ? await getProjectContext(projectId, user) : null;
    const result = await structuredResponse({
      name: "task_breakdown",
      schema: taskSchema,
      instructions:
        "Break a team task into concrete implementation subtasks. Return only useful work items that can be assigned and tracked.",
      input: JSON.stringify({ goal, context })
    });
    if (projectId) {
      await activityService.log({
        action: "ai.task_breakdown",
        entityType: "ai",
        userId: user._id,
        projectId,
        metadata: { goal }
      });
    }
    return result;
  },

  async description({ title, projectId }, user) {
    const context = projectId ? await getProjectContext(projectId, user) : null;
    return structuredResponse({
      name: "task_description",
      schema: descriptionSchema,
      instructions:
        "Generate a practical task description for an engineering team. Include steps, edge cases, and acceptance criteria.",
      input: JSON.stringify({ title, context })
    });
  },

  async suggestions(projectId, user) {
    const context = await getProjectContext(projectId, user);
    return structuredResponse({
      name: "context_suggestions",
      schema: taskSchema,
      instructions:
        "Suggest missing tasks based on the project type, existing tasks, current delays, and common production readiness patterns. Do not duplicate existing tasks.",
      input: JSON.stringify(context)
    });
  },

  async chat({ projectId, question }, user) {
    const context = await getProjectContext(projectId, user);
    return structuredResponse({
      name: "project_assistant",
      schema: assistantSchema,
      instructions:
        "You are a project execution assistant. Reason from project state only. Separate facts from recommendations and prefer deterministic data when available.",
      input: JSON.stringify({ question, context })
    });
  },

  async dashboardChat({ question }, user) {
    const overview = await dashboardService.overview(user);
    const context = compactDashboardContext(overview);
    const result = await structuredResponse({
      name: "dashboard_assistant",
      schema: assistantSchema,
      instructions:
        "You are the WorkOS dashboard AI assistant. Answer for the user's role using only the provided dashboard context. If the user greets you, greet briefly and suggest the most useful next action. Do not invent projects, tasks, users, metrics, or completed actions. If data is missing, say that clearly and recommend the next practical action. Keep the answer concise and decision-focused.",
      input: JSON.stringify({ question, context })
    });

    await activityService.log({
      action: "ai.dashboard_chat",
      entityType: "ai",
      userId: user._id,
      metadata: { question: question.slice(0, 200), role: user.role }
    });

    return result;
  },

  async summary(projectId, user) {
    const context = await getProjectContext(projectId, user);
    return structuredResponse({
      name: "project_summary",
      schema: summarySchema,
      instructions:
        "Summarize project health for a manager. Cover progress, delays, risks, and next steps in concise human language.",
      input: JSON.stringify(context)
    });
  },

  async reviewTask(taskId, user) {
    if (!["admin", "manager"].includes(user.role)) {
      throw new AppError("Only admins and managers can run AI task review", 403);
    }

    const task = await Task.findById(taskId)
      .populate("projectId", "name description goals successCriteria")
      .populate("assignedTo", "name role")
      .lean();
    if (!task) throw new AppError("Task not found", 404);
    await assertProjectAccess(task.projectId._id, user);

    const result = await structuredResponse({
      name: "task_review",
      schema: taskReviewSchema,
      instructions:
        "Review a submitted task for a manager. Use only the provided project and task context. If evidence is missing, do not claim it is complete. Recommend approve only when the task description and acceptance signals are clear enough; otherwise request changes or human review.",
      input: JSON.stringify({ task, project: task.projectId })
    });

    await activityService.log({
      action: "ai.task_review",
      entityType: "ai",
      userId: user._id,
      projectId: task.projectId._id,
      entityId: task._id,
      metadata: { recommendation: result.recommendation, confidence: result.confidence }
    });

    return result;
  }
};
