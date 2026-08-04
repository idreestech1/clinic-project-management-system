import Dashboard from "./dashboard/Dashboard";

function Admin({ onAdminLogout = () => {} }) {
  return (
    <Dashboard onAdminLogout={onAdminLogout} />
  );
}

export default Admin;
