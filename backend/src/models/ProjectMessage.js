import mongoose from "mongoose";

const projectMessageSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true, minlength: 1, maxlength: 1000 }
  },
  { timestamps: true }
);

projectMessageSchema.index({ projectId: 1, createdAt: 1 });
projectMessageSchema.index({ sender: 1, createdAt: -1 });

export const ProjectMessage = mongoose.model("ProjectMessage", projectMessageSchema);
