import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import type { User } from "../types/user";

interface ProtectedRouteProps {
  user: User | null;
  requiredRole?: User["role"];
  children: ReactNode;
}

export default function ProtectedRoute({
  user,
  requiredRole,
  children,
}: ProtectedRouteProps) {
  const isActive = user?.status === "Active";

  if (!isActive) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/directory" replace />;
  }

  return <>{children}</>;
}
