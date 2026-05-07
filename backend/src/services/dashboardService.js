import { Task } from "../models/Task.js";
import { Project } from "../models/Project.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

const accessibleProjects = async (user) => {
  if (user.role === "admin") {
    return Project.find()
      .sort({ updatedAt: -1 })
      .select("_id name description category priority status deliveryMode projectManager dueDate members createdBy updatedAt")
      .lean();
  }
  return Project.find({ $or: [{ createdBy: user._id }, { members: user._id }] })
    .sort({ updatedAt: -1 })
    .select("_id name description category priority status deliveryMode projectManager dueDate members createdBy updatedAt")
    .lean();
};

export const dashboardService = {
  async overview(user) {
    const projects = await accessibleProjects(user);
    const projectIds = projects.map((project) => project._id);
    const scope = { projectId: { $in: projectIds } };
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const [
      totalTasks,
      completedTasks,
      overdueTasks,
      unassignedTasks,
      statusCounts,
      workload,
      completionTimes,
      overdueList,
      dueSoon,
      myTasks,
      dashboardTasks,
      recentActivity,
      notifications,
      totalUsers
    ] = await Promise.all([
      Task.countDocuments(scope),
      Task.countDocuments({ ...scope, status: "done" }),
      Task.countDocuments({ ...scope, status: { $ne: "done" }, dueDate: { $lt: now } }),
      Task.countDocuments({ ...scope, status: { $ne: "done" }, assignedTo: null }),
      Task.aggregate([{ $match: scope }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([
        { $match: scope },
        {
          $group: {
            _id: "$assignedTo",
            total: { $sum: 1 },
            done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  { $and: [{ $ne: ["$status", "done"] }, { $lt: ["$dueDate", now] }] },
                  1,
                  0
                ]
              }
            }
          }
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        {
          $project: {
            total: 1,
            done: 1,
            active: { $subtract: ["$total", "$done"] },
            overdue: 1,
            completionRate: {
              $cond: [{ $eq: ["$total", 0] }, 0, { $round: [{ $multiply: [{ $divide: ["$done", "$total"] }, 100] }, 0] }]
            },
            user: { _id: "$user._id", name: "$user.name", email: "$user.email" }
          }
        },
        { $sort: { active: -1, overdue: -1 } }
      ]),
      Task.aggregate([
        { $match: { ...scope, completedAt: { $ne: null } } },
        { $project: { hours: { $divide: [{ $subtract: ["$completedAt", "$createdAt"] }, 1000 * 60 * 60] } } },
        { $group: { _id: null, avgHours: { $avg: "$hours" } } }
      ]),
      Task.find({ ...scope, status: { $ne: "done" }, dueDate: { $lt: now } })
        .sort({ dueDate: 1 })
        .limit(8)
        .select("title status dueDate assignedTo projectId")
        .populate("assignedTo", "name email role")
        .populate("projectId", "name")
        .lean(),
      Task.find({ ...scope, status: { $ne: "done" }, dueDate: { $gte: now, $lte: nextWeek } })
        .sort({ dueDate: 1 })
        .limit(8)
        .select("title status dueDate assignedTo projectId")
        .populate("assignedTo", "name email role")
        .populate("projectId", "name")
        .lean(),
      Task.find({ ...scope, assignedTo: user._id, status: { $nin: ["done", "review"] } })
        .sort({ dueDate: 1, updatedAt: -1 })
        .limit(8)
        .select("title description status dueDate projectId assignedTo")
        .populate("assignedTo", "name email role")
        .populate("projectId", "name")
        .lean(),
      Task.find(scope)
        .sort({ updatedAt: -1 })
        .limit(36)
        .select("title description status dueDate projectId assignedTo")
        .populate("assignedTo", "name email role")
        .populate("projectId", "name")
        .lean(),
      ActivityLog.find({ projectId: { $in: projectIds } })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("action entityType userId projectId metadata createdAt")
        .populate("userId", "name email role")
        .populate("projectId", "name")
        .lean(),
      Notification.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("type message read projectId taskId createdAt")
        .populate("projectId", "name")
        .lean(),
      User.countDocuments()
    ]);

    const statusBreakdown = { todo: 0, "in-progress": 0, review: 0, done: 0 };
    for (const item of statusCounts) statusBreakdown[item._id] = item.count;

    const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const efficiency = Math.max(0, Math.min(100, Math.round(completionRate - overdueTasks * 4 + (totalTasks ? 8 : 0))));
    const riskAlerts = [
      overdueTasks > 0 ? { level: "high", title: "Overdue delivery risk", message: `${overdueTasks} tasks are past due and need attention.` } : null,
      unassignedTasks > 0 ? { level: "medium", title: "Ownership gap", message: `${unassignedTasks} active tasks are unassigned.` } : null,
      completionRate < 50 && totalTasks > 0 ? { level: "medium", title: "Low completion rate", message: `Completion rate is ${completionRate}%. Review blockers and workload.` } : null
    ].filter(Boolean);
    const aiInsights = buildInsights({ user, overdueTasks, unassignedTasks, completionRate, workload, myTasks, dueSoon });
    const performanceSeries = [
      { label: "Todo", value: statusBreakdown.todo, color: "#b7791f" },
      { label: "In Progress", value: statusBreakdown["in-progress"], color: "#1d7a8c" },
      { label: "Review", value: statusBreakdown.review, color: "#7c3aed" },
      { label: "Done", value: statusBreakdown.done, color: "#27825f" }
    ];

    return {
      role: user.role,
      totalUsers,
      projectCount: projects.length,
      projects: projects.slice(0, 6),
      totalTasks,
      completedTasks,
      pendingTasks: totalTasks - completedTasks,
      overdueTasks,
      unassignedTasks,
      statusBreakdown,
      completionRate,
      efficiency,
      avgCompletionHours: Math.round((completionTimes[0]?.avgHours || 0) * 10) / 10,
      workload,
      overdueList,
      dueSoon,
      myTasks,
      dashboardTasks,
      recentActivity,
      notifications,
      riskAlerts,
      aiInsights,
      performanceSeries
    };
  }
};

const buildInsights = ({ user, overdueTasks, unassignedTasks, completionRate, workload, myTasks, dueSoon }) => {
  if (user.role === "admin") {
    return [
      overdueTasks ? `Escalate ${overdueTasks} overdue tasks before they affect delivery commitments.` : "No overdue work detected across the visible workspace.",
      unassignedTasks ? `Assign owners to ${unassignedTasks} unassigned tasks to close accountability gaps.` : "Task ownership looks healthy.",
      workload.length ? "Review workload concentration and rebalance active work from overloaded assignees." : "Create projects and assign teams to activate workload analytics."
    ];
  }

  if (user.role === "manager") {
    return [
      dueSoon?.length ? `${dueSoon.length} tasks are due this week. Confirm owners and blockers today.` : "No near-term deadline pressure detected.",
      workload.some((item) => item.overdue > 0) ? "Reassign overdue work from overloaded team members." : "No reassignment pressure detected from overdue workload.",
      completionRate < 70 ? "Use AI task breakdown for large pending tasks to improve flow." : "Delivery flow is healthy. Keep the current review cadence."
    ];
  }

  return [
    myTasks?.[0] ? `Next best task: ${myTasks[0].title}. Start here based on due date and status.` : "No assigned active task. Check projects or ask your manager for the next priority.",
    overdueTasks ? "Review overdue alerts first, then move one task to In Progress." : "No overdue work in your visible queue.",
    "Use focus mode: complete one active task before pulling new work."
  ];
};
