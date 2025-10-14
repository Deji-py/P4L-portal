"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// import { nigeriaStates } from "@/data/nigeria-ststes";

interface StateSelectorProps {
  className?: string;
}

export function StateSelector({ className }: StateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentState = searchParams.get("state") || "All";

  const handleStateChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === "All") {
      params.delete("state");
    } else {
      params.set("state", value);
    }

    const queryString = params.toString();
    const url = queryString ? `?${queryString}` : "";

    router.push(`${window.location.pathname}${url}`);
  };

  return (
    <Select value={currentState} onValueChange={handleStateChange}>
      <SelectTrigger className={`w-[200px] bg-card border  ${className || ""}`}>
        <SelectValue placeholder="Select a state" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="All">All States</SelectItem>
        {[
          {
            id: 1,
            name: "Federal Capital Territory",
          },
        ].map((state) => (
          <SelectItem
            key={state.id}
            value={
              state.name === "Federal Capital Territory" ? "FCT" : state.name
            }
          >
            {state.name === "Federal Capital Territory" ? "FCT" : state.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
