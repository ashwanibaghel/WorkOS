import { z } from "zod";

const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid MongoDB ObjectId");
const status = z.enum(["todo", "in-progress", "done"]);
const projectCategory = z.enum(["engineering", "product", "design", "marketing", "operations", "research", "client", "other"]);
const projectPriority = z.enum(["low", "medium", "high", "critical"]);
const projectStatus = z.enum(["planning", "active", "on-hold", "completed"]);
const deliveryMode = z.enum(["kanban", "sprint", "milestone"]);
const shortTextArray = z.array(z.string().trim().min(1).max(240)).max(8);
const tagArray = z.array(z.string().trim().min(1).max(40)).max(8);
const strongPassword = z.string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must include one uppercase letter")
  .regex(/[0-9]/, "Password must include one number")
  .regex(/[^A-Za-z0-9]/, "Password must include one special character");

export const authSchemas = {
  signup: z.object({
    body: z.object({
      name: z.string().min(2).max(80),
      email: z.string().email(),
      password: strongPassword,
      passwordConfirm: z.string().min(1)
    }).refine((data) => data.password === data.passwordConfirm, {
      message: "Password confirmation does not match",
      path: ["passwordConfirm"]
    })
  }),
  login: z.object({
    body: z.object({
      email: z.string().email(),
      password: z.string().min(1)
    })
  }),
  verifyEmail: z.object({
    params: z.object({ token: z.string().min(32).max(200) })
  }),
  resendVerification: z.object({
    body: z.object({ email: z.string().email() })
  }),
  google: z.object({
    body: z.object({
      credential: z.string().min(20)
    })
  })
};

export const projectSchemas = {
  id: z.object({ params: z.object({ projectId: objectId }) }),
  create: z.object({
    body: z.object({
      name: z.string().min(2).max(120),
      description: z.string().max(2000).optional().default(""),
      category: projectCategory.optional().default("engineering"),
      priority: projectPriority.optional().default("medium"),
      status: projectStatus.optional().default("planning"),
      deliveryMode: deliveryMode.optional().default("kanban"),
      projectManager: objectId.optional().nullable(),
      startDate: z.coerce.date().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      goals: shortTextArray.optional().default([]),
      successCriteria: shortTextArray.optional().default([]),
      tags: tagArray.optional().default([]),
      members: z.array(objectId).optional().default([])
    })
  }),
  update: z.object({
    params: z.object({ projectId: objectId }),
    body: z.object({
      name: z.string().min(2).max(120).optional(),
      description: z.string().max(2000).optional(),
      category: projectCategory.optional(),
      priority: projectPriority.optional(),
      status: projectStatus.optional(),
      deliveryMode: deliveryMode.optional(),
      projectManager: objectId.optional().nullable(),
      startDate: z.coerce.date().optional().nullable(),
      dueDate: z.coerce.date().optional().nullable(),
      goals: shortTextArray.optional(),
      successCriteria: shortTextArray.optional(),
      tags: tagArray.optional(),
      members: z.array(objectId).optional()
    })
  }),
  member: z.object({
    params: z.object({ projectId: objectId, memberId: objectId })
  }),
  message: z.object({
    params: z.object({ projectId: objectId }),
    body: z.object({ message: z.string().trim().min(1).max(1000) })
  })
};

export const taskSchemas = {
  list: z.object({ params: z.object({ projectId: objectId }) }),
  create: z.object({
    body: z.object({
      title: z.string().min(2).max(160),
      description: z.string().max(8000).optional().default(""),
      projectId: objectId,
      assignedTo: objectId.optional().nullable(),
      status: status.optional().default("todo"),
      dueDate: z.coerce.date().optional().nullable()
    })
  }),
  update: z.object({
    params: z.object({ taskId: objectId }),
    body: z.object({
      title: z.string().min(2).max(160).optional(),
      description: z.string().max(8000).optional(),
      assignedTo: objectId.optional().nullable(),
      status: status.optional(),
      dueDate: z.coerce.date().optional().nullable()
    })
  }),
  remove: z.object({ params: z.object({ taskId: objectId }) })
};

export const aiSchemas = {
  breakdown: z.object({
    body: z.object({
      goal: z.string().min(3).max(600),
      projectId: objectId.optional()
    })
  }),
  description: z.object({
    body: z.object({
      title: z.string().min(3).max(160),
      projectId: objectId.optional()
    })
  }),
  projectId: z.object({ params: z.object({ projectId: objectId }) }),
  chat: z.object({
    params: z.object({ projectId: objectId }),
    body: z.object({ question: z.string().min(3).max(1000) })
  }),
  dashboardChat: z.object({
    body: z.object({ question: z.string().min(1).max(1000) })
  })
};

export const notificationSchemas = {
  markRead: z.object({ params: z.object({ notificationId: objectId }) })
};

export const userSchemas = {
  updateRole: z.object({
    params: z.object({ userId: objectId }),
    body: z.object({ role: z.enum(["admin", "manager", "member"]) })
  })
};
