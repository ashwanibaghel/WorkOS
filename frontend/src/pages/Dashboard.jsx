import { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { AdminDashboard } from "../components/dashboard/AdminDashboard.jsx";
import { ManagerDashboard } from "../components/dashboard/ManagerDashboard.jsx";
import { MemberDashboard } from "../components/dashboard/MemberDashboard.jsx";
import { useAuth } from "../state/AuthContext.jsx";

export const Dashboard = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/dashboard")
      .then((res) => setOverview(res.data.overview))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <section className="page"><div className="error">{error}</div></section>;
  if (!overview) return <section className="page">Loading dashboard...</section>;

  if (user.role === "admin") return <AdminDashboard user={user} overview={overview} />;
  if (user.role === "manager") return <ManagerDashboard user={user} overview={overview} />;
  return <MemberDashboard user={user} overview={overview} />;
};
