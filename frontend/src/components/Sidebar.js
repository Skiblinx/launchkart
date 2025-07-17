import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: "🏠" },
  { to: "/services", label: "Services", icon: "🛠️" },
  { to: "/mentors", label: "Mentors", icon: "🎓" },
  { to: "/investment", label: "Investment", icon: "💸", role: "founder" },
  { to: "/admin/dashboard", label: "Admin", icon: "🛡️", role: "admin" },
];

const Sidebar = () => {
  const { user } = useUser();
  const location = useLocation();

  return (
    <aside className="hidden md:flex flex-col w-64 h-screen bg-white shadow-lg border-r fixed top-0 left-0 z-40">
      <div className="flex items-center h-20 px-6 border-b">
        <span className="text-2xl font-bold text-blue-600">LaunchKart</span>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-2" data-tour="sidebar-nav">
        {navItems.map(
          (item) =>
            (!item.role || user?.role === item.role) && (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center px-4 py-3 rounded-lg transition font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 ${
                  location.pathname === item.to ? "bg-blue-100 text-blue-700" : ""
                }`}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.label}
              </Link>
            )
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
