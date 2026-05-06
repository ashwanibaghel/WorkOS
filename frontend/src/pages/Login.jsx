import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/AuthContext.jsx";

const passwordRules = [
  { label: "Minimum 8 characters", test: (value) => value.length >= 8 },
  { label: "One uppercase letter", test: (value) => /[A-Z]/.test(value) },
  { label: "One number", test: (value) => /[0-9]/.test(value) },
  { label: "One special character", test: (value) => /[^A-Za-z0-9]/.test(value) }
];

export const Login = ({ mode }) => {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { login, loginWithGoogle, resendVerification } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [devVerificationUrl, setDevVerificationUrl] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resending, setResending] = useState(false);

  const isStrongPassword = passwordRules.every((rule) => rule.test(form.password));
  const passwordsMatch = !isSignup || (form.passwordConfirm && form.password === form.passwordConfirm);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setDevVerificationUrl("");
    if (isSignup && (!isStrongPassword || !passwordsMatch)) {
      setError("Please complete all password requirements before creating an account.");
      return;
    }
    try {
      const payload = isSignup ? form : { email: form.email, password: form.password };
      const result = await login(payload, mode);
      if (isSignup && result.verificationRequired) {
        setNotice(result.emailSent ? "Verify your email to continue." : "");
        setDevVerificationUrl(result.devVerificationUrl || "");
        setForm({ name: "", email: form.email, password: "", passwordConfirm: "" });
        return;
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    }
  };

  const resend = async () => {
    if (!form.email || resending) return;
    setError("");
    setNotice("");
    setDevVerificationUrl("");
    setResending(true);
    try {
      const result = await resendVerification(form.email);
      setDevVerificationUrl(result.devVerificationUrl || "");
      setNotice(result.devVerificationUrl ? "" : (result.message || "If verification is needed, a new email has been sent."));
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
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

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={submit}>
        <Link className="auth-logo" to="/">
          <div className="brand-mark">W</div>
          <span>WorkOS</span>
        </Link>
        <div className="auth-card-heading">
          <p className="eyebrow">{isSignup ? "Create account" : "Welcome back"}</p>
          <h2>{isSignup ? "Start your workspace" : "Sign in to WorkOS"}</h2>
          <p>{isSignup ? "New accounts start as members. Admins can promote managers from the user panel." : "Your dashboard access is based on the role saved in the database."}</p>
        </div>

        {isSignup && (
          <>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
          </>
        )}
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        <label className="password-field">
          Password
          <div className="password-input-wrap">
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="password-eye-button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setShowPassword((value) => !value)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              title={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {isSignup && (passwordFocused || form.password) && (
            <div className="password-rules-popover">
              <strong>Password rules</strong>
              {passwordRules.map((rule) => {
                const passed = rule.test(form.password);
                return (
                  <span className={passed ? "passed" : ""} key={rule.label}>
                    {passed ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    {rule.label}
                  </span>
                );
              })}
            </div>
          )}
        </label>
        {isSignup && (
          <label>
            Confirm password
            <div className="password-input-wrap">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
              />
              <button
                type="button"
                className="password-eye-button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowConfirmPassword((value) => !value)}
                aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
            {form.passwordConfirm && !passwordsMatch && <small className="field-warning">Passwords do not match.</small>}
          </label>
        )}
        {notice && <div className="success-banner auth-notice">{notice}</div>}
        {devVerificationUrl && (
          <a className="dev-verification-link" href={devVerificationUrl}>
            Verify email
          </a>
        )}
        {error && <div className="error">{error}</div>}
        <button className="primary-button auth-submit">{isSignup ? "Create account" : "Login"}</button>
        {!isSignup && (
          <button type="button" className="auth-text-button" onClick={resend} disabled={resending || !form.email}>
            {resending ? "Sending..." : "Resend verification email"}
          </button>
        )}
        <div className="auth-divider"><span>or</span></div>
        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <div className="google-login-wrap">
            <GoogleLogin
              onSuccess={handleGoogle}
              onError={() => setError("Google login failed")}
              width="100%"
              size="large"
              shape="rectangular"
              theme="filled_black"
              text={isSignup ? "signup_with" : "signin_with"}
            />
          </div>
        ) : (
          <div className="muted small-text">Set VITE_GOOGLE_CLIENT_ID to enable Google login.</div>
        )}
        <Link className="auth-switch" to={isSignup ? "/login" : "/signup"}>{isSignup ? "Already have an account? Sign in" : "Need an account? Create one"}</Link>
      </form>
    </div>
  );
};
