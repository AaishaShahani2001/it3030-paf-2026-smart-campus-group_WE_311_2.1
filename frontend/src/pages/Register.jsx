import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerUser } from "../services/authService";

const Register = () => {
  const [form, setForm] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.email.trim() || !form.password) {
      toast.error("Username, email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        username: form.username.trim(),
        name: form.name.trim() || form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      };

      await registerUser(payload);
      localStorage.setItem("userEmail", payload.email);
      toast.success("Registered successfully. Please login.");
      navigate("/login");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (typeof err?.response?.data === "string" ? err.response.data : null) ||
        "Registration failed. Please try with different credentials.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
      <main className="pt-28 pb-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8 sm:p-10">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Create an account</h1>
          <p className="mt-2 text-sm text-gray-500">Register to access facilities and report issues.</p>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Username</label>
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="e.g. student1"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Full name</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                  placeholder="Optional display name"
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                placeholder="your.email@campus.edu"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-all"
                placeholder="Choose a secure password"
                autoComplete="new-password"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-6 text-sm font-bold text-white bg-linear-to-r from-emerald-600 to-teal-500 rounded-xl shadow-[0_4px_14px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {isSubmitting ? "Creating account..." : "Register"}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-600 text-center">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-emerald-600 hover:text-emerald-700">
              Login
            </Link>
          </p>
        </div>
      </main>
  );
};

export default Register;