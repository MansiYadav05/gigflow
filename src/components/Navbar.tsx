import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User as UserIcon, Menu, X } from "lucide-react";

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMobileMenuOpen(false);
  };

  return (
    <nav className="border-b border-border bg-bg-surface px-4 sm:px-6 py-3 sm:py-0 sm:h-16 flex items-center justify-between sticky top-0 z-50">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 bg-accent rounded flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-lg">G</span>
        </div>
        <span className="font-semibold text-base sm:text-base text-text-primary hidden sm:inline">GigFlow</span>
      </Link>

      {/* Desktop Menu */}
      <div className="hidden sm:flex items-center gap-4">
        <div className="w-px h-6 bg-border" />
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[13px] font-medium text-text-primary">{user.name}</span>
              <span
                className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full leading-none mt-0.5 ${user.role === "admin"
                    ? "bg-accent-soft text-accent"
                    : "bg-amber-500/20 text-amber-500"
                  }`}
              >
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

      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="sm:hidden p-2 text-text-secondary hover:text-text-primary transition-colors"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="absolute top-full left-0 right-0 bg-bg-surface border-b border-border sm:hidden">
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent-soft flex items-center justify-center text-accent text-sm font-bold ring-1 ring-accent/20">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] font-medium text-text-primary">{user.name}</span>
                <span
                  className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-full leading-none mt-0.5 w-fit ${user.role === "admin"
                      ? "bg-accent-soft text-accent"
                      : "bg-amber-500/20 text-amber-500"
                    }`}
                >
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 rounded-lg bg-status-lost/10 text-status-lost font-medium text-sm flex items-center justify-center gap-2 hover:bg-status-lost/20 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
