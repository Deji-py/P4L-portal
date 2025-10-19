"use client";
import { useSearchParams } from "next/navigation";
import React, { useEffect } from "react";
import { toast } from "sonner";

function AppLayout({ children }: { children: React.ReactNode }) {
  const params = useSearchParams();

  const message = params.get("message");
  const error = params.get("error");

  useEffect(() => {
    if (error) {
      toast.error(error, {
        description: message,
      });
    }
  }, [error, message]);

  return <div>{children}</div>;
}

export default AppLayout;
