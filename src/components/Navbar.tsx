import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="h-16 border-b border-border bg-bg-surface px-6 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-3">
        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span className="font-semibold text-base text-text-primary">GigFlow</span>
      </Link>

      <div className="flex items-center gap-4">

        <div className="w-px h-6 bg-border mx-1" />

        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-[13px] font-medium text-text-primary">{user.name}</span>
              <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full leading-none mt-0.5 ${user.role === 'admin' ? 'bg-accent-soft text-accent' : 'bg-amber-500/20 text-amber-500'
                }`}>
                {user.role}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-accent-soft flex items-center justify-center text-accent text-xs font-bold ring-1 ring-accent/20">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-text-secondary hover:text-status-lost transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
