import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";
import { CheckCircle2, PlayCircle, RotateCcw, Sparkles } from "lucide-react";

const columns = [
  { id: "todo", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "review", title: "Review" },
  { id: "done", title: "Done" }
];

const previewDescription = (description = "") => {
  const [firstBlock] = description.split(/\n\s*\n/);
  return firstBlock || "No description";
};

const sameId = (left, right) => String(left || "") === String(right || "");

export const KanbanBoard = ({
  tasks,
  onUpdateTask,
  onAiReviewTask,
  aiReviewResults = {},
  aiReviewingId = "",
  canManage = false,
  currentUser,
  locked = false
}) => {
  const isManager = ["admin", "manager"].includes(currentUser?.role);

  const allowedStatusTargets = (task) => {
    if (locked) return [];
    if (isManager) {
      if (task.status === "todo") return ["in-progress"];
      if (task.status === "in-progress") return ["review", "done"];
      if (task.status === "review") return ["done", "in-progress"];
      if (task.status === "done") return ["in-progress"];
      return [];
    }
    if (!sameId(task.assignedTo?._id, currentUser?._id)) return [];
    if (task.status === "todo") return ["in-progress"];
    if (task.status === "in-progress") return ["review"];
    return [];
  };

  const canMoveTask = (task) => {
    if (canManage) return !locked;
    return allowedStatusTargets(task).length > 0;
  };

  const onDragEnd = ({ destination, draggableId }) => {
    if (!destination) return;
    const task = tasks.find((item) => item._id === draggableId);
    if (!task || !canMoveTask(task)) return;
    if (!allowedStatusTargets(task).includes(destination.droppableId)) return;
    onUpdateTask(draggableId, { status: destination.droppableId });
  };

  const statusActionsFor = (task) => {
    const targets = allowedStatusTargets(task);
    const actionMap = {
      "in-progress": { status: "in-progress", label: task.status === "done" || task.status === "review" ? "Reopen" : "Start", icon: task.status === "todo" ? <PlayCircle size={14} /> : <RotateCcw size={14} /> },
      "review": { status: "review", label: "Send review", icon: <Sparkles size={14} /> },
      "done": { status: "done", label: task.status === "review" ? "Approve" : "Mark done", icon: <CheckCircle2 size={14} /> }
    };
    return targets.map((status) => actionMap[status]).filter(Boolean);
  };

  const updateStatus = (event, taskId, status) => {
    event.preventDefault();
    event.stopPropagation();
    onUpdateTask(taskId, { status });
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="kanban">
        {columns.map((column) => {
          const columnTasks = tasks.filter((task) => task.status === column.id);
          return (
            <Droppable droppableId={column.id} key={column.id}>
              {(provided) => (
                <div className="kanban-column" ref={provided.innerRef} {...provided.droppableProps}>
                  <div className="column-header">
                    <h2>{column.title}</h2>
                    <span>{columnTasks.length}</span>
                  </div>
                  {columnTasks.map((task, index) => (
                    <Draggable draggableId={task._id} index={index} key={task._id} isDragDisabled={!canMoveTask(task)}>
                      {(drag) => (
                        <article
                          className={`task-card ${canMoveTask(task) ? "" : "task-card-locked"}`}
                          ref={drag.innerRef}
                          {...drag.draggableProps}
                          {...drag.dragHandleProps}
                        >
                          <h3>{task.title}</h3>
                          <p>{previewDescription(task.description)}</p>
                          <div className="task-meta">
                            <span>{task.assignedTo?.name || "Unassigned"}</span>
                            {task.dueDate && <span>Due {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}</span>}
                          </div>
                          {task.status === "review" && (
                            <div className="review-badge">
                              {isManager ? "Waiting for manager approval" : "Submitted for review"}
                            </div>
                          )}
                          {task.status === "review" && isManager && onAiReviewTask && (
                            <button
                              type="button"
                              className="ai-review-button"
                              onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onAiReviewTask(task);
                              }}
                              onPointerDown={(event) => event.stopPropagation()}
                              disabled={aiReviewingId === task._id}
                            >
                              <Sparkles size={14} />
                              {aiReviewingId === task._id ? "Reviewing..." : "AI review"}
                            </button>
                          )}
                          {aiReviewResults[task._id] && (
                            <div className={`ai-review-result recommendation-${aiReviewResults[task._id].recommendation}`}>
                              <strong>{aiReviewLabel(aiReviewResults[task._id].recommendation)}</strong>
                              <p>{aiReviewResults[task._id].summary}</p>
                            </div>
                          )}
                          {(() => {
                            const actions = statusActionsFor(task);
                            return actions.length > 0 && (
                            <div className="task-status-actions">
                              {actions.map((action) => (
                                <button
                                  key={action.status}
                                  type="button"
                                  onClick={(event) => updateStatus(event, task._id, action.status)}
                                  onPointerDown={(event) => event.stopPropagation()}
                                >
                                  {action.icon}
                                  {action.label}
                                </button>
                              ))}
                            </div>
                            );
                          })()}
                        </article>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
};

const aiReviewLabel = (recommendation) => ({
  approve: "AI says: approve",
  changes_requested: "AI says: changes needed",
  needs_human_review: "AI says: review manually"
}[recommendation] || "AI review");
