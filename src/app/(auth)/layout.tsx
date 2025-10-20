"use client";
import { usePathname, useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const error = params.get("error");
    const message = params.get("message");

    if (error) {
      toast.error(message || "An error occurred");
    }
  }, [params, pathname]);

  return <div>{children}</div>;
}

export default AppLayout;
