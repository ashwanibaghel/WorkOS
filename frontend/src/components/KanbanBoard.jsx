import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd";
import { formatDistanceToNow } from "date-fns";

const columns = [
  { id: "todo", title: "Todo" },
  { id: "in-progress", title: "In Progress" },
  { id: "done", title: "Done" }
];

const previewDescription = (description = "") => {
  const [firstBlock] = description.split(/\n\s*\n/);
  return firstBlock || "No description";
};

const sameId = (left, right) => String(left || "") === String(right || "");

export const KanbanBoard = ({ tasks, onUpdateTask, canManage = false, currentUser }) => {
  const canMoveTask = (task) => {
    if (canManage) return true;
    return sameId(task.assignedTo?._id, currentUser?._id);
  };

  const onDragEnd = ({ destination, draggableId }) => {
    if (!destination) return;
    const task = tasks.find((item) => item._id === draggableId);
    if (!task || !canMoveTask(task)) return;
    onUpdateTask(draggableId, { status: destination.droppableId });
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
