import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    description: { type: String, trim: true, maxlength: 2000 },
    category: {
      type: String,
      enum: ["engineering", "product", "design", "marketing", "operations", "research", "client", "other"],
      default: "engineering"
    },
    priority: { type: String, enum: ["low", "medium", "high", "critical"], default: "medium" },
    status: { type: String, enum: ["planning", "active", "on-hold", "completed"], default: "planning" },
    deliveryMode: { type: String, enum: ["kanban", "sprint", "milestone"], default: "kanban" },
    projectManager: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    startDate: { type: Date },
    dueDate: { type: Date },
    goals: [{ type: String, trim: true, maxlength: 240 }],
    successCriteria: [{ type: String, trim: true, maxlength: 240 }],
    tags: [{ type: String, trim: true, maxlength: 40 }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
  },
  { timestamps: true }
);

projectSchema.index({ name: "text", description: "text" });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ members: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ status: 1, priority: 1, dueDate: 1 });

export const Project = mongoose.model("Project", projectSchema);
