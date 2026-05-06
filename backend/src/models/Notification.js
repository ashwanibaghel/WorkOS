import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    type: { type: String, enum: ["assignment", "overdue", "status", "system"], required: true },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ taskId: 1, type: 1 });

export const Notification = mongoose.model("Notification", notificationSchema);
