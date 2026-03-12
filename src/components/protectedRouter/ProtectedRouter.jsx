import { Navigate } from "react-router-dom";

export default function ProtectedRouter({ children }) {
  const token = localStorage.getItem("accessToken");

  if (!token) return <Navigate to="/login" />;

  return children;
}