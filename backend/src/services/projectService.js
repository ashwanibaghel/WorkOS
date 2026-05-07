import { Project } from "../models/Project.js";
import { ProjectMessage } from "../models/ProjectMessage.js";
import { Task } from "../models/Task.js";
import { User } from "../models/User.js";
import { AppError } from "../utils/AppError.js";
import { activityService } from "./activityService.js";

const projectQueryFor = (user) => {
  if (user.role === "admin") return {};
  return { $or: [{ createdBy: user._id }, { members: user._id }] };
};

const uniqueIds = (ids) => Array.from(new Set(ids.filter(Boolean).map((id) => String(id))));

const usersById = async (ids) => {
  const normalized = uniqueIds(ids);
  if (!normalized.length) return new Map();

  const users = await User.find({ _id: { $in: normalized } }).select("_id role").lean();
  if (users.length !== normalized.length) {
    throw new AppError("One or more selected users do not exist", 400);
  }

  return new Map(users.map((item) => [String(item._id), item]));
};

const assertAdminLead = async (projectManager) => {
  if (!projectManager) return;
  const lead = await User.findById(projectManager).select("role").lean();
  if (!lead) throw new AppError("Selected project lead does not exist", 400);
  if (!["admin", "manager"].includes(lead.role)) {
    throw new AppError("Project lead must be an admin or manager", 400);
  }
};

const assertManagerMemberScope = async (memberIds, user, { allowActor = false } = {}) => {
  if (user.role !== "manager") return;
  const idsToCheck = uniqueIds(memberIds).filter((id) => !allowActor || id !== String(user._id));
  if (!idsToCheck.length) return;

  const selectedUsers = await usersById(idsToCheck);
  const hasElevatedUser = [...selectedUsers.values()].some((item) => item.role !== "member");
  if (hasElevatedUser) {
    throw new AppError("Managers can only assign member users to projects", 403);
  }
};

const assertProjectOpenForTeam = (project) => {
  if (project.status === "completed") {
    throw new AppError("Reopen the project before changing team members", 400);
  }
};

const buildCreatePayload = async (data, user) => {
  const payload = { ...data };

  if (user.role === "manager") {
    if (data.projectManager && String(data.projectManager) !== String(user._id)) {
      throw new AppError("Only admins can assign another project lead", 403);
    }
    payload.projectManager = user._id;
  } else {
    await assertAdminLead(data.projectManager);
  }

  await assertManagerMemberScope(data.members || [], user);
  payload.members = uniqueIds([
    user._id,
    payload.projectManager,
    ...(data.members || [])
  ]);

  return payload;
};

const buildUpdatePayload = async (project, data, user) => {
  const payload = { ...data };

  if (Object.prototype.hasOwnProperty.call(data, "projectManager")) {
    if (user.role === "manager") {
      throw new AppError("Only admins can change the project lead", 403);
    }
    await assertAdminLead(data.projectManager);
  }

  if (Object.prototype.hasOwnProperty.call(data, "members")) {
    await assertManagerMemberScope(data.members || [], user, { allowActor: true });
    const nextLead = Object.prototype.hasOwnProperty.call(payload, "projectManager")
      ? payload.projectManager
      : project.projectManager;
    payload.members = uniqueIds([
      project.createdBy,
      nextLead,
      ...(data.members || [])
    ]);
  }

  return payload;
};

export const projectService = {
  async create(data, user) {
    const payload = await buildCreatePayload(data, user);
    const project = await Project.create({
      ...payload,
      createdBy: user._id
    });
    await activityService.log({
      action: "project.created",
      entityType: "project",
      entityId: project._id,
      userId: user._id,
      projectId: project._id,
      metadata: {
        category: project.category,
        priority: project.priority,
        deliveryMode: project.deliveryMode,
        dueDate: project.dueDate
      }
    });
    return project.populate("createdBy members projectManager", "name email role");
  },

  async list(user) {
    return Project.find(projectQueryFor(user))
      .sort({ updatedAt: -1 })
      .populate("createdBy members projectManager", "name email role")
      .lean();
  },

  async get(projectId, user) {
    const project = await Project.findOne({ _id: projectId, ...projectQueryFor(user) })
      .populate("createdBy members projectManager", "name email role");
    if (!project) throw new AppError("Project not found", 404);
    return project;
  },

  async update(projectId, data, user) {
    const existing = await Project.findOne({ _id: projectId, ...projectQueryFor(user) });
    if (!existing) throw new AppError("Project not found", 404);

    const payload = await buildUpdatePayload(existing, data, user);
    const project = await Project.findOneAndUpdate(
      { _id: projectId, ...projectQueryFor(user) },
      payload,
      { new: true, runValidators: true }
    ).populate("createdBy members projectManager", "name email role");

    if (!project) throw new AppError("Project not found", 404);
    await activityService.log({
      action: "project.updated",
      entityType: "project",
      entityId: project._id,
      userId: user._id,
      projectId: project._id,
      metadata: payload
    });
    return project;
  },

  async remove(projectId, user) {
    const project = await Project.findOneAndDelete({ _id: projectId, ...projectQueryFor(user) });
    if (!project) throw new AppError("Project not found", 404);
    await Task.deleteMany({ projectId });
    await ProjectMessage.deleteMany({ projectId });
    await activityService.log({
      action: "project.deleted",
      entityType: "project",
      entityId: project._id,
      userId: user._id,
      projectId: project._id
    });
    return project;
  },

  async addMember(projectId, memberId, user) {
    await assertManagerMemberScope([memberId], user);
    const existing = await Project.findOne({ _id: projectId, ...projectQueryFor(user) });
    if (!existing) throw new AppError("Project not found", 404);
    assertProjectOpenForTeam(existing);
    const project = await Project.findOneAndUpdate(
      { _id: projectId, ...projectQueryFor(user) },
      { $addToSet: { members: memberId } },
      { new: true }
    ).populate("createdBy members projectManager", "name email role");
    if (!project) throw new AppError("Project not found", 404);
    await activityService.log({
      action: "project.member_added",
      entityType: "project",
      entityId: project._id,
      userId: user._id,
      projectId: project._id,
      metadata: { memberId }
    });
    return project;
  },

  async removeMember(projectId, memberId, user) {
    await assertManagerMemberScope([memberId], user);
    const existing = await Project.findOne({ _id: projectId, ...projectQueryFor(user) });
    if (!existing) throw new AppError("Project not found", 404);
    assertProjectOpenForTeam(existing);
    const project = await Project.findOneAndUpdate(
      { _id: projectId, ...projectQueryFor(user) },
      { $pull: { members: memberId } },
      { new: true }
    ).populate("createdBy members projectManager", "name email role");
    if (!project) throw new AppError("Project not found", 404);
    await activityService.log({
      action: "project.member_removed",
      entityType: "project",
      entityId: project._id,
      userId: user._id,
      projectId: project._id,
      metadata: { memberId }
    });
    return project;
  }
};

export const assertProjectAccess = async (projectId, user) => projectService.get(projectId, user);
