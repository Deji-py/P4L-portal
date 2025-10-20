"use client";
import React from "react";
import { CookiesProvider } from "react-cookie";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <CookiesProvider>{children}</CookiesProvider>
    </div>
  );
}

export default AppLayout;
