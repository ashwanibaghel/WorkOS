import { Bot, FileText, ListPlus, MessageSquare, Wand2 } from "lucide-react";
import { useState } from "react";
import { api } from "../api/client.js";

export const AiPanel = ({ projectId, onCreateTask }) => {
  const [goal, setGoal] = useState("");
  const [question, setQuestion] = useState("What should I do next?");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState("");

  const run = async (type) => {
    setLoading(type);
    try {
      const calls = {
        breakdown: () => api.post("/ai/breakdown", { goal, projectId }),
        suggestions: () => api.get(`/ai/projects/${projectId}/suggestions`),
        summary: () => api.get(`/ai/projects/${projectId}/summary`),
        chat: () => api.post(`/ai/projects/${projectId}/chat`, { question })
      };
      const res = await calls[type]();
      setResult({ type, data: res.data });
    } finally {
      setLoading("");
    }
  };

  const createSuggestedTask = async (task) => {
    if (!onCreateTask) return;
    await onCreateTask({ title: task.title, description: task.description, assignedTo: null, dueDate: null });
  };

  return (
    <div className="ai-panel">
      <div className="ai-panel-heading">
        <h2><Bot size={18} /> AI Assistant</h2>
        <p>Use it for planning help, not normal task updates.</p>
      </div>
      <textarea placeholder="Describe a big goal to break into tasks" value={goal} onChange={(e) => setGoal(e.target.value)} />
      <div className="button-row">
        <button className="ghost-button" onClick={() => run("breakdown")} disabled={!goal || loading}>
          <Wand2 size={16} /> Breakdown
        </button>
        <button className="ghost-button" onClick={() => run("suggestions")} disabled={loading}>
          <ListPlus size={16} /> Suggest
        </button>
        <button className="ghost-button" onClick={() => run("summary")} disabled={loading}>
          <FileText size={16} /> Summary
        </button>
      </div>
      <div className="chat-row">
        <input value={question} onChange={(e) => setQuestion(e.target.value)} />
        <button className="icon-button" onClick={() => run("chat")} disabled={loading} title="Ask assistant">
          <MessageSquare size={16} />
        </button>
      </div>
      {loading && <div className="muted">Thinking...</div>}
      {result && (
        <div className="ai-result">
          <div className="ai-result-title">{resultTitle(result.type)}</div>
          {result.data.tasks?.map((task, index) => (
            <div className="ai-task" key={`${task.title}-${index}`}>
              <strong>{task.title}</strong>
              <p>{task.description}</p>
              {onCreateTask && <button className="ghost-button" onClick={() => createSuggestedTask(task)}>Create task</button>}
            </div>
          ))}
          {result.data.answer && (
            <>
              <p>{result.data.answer}</p>
              <List title="Actions" items={result.data.recommendedActions} />
              <List title="Risks" items={result.data.risks} />
            </>
          )}
          {result.data.summary && (
            <>
              <p>{result.data.summary}</p>
              <p><strong>Progress:</strong> {result.data.progress}</p>
              <List title="Delays" items={result.data.delays} />
              <List title="Risks" items={result.data.risks} />
              <List title="Next steps" items={result.data.nextSteps} />
            </>
          )}
        </div>
      )}
    </div>
  );
};

const resultTitle = (type) => ({
  breakdown: "Task ideas",
  suggestions: "Suggested missing work",
  summary: "Project summary",
  chat: "Assistant answer"
}[type] || "Result");

const List = ({ title, items = [] }) => (
  <div>
    <strong>{title}</strong>
    <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
  </div>
);
