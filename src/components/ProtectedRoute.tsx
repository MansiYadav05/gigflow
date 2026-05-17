import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-neutral-50">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-neutral-900"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;

  return <Outlet />;
};

export default ProtectedRoute;
