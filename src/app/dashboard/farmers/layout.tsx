"use client";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ReactNode } from "react";
import { LayoutPanelTop } from "lucide-react";

const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard/farmers",
      icon: <LayoutPanelTop className="h-4 w-4" />,
    },
    // {
    //   title: "Inventory",
    //   url: "/dashboard/bulk-trader/inventory",
    //   icon: <Table className="h-4 w-4" />,
    // },
  ],
};

export default function Page({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar data={sidebarData} variant="floating" role="farmers" />
      <SidebarInset>
        <div className="flex flex-1 flex-col p-2 ">
          <div className="@container/main flex  bg-background  rounded-2xl dark:bg-accent/10 relative border   shadow flex-1 flex-col gap-2">
            <SiteHeader />
            {children}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
