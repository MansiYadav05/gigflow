import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";
import { motion } from "motion/react";
import { UserPlus, ArrowRight } from "lucide-react";
import { AxiosError } from "axios";

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "sales"
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", formData);
      login(data.data.token, data.data.user);
      toast.success("Account created successfully!");
      navigate("/");
    } catch (err) {
      const error = err as AxiosError<{ message: string }>;
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-body p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-bg-surface border border-border rounded-2xl p-8 shadow-xl"
      >
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-xl font-semibold text-text-primary">Create Account</h1>
          <p className="text-text-secondary text-[13px] mt-1">Join GigFlow and manage your pipeline</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Full Name</label>
            <input
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
              placeholder="e.g. John Doe"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Email address</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
              placeholder="e.g. name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
            >
              <option value="sales">Sales Representative</option>
              <option value="admin">Administrator</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 text-[13px] mt-4 group"
          >
            {loading ? "Creating account..." : (
              <>
                Register
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-[13px] text-text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="text-accent font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
