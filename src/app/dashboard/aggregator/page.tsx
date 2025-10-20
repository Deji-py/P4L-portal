"use client";
import { useRef, useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import DashboardStats from "@/features/Aggregators/dashboard/statistics";
import SubmissionCard from "@/features/Aggregators/submission/submission-card";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
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
    refetchPendingSubmissions,
    refetchSubmissions,
  } = useSubmissions(profile?.id as number);

  // Refetch data when component mounts
  useEffect(() => {
    if (profile?.id) {
      refetchPendingSubmissions();
      refetchSubmissions();
    }
  }, [profile?.id, refetchPendingSubmissions, refetchSubmissions]);

  // Show loading state only on initial load
  if (pendingSubmissionsLoading && !pendingSubmissions.length) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <div>
            <p className="text-base font-medium">Loading dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </div>
    );
  }

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
              {pendingSubmissions.slice(0, 3).map((submission, index) => {
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
              {pendingSubmissions.length > 3 && (
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-muted text-xs font-semibold rounded-full flex flex-col justify-center items-center">
                  +{pendingSubmissions.length - 3}
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
            {pendingSubmissionsLoading && !pendingSubmissions.length ? (
              <div className="flex items-center justify-center h-32 sm:h-40">
                <div className="text-center space-y-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Loading submissions...
                  </p>
                </div>
              </div>
            ) : pendingSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 sm:h-40 text-center">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-muted-foreground"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  No pending submissions
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  New submissions will appear here
                </p>
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
                    <SwiperSlide
                      key={submission.id || index}
                      style={{ width: "auto" }}
                    >
                      <SubmissionCard submission={submission} />
                    </SwiperSlide>
                  ))}
                </Swiper>

                {/* Left Navigation Button */}
                {pendingSubmissions.length > 1 && (
                  <>
                    <button
                      onClick={() => swiperRef.current?.swiper.slidePrev()}
                      className={`absolute cursor-pointer left-1 sm:left-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${
                        showNav ? "opacity-100 visible" : "opacity-0 invisible"
                      }`}
                      aria-label="Previous slide"
                    >
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                    </button>

                    {/* Right Navigation Button */}
                    <button
                      onClick={() => swiperRef.current?.swiper.slideNext()}
                      className={`absolute cursor-pointer right-1 sm:right-2 top-1/2 -translate-y-1/2 z-10 p-1.5 sm:p-2 rounded-full bg-white/90 hover:bg-white shadow-lg transition-all duration-200 ${
                        showNav ? "opacity-100 visible" : "opacity-0 invisible"
                      }`}
                      aria-label="Next slide"
                    >
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-800" />
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submissions Table */}
        <SubmissionTable
          loading={submissionsLoading && !submissions?.length}
          data={submissions as Submission[]}
        />
      </div>
    </div>
  );
}
