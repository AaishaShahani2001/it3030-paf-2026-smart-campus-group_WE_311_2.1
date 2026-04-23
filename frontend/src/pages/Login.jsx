import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser, loginWithGoogle } from "../services/authService";
import { setToken } from "../utils/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const googleButtonRef = useRef(null);
  const googleButtonRenderedRef = useRef(false);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
  const navigate = useNavigate();

  const completeLogin = (data, fallbackUsername = "") => {
    const token = typeof data === "string" ? data : data?.token || "";
    const role = typeof data === "object" ? data?.role : null;
    const normalizedRole = typeof role === "string" ? role.trim().toUpperCase() : null;
    const responseUsername = typeof data === "object" ? data?.username : null;
    const responseEmail = typeof data === "object" ? data?.email : null;

    setToken(token);
    const safeUsername = (responseUsername || fallbackUsername || "").trim();
    if (safeUsername) {
      localStorage.setItem("username", safeUsername);
    }
    if (responseEmail) {
      localStorage.setItem("userEmail", responseEmail);
    }
    if (normalizedRole) {
      localStorage.setItem("role", normalizedRole);
    }

    toast.success("Login successful.");
    switch (normalizedRole) {
      case "ADMIN":
        navigate("/admin/dashboard");
        break;
      case "USER":
        navigate("/user/dashboard");
        break;
      case "TECHNICIAN":
        navigate("/technician/dashboard");
        break;
      default:
        navigate("/home");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUser({ username, password });
      completeLogin(res.data, username);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Login failed. Please check your credentials.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!googleClientId) {
      return undefined;
    }

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) {
        return;
      }
      if (googleButtonRenderedRef.current) {
        return;
      }
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          if (!credential) {
            toast.error("Google sign-in did not return a token.");
            return;
          }
          setIsGoogleSubmitting(true);
          try {
            const res = await loginWithGoogle(credential);
            completeLogin(res.data);
          } catch (err) {
            const message =
              err?.response?.data?.message ||
              (typeof err?.response?.data === "string" ? err.response.data : null) ||
              "Google sign-in failed.";
            toast.error(message);
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
      });
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: 320,
      });
      googleButtonRenderedRef.current = true;
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
      return undefined;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    return () => {
      googleButtonRenderedRef.current = false;
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [googleClientId]);

  return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-gray-300/50 border border-gray-200 p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back</h1>
          <p className="mt-2 text-sm text-gray-500">Sign in to continue using Smart Campus Ops Hub.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                placeholder="Enter your username"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-7">
            <div className="flex items-center gap-3 text-xs font-semibold text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              <span>OR</span>
              <span className="h-px flex-1 bg-gray-200" />
            </div>
            <p className="mt-4 text-center text-sm font-semibold text-gray-700">Continue with Google</p>
            {googleClientId ? (
              <div className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4">
                <div className="flex justify-center">
                  <div ref={googleButtonRef} />
                </div>
                <p className="mt-2 text-center text-xs text-gray-500">
                  Use your Google account for faster sign-in.
                </p>
              </div>
            ) : (
              <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-center text-sm text-amber-700">
                Google sign-in is not configured yet. Set <code>VITE_GOOGLE_CLIENT_ID</code>.
              </p>
            )}
            {isGoogleSubmitting && (
              <p className="mt-2 text-center text-sm font-medium text-emerald-600">Signing in with Google...</p>
            )}
          </div>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Register
            </Link>
          </p>
        </div>
      </main>
  );
};

export default Login;