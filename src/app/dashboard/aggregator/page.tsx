"use client";
import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardStats from "@/features/Aggregators/dashboard/statistics";
import SubmissionCard from "@/features/Aggregators/submission/submission-card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Swiper, SwiperRef, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import AggregatorDetail from "@/features/Aggregators/dashboard/aggregator-detail";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import { useProfileStore } from "@/store/profile.store";
import SubmissionTable from "@/features/Aggregators/submission/submission-table";

export default function Page() {
  const swiperRef = useRef<SwiperRef | null>(null);
  const [showNav, setShowNav] = useState(false);

  const profile = useProfileStore((state) => state.profile);
  const {
    pendingSubmissions,
    pendingSubmissionsLoading,
    submissions,
    submissionsLoading,
  } = useSubmissions(profile?.id);

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6">
      <div className="flex-1 w-full px-4 sm:px-6 md:px-10 lg:px-20 py-4 sm:py-6 md:py-10 gap-3 sm:gap-4 flex flex-col">
        {/* Stats and details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
          <AggregatorDetail />
          <DashboardStats />
        </div>

        {/* New Submission */}
        <div className="grid grid-cols-1 border-2 rounded-xl sm:rounded-2xl border-dotted">
          <div className="flex items-center justify-between w-full py-2 sm:py-3 px-3 sm:px-5 border-b border-dotted">
            <h3 className="text-sm sm:text-base font-medium">
              New Submissions
            </h3>
            <div className="flex items-center -space-x-2">
              {pendingSubmissions?.slice(0, 3).map((submission, index) => {
                return (
                  <Avatar
                    className="border-2 border-background w-7 h-7 sm:w-8 sm:h-8"
                    key={index}
                  >
                    <AvatarFallback className="text-xs">
                      {submission.farmer_info.full_name
                        ?.charAt(0)
                        .toUpperCase()}
                    </AvatarFallback>
                    <AvatarImage
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${submission.farmer_info.id}`}
                      alt={submission.farmer_info.full_name || "Farmer"}
                    />
                  </Avatar>
                );
              })}
              {submissions && submissions.length > 3 && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted text-xs font-semibold rounded-full flex flex-col justify-center items-center">
                  +{submissions.length - 3}
                </div>
              )}
            </div>
          </div>

          {/* Swiper Container */}
          <div
            className="relative w-full p-3 sm:p-4 rounded-b-lg"
            onMouseEnter={() => setShowNav(true)}
            onMouseLeave={() => setShowNav(false)}
          >
            {pendingSubmissionsLoading ? (
              <div className="flex items-center justify-center h-32 sm:h-40 text-gray-500 text-sm sm:text-base">
                Loading submissions...
              </div>
            ) : !pendingSubmissions || pendingSubmissions.length === 0 ? (
              <div className="flex items-center justify-center h-32 sm:h-40 text-gray-500 text-sm sm:text-base">
                No submissions yet
              </div>
            ) : (
              <>
                <Swiper
                  ref={swiperRef}
                  modules={[Navigation]}
                  slidesPerView="auto"
                  spaceBetween={12}
                  className="w-full"
                >
                  {pendingSubmissions.map((submission, index) => (
                    <SwiperSlide key={index} style={{ width: "auto" }}>
                      <SubmissionCard submission={submission} />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Left Navigation Button */}
                <button
                  onClick={() => swiperRef.current?.swiper.slidePrev()}
                  className={`absolute cursor-pointer left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${
                    showNav ? "opacity-100 visible" : "opacity-0 invisible"
                  }`}
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                </button>

                {/* Right Navigation Button */}
                <button
                  onClick={() => swiperRef.current?.swiper.slideNext()}
                  className={`absolute cursor-pointer right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${
                    showNav ? "opacity-100 visible" : "opacity-0 invisible"
                  }`}
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                </button>
              </>
            )}
          </div>
        </div>

        <SubmissionTable
          loading={submissionsLoading}
          data={submissions as Submission[]}
        />
      </div>
    </div>
  );
}
