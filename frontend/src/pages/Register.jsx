import { useState } from "react";

import { registerUser } from "../services/authService";
import { useNavigate } from "react-router-dom";


const Register = () => {
  const [form, setForm] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      await registerUser(form);
      alert("Registered successfully");
      navigate("/login");
    } catch {
      alert("Registration failed");
    }
  };

  return (
    <div>
      <h2>Register</h2>

      <form onSubmit={handleRegister}>
        <input name="name" placeholder="Name" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="password" placeholder="Password" onChange={handleChange} />

        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;