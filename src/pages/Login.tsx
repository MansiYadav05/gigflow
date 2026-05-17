import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { toast } from "sonner";
import { motion } from "motion/react";
import { LogIn, ArrowRight } from "lucide-react";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      login(data.data.token, data.data.user);
      toast.success("Welcome back!");
      navigate("/");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-xl font-semibold text-text-primary">Welcome Back</h1>
          <p className="text-text-secondary text-[13px] mt-1">Please sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
              placeholder="e.g. name@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-medium text-text-secondary mb-1.5 ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-10 px-4 bg-bg-input border border-border rounded-lg outline-none focus:border-border-focus text-[13px] text-text-primary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-11 text-[13px] mt-2 group"
          >
            {loading ? "Signing in..." : (
              <>
                Sign in
                <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border">
          <p className="text-center text-[13px] text-text-secondary">
            Don't have an account?{" "}
            <Link to="/register" className="text-accent font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
