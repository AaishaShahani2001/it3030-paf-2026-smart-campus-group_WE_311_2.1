import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { loginUser } from "../services/authService";
import { setToken } from "../utils/auth";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Username and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await loginUser({ username, password });
      const token = typeof res.data === "string" ? res.data : res.data?.token || "";
      const role = typeof res.data === "object" ? res.data?.role : null;
      const normalizedRole = typeof role === "string" ? role.trim().toUpperCase() : null;
      const responseUsername = typeof res.data === "object" ? res.data?.username : null;
      const responseEmail = typeof res.data === "object" ? res.data?.email : null;
      setToken(token);
      localStorage.setItem("username", (responseUsername || username).trim());
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