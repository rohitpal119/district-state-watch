import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface DashboardLayoutProps {
  children: ReactNode;
  userRole: "state_official" | "district_collector" | "contractor";
  userDistrict?: string | null;
  userEmail: string;
}

const DashboardLayout = ({ children, userRole, userDistrict, userEmail }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col">
        <Header 
          userRole={userRole} 
          userDistrict={userDistrict}
          userEmail={userEmail}
        />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
