import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, Eye, EyeOff, XCircle, Zap, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";
import "../landing-styles.css";

const demoAdminCredentials = {
  email: "demo.admin@workos.com",
  password: "Demo@12345"
};

const passwordRules = [
  { label: "Minimum 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One number", test: (value) => /[0-9]/.test(value) },
  { label: "One special character", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

export const Login = ({ mode }) => {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const isStrongPassword = passwordRules.every((rule) => rule.test(form.password));
  const passwordsMatch = !isSignup || (form.passwordConfirm && form.password === form.passwordConfirm);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (isSignup && (!isStrongPassword || !passwordsMatch)) {
      setError("Please complete all password requirements before creating an account.");
      return;
    }
    try {
      const payload = isSignup ? form : { email: form.email, password: form.password };
      await login(payload, mode);
      // Verification logic removed as requested
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGoogle = async (response) => {
    setError("");
    try {
      await loginWithGoogle(response.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDemoAdminLogin = async () => {
    setError("");
    setDemoLoading(true);
    setForm((current) => ({ ...current, ...demoAdminCredentials }));
    try {
      await login(demoAdminCredentials, "login");
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="modern-auth-screen">
      <div className="landing-bg-grid" />
      
      <div className="modern-auth-card">
        <div className="auth-header-wrapper">
          <Link className="modern-auth-logo" to="/">
            <div className="brand-icon"><Zap size={18} /></div>
            <span>WorkOS</span>
          </Link>
        </div>

        <div className="modern-auth-heading">
          <h2>{isSignup ? "Start your workspace" : "Welcome back"}</h2>
          <p>{isSignup ? "Create a free account and start managing your team with AI." : "Sign in to your account to continue your workflow."}</p>
        </div>

        {/* Google Login on Top */}
        <div className="google-sso-container">
          {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google login failed")}
              width="100%"
              size="large"
              shape="rectangular"
              theme="filled_black"
              text={isSignup ? "signup_with" : "signin_with"}
            />
          ) : (
            <div className="muted small-text text-center" style={{ textAlign: "center", color: "#a1a1aa", fontSize: "12px" }}>Set VITE_GOOGLE_CLIENT_ID to enable Google login.</div>
          )}
        </div>

        <div className="modern-auth-divider">
          <span>or continue with email</span>
        </div>

        {!isSignup && (
          <button
            className="modern-demo-btn"
            type="button"
            onClick={handleDemoAdminLogin}
            disabled={demoLoading}
          >
            <span>{demoLoading ? "Opening demo admin..." : "Use Demo Admin"}</span>
            <small>For project review only</small>
          </button>
        )}

        <form className="modern-auth-form" onSubmit={submit}>
          {isSignup && (
            <div className="input-group">
              <label>Full Name</label>
              <input placeholder="Jane Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
          )}
          
          <div className="input-group">
            <label>Work Email</label>
            <input type="email" placeholder="jane@company.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>

          <div className="input-group password-group">
            <label>Password</label>
            <div className="modern-password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
              <button
                type="button"
                className="eye-btn"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {isSignup && (passwordFocused || form.password) && (
              <div className="modern-password-rules">
                {passwordRules.map((rule) => {
                  const passed = rule.test(form.password);
                  return (
                    <span className={`rule-item ${passed ? "passed" : ""}`} key={rule.label}>
                      {passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {rule.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {isSignup && (
            <div className="input-group password-group">
              <label>Confirm Password</label>
              <div className="modern-password-wrap">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.passwordConfirm}
                  onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => setShowConfirmPassword((value) => !value)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {form.passwordConfirm && !passwordsMatch && <small className="error-text">Passwords do not match.</small>}
            </div>
          )}

          {error && <div className="modern-error-banner">{error}</div>}

          <button className="modern-submit-btn">
            {isSignup ? "Create account" : "Sign in"} <ArrowRight size={16} />
          </button>
        </form>

        <div className="modern-auth-footer">
          <Link className="modern-switch-btn" to={isSignup ? "/login" : "/signup"}>
            {isSignup ? "Already have an account? Sign in" : "Need an account? Create one"}
          </Link>
        </div>
      </div>
    </div>
  );
};
