import { UserMinus, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

export const MemberManager = ({ members, users, currentUser, canManage, onAdd, onRemove }) => {
  const [selected, setSelected] = useState("");
  const memberIds = useMemo(() => new Set(members.map((member) => member._id)), [members]);
  const available = users
    .filter((user) => !memberIds.has(user._id))
    .filter((user) => (currentUser?.role === "manager" ? user.role === "member" : user.role !== "admin"));

  const add = async () => {
    if (!selected) return;
    await onAdd(selected);
    setSelected("");
  };

  return (
    <div className="section-band compact">
      <h2>Team</h2>
      <div className="member-list">
        {members.length === 0 && <p className="muted">No project members yet.</p>}
        {members.map((member) => (
          <div className="member-row" key={member._id}>
            <span>{member.name}<small>{member.role}</small></span>
            {canManage && (currentUser?.role !== "manager" || member.role === "member") && (
              <button className="icon-button" title="Remove member" onClick={() => onRemove(member._id)}>
                <UserMinus size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
      {canManage && (
        <div className="member-add">
          <select value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Add member</option>
            {available.map((user) => <option key={user._id} value={user._id}>{user.name} - {user.role}</option>)}
          </select>
          <button className="icon-button" title="Add member" onClick={add}>
            <UserPlus size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
