// NavMain.tsx
"use client";

import { ReactNode } from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: ReactNode;
  }[];
}) {
  const pathname = usePathname();
  const { open } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => {
            const isActive =
              pathname === item.url || pathname.endsWith(item.url + "/");

            return (
              <SidebarMenuItem key={item.title}>
                <Link href={item.url} className="block">
                  <SidebarMenuButton
                    isActive={isActive}
                    className={cn(
                      " group-['navbtn'] relative h-10 w-full transition-all duration-200 ease-in-out",
                      "hover:bg-sidebar-accent/40 hover:text-accent-foreground",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      !open && "justify-center px-2"
                    )}
                    tooltip={!open ? item.title : undefined}
                  >
                    {item.icon && (
                      <div
                        className={cn(
                          "flex-shrink-0 transition-transform duration-200",
                          isActive
                            ? "text-sidebar-accent-foreground "
                            : "text-foreground/70",
                          !open && "scale-110"
                        )}
                      >
                        {item.icon}
                      </div>
                    )}
                    {open && (
                      <span
                        className={cn(
                          "truncate transition-colors duration-200",
                          isActive
                            ? "text-sidebar-accent-foreground font-medium"
                            : "text-foreground/70 group-['navbtn']-hover:text-sidebar-accent-foreground"
                        )}
                      >
                        {item.title}
                      </span>
                    )}

                    {/* Active indicator dot for collapsed state */}
                    {!open && isActive && (
                      <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-full" />
                    )}
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
