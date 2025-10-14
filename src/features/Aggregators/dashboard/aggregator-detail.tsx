/* eslint-disable react-hooks/exhaustive-deps */
import { Blocks, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { IconCalendarEvent } from "@tabler/icons-react";
import Link from "next/link";
import useProfile from "@/hooks/useProfile";
import moment from "moment";
import { useEffect } from "react";
import { useProfileStore } from "@/store/profile.store";

type AggregatorDetailProps = {
  onAssignProceeds?: () => void;
};

function AggregatorDetail({ onAssignProceeds }: AggregatorDetailProps) {
  const { profile, profileLoading, profileError, profileErrorData } =
    useProfile();

  const setProfile = useProfileStore((state) => state.setProfile);

  useEffect(() => {
    const udateStore = () => {
      if (profile) {
        setProfile(profile);
      }
    };
    udateStore();
  }, [profileLoading]);

  if (profileLoading || !profile) {
    return (
      <Card className="relative flex flex-col w-full rounded-xl sm:rounded-2xl overflow-hidden border-0 bg-[#f5f5f5] animate-pulse min-h-[180px] sm:max-h-[200px]"></Card>
    );
  }

  if (profileError) {
    return (
      <Card className="relative flex flex-col w-full rounded-xl sm:rounded-2xl overflow-hidden border-0 bg-primary">
        <div className="absolute inset-0 bg-gradient-to-r from-[#082B18] via-[#082B18] to-black/10 z-5"></div>
        <CardContent className="relative flex items-center justify-center z-10 py-6 sm:py-8">
          <p className="text-white/60 text-sm sm:text-base text-center px-4">
            {profileErrorData?.message || "Failed to load profile"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Extract data from profile with fallbacks
  const companyName = profile.business_name || "N/A";
  const rcNumber = profile.rc_number || "N/A";
  const location = profile.state || "N/A";
  const subLocation = profile.local_gov_area || "N/A";

  return (
    <Card className="relative flex flex-col gap-0 pt-0 w-full rounded-xl sm:rounded-2xl overflow-hidden border-0 bg-black min-h-[180px] sm:max-h-[200px]">
      <div className="absolute inset-0 bg-gradient-to-r from-[#082B18] via-[#082B18] to-black/10 z-5"></div>
      <div className="absolute inset-0 opacity-80">
        <Image
          layout="fill"
          objectFit="cover"
          src="https://plus.unsplash.com/premium_photo-1686529896385-8a8d581d0225?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt=""
          className="w-full h-full opacity-45 object-cover"
        />
      </div>

      <CardHeader className="relative z-10  p-3 sm:p-4 md:px-6 md:pt-6">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 relative rounded-lg sm:rounded-xl bg-gradient-to-br from-accent/20 to-accent/20 flex items-center justify-center overflow-hidden shadow-lg flex-shrink-0 p-1.5 sm:p-2">
              <Blocks className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-white font-medium text-sm sm:text-base md:text-lg leading-tight mb-0.5 line-clamp-1">
                {companyName}
              </h2>
              <p className="text-white/80 pt-0.5 sm:pt-1 text-xs font-normal">
                RC: {rcNumber}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
            <IconCalendarEvent className="text-secondary w-5 h-5 sm:w-6 sm:h-6" />
            <p className="text-white/80 text-[10px] sm:text-xs whitespace-nowrap">
              {moment(moment.now()).format("DD MMM YYYY")}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="relative flex-1 z-10 p-3 sm:p-4 md:p-6  pt-0 sm:pt-0">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4">
          <div className="flex-1">
            <h3 className="text-white text-2xl sm:text-3xl font-bold mb-1 leading-tight">
              {location}
            </h3>
            <p className="text-secondary text-xs sm:text-sm font-normal">
              <span className="text-white">LGA: </span>
              {subLocation}
            </p>
          </div>
          <Link href="aggregator/submissions" className="w-full sm:w-auto">
            <Button
              variant="secondary"
              onClick={onAssignProceeds}
              className="py-2 sm:py-3 px-3 sm:px-4 h-auto rounded-lg sm:rounded-xl flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm"
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>View Submissions</span>
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default AggregatorDetail;
