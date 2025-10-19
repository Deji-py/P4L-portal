"use client";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type FilterTab = {
  id: string;
  label: string;
  count: number;
  value: string;
};

const TabItem = ({
  label,
  count,
  active,
  onClick,
  index,
}: {
  label: string;
  count: number;
  active?: boolean;
  onClick?: () => void;
  index: number;
}) => {
  const badgeColors = [
    "bg-orange-200 text-orange-800",
    "bg-green-200 text-green-800",
    "bg-red-200 text-red-800",
    "bg-blue-200 text-blue-800",
    "bg-gray-200 text-gray-800",
  ];

  return (
    <button
      onClick={() => onClick?.()}
      className={clsx(
        "flex items-center cursor-pointer gap-2 py-3 sm:py-4 px-4 sm:px-6 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-colors",
        active
          ? "bg-black hover:bg-[#101010] text-white"
          : "hover:bg-[#f1f1f1] bg-[#F5F5F5]"
      )}
    >
      <div
        className={clsx(
          "h-5 w-5 rounded-full text-xs flex flex-col justify-center items-center text-primary",
          active ? "bg-white text-black" : badgeColors[index]
        )}
      >
        <span>{count}</span>
      </div>
      <span>{label}</span>
    </button>
  );
};

interface DashboardTabFilterProps {
  counts?: Record<string, number>;
}

function DashboardTabFilter({ counts = {} }: DashboardTabFilterProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams);
  const router = useRouter();

  const tabs: FilterTab[] = [
    { label: "Pending", count: counts.pending || 0, id: "1", value: "pending" },
    {
      label: "Accepted",
      count: counts.accepted || 0,
      id: "2",
      value: "accepted",
    },
    {
      label: "Declined",
      count: counts.declined || 0,
      id: "3",
      value: "declined",
    },
    {
      label: "Assigned For Pickup",
      count: counts.out_for_delivery || 0,
      id: "4",
      value: "out_for_delivery",
    },
    {
      label: "Complete",
      count: counts.complete || 0,
      id: "5",
      value: "complete",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0]);

  // Update active tab based on URL params
  useEffect(() => {
    const params_tab = params.get("tab");
    if (params_tab) {
      const tab_index = tabs.findIndex((tab) => tab.value === params_tab);
      if (tab_index !== -1) {
        setActiveTab(tabs[tab_index]);
      }
    } else {
      // Default to pending if no tab is selected
      setActiveTab(tabs[0]);
    }
  }, []);

  const handleSetTab = (index: number) => {
    const tab_id = tabs[index].value;
    params.set("tab", tab_id as string);
    router.push(`?${params.toString()}`);
    const tab_index = tabs.findIndex((tab) => tab.value === tab_id);
    setActiveTab(tabs[tab_index]);
  };

  return (
    <div className="flex items-center w-full sm:w-fit justify-start sm:justify-between gap-2 sm:gap-4 text-xs sm:text-sm font-medium overflow-x-auto pb-2 sm:pb-0">
      {tabs.map((tab, index) => (
        <TabItem
          key={tab.id}
          active={activeTab.value === tab.value}
          label={tab.label}
          count={tab.count}
          index={index}
          onClick={() => handleSetTab(index)}
        />
      ))}
    </div>
  );
}

export default DashboardTabFilter;
