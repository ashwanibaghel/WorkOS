import { Loader2, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

export const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const ran = useRef(false);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("Verifying your email...");

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("Verification token is missing.");
      return;
    }

    verifyEmail(token)
      .then(() => navigate("/dashboard", { replace: true }))
      .catch((err) => {
        setStatus("error");
        setMessage(err.message);
      });
  }, [navigate, searchParams, verifyEmail]);

  return (
    <div className="auth-screen">
      <div className="auth-card verify-card">
        <Link className="auth-logo" to="/">
          <div className="brand-mark">W</div>
          <span>WorkOS</span>
        </Link>
        <div className={`verify-icon verify-icon--${status}`}>
          {status === "loading" && <Loader2 size={24} />}
          {status === "error" && <XCircle size={24} />}
        </div>
        <div className="auth-card-heading">
          <p className="eyebrow">Email verification</p>
          <h2>{status === "error" ? "Verification failed" : "Checking link"}</h2>
          <p>{message}</p>
        </div>
        {status === "error" && <Link className="primary-button auth-submit" to="/login">Back to login</Link>}
      </div>
    </div>
  );
};
