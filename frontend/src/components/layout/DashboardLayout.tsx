import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useLiveFeed } from "@/hooks/useLiveFeed";

export default function DashboardLayout() {
  const liveFeed = useLiveFeed();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header connected={liveFeed.connected} />
        <main className="flex-1 p-6">
          <Outlet context={liveFeed} />
        </main>
      </div>
    </div>
  );
}
