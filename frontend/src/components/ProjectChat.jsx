import { format } from "date-fns";
import { MessageSquare, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";

export const ProjectChat = ({ projectId, currentUser }) => {
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/projects/${projectId}/messages`)
      .then((res) => setMessages(res.data.messages))
      .catch(() => {});

    const socket = getSocket();
    socket.connect();
    const onMessage = (message) => {
      setMessages((items) => (
        items.some((item) => item._id === message._id) ? items : [...items, message]
      ));
    };
    socket.on("chat:message", onMessage);
    return () => socket.off("chat:message", onMessage);
  }, [projectId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const send = async (event) => {
    event.preventDefault();
    const message = draft.trim();
    if (!message) return;
    setSending(true);
    try {
      const res = await api.post(`/projects/${projectId}/messages`, { message });
      setMessages((items) => (
        items.some((item) => item._id === res.data.message._id) ? items : [...items, res.data.message]
      ));
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="section-band project-chat">
      <div className="section-title-row">
        <div>
          <h2><MessageSquare size={18} /> Team chat</h2>
          <p>Project discussion between manager and members.</p>
        </div>
      </div>
      <div className="project-chat-list">
        {messages.length === 0 && <p className="muted">No messages yet. Start the project discussion here.</p>}
        {messages.map((message) => {
          const mine = String(message.sender?._id) === String(currentUser?._id);
          return (
            <article className={`project-chat-message ${mine ? "mine" : ""}`} key={message._id}>
              <div className="project-chat-avatar">{message.sender?.name?.[0] || "?"}</div>
              <div>
                <div className="project-chat-meta">
                  <strong>{mine ? "You" : message.sender?.name || "User"}</strong>
                  <span>{message.sender?.role || "member"}</span>
                  <small>{format(new Date(message.createdAt), "MMM d, HH:mm")}</small>
                </div>
                <p>{message.message}</p>
              </div>
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form className="project-chat-form" onSubmit={send}>
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Message your project team"
          maxLength={1000}
        />
        <button className="primary-button" disabled={sending || !draft.trim()}>
          <Send size={16} /> Send
        </button>
      </form>
    </section>
  );
};
