/* eslint-disable react-hooks/exhaustive-deps */
import { Blocks, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Image from "next/image";
import { IconCalendarEvent } from "@tabler/icons-react";
import useProfile from "@/hooks/useProfile";
import moment from "moment";
import { useEffect, useState } from "react";
import { useProfileStore } from "@/store/profile.store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAggregatorLocation } from "@/hooks/aggregators/useAggregatorLocation";

type AggregatorDetailProps = {
  onAssignProceeds?: () => void;
};

function AggregatorDetail({ onAssignProceeds }: AggregatorDetailProps) {
  const { profile, profileLoading, profileError, profileErrorData } =
    useProfile("aggregators");

  const setProfile = useProfileStore((state) => state.setProfile);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [longitude, setLongitude] = useState("");
  const [latitude, setLatitude] = useState("");

  const {
    location,
    locationLoading,
    updateLocation,
    isUpdatingLocation,
    geocodeAndUpdate,
    isGeocoding,
  } = useAggregatorLocation(profile?.id);

  useEffect(() => {
    if (profile) {
      setProfile(profile);
      if (location) {
        setLongitude(location.longitude?.toString());
        setLatitude(location.latitude?.toString());
        setAddressInput(location.address);
      }
    }
  }, [profileLoading, location]);

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

  const companyName = profile.business_name || "N/A";
  const rcNumber = profile.rc_number || "N/A";
  const locationAvailable = !!location;

  const handleManualLocation = () => {
    if (longitude && latitude) {
      updateLocation({
        aggregatorId: profile.id,
        address: addressInput || "Manual Location",
        longitude: parseFloat(longitude),
        latitude: parseFloat(latitude),
      });
      setDialogOpen(false);
    }
  };

  const handleGeocodeAddress = () => {
    if (addressInput?.trim()) {
      geocodeAndUpdate(addressInput);
      setDialogOpen(false);
    }
  };

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Reverse geocode to get address from coordinates
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();

          const address =
            data.display_name ||
            `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

          // Update the input fields
          setLatitude(latitude.toString());
          setLongitude(longitude.toString());
          setAddressInput(address);

          // Update location in the backend
          updateLocation({
            aggregatorId: profile.id,
            address: address,
            longitude: longitude,
            latitude: latitude,
          });

          setDialogOpen(false);
        } catch (error) {
          console.error("Reverse geocoding error:", error);

          // Fallback: use coordinates as address
          const fallbackAddress = `Lat: ${latitude.toFixed(
            4
          )}, Lng: ${longitude.toFixed(4)}`;
          setLatitude(latitude.toString());
          setLongitude(longitude.toString());
          setAddressInput(fallbackAddress);

          updateLocation({
            aggregatorId: profile.id,
            address: fallbackAddress,
            longitude: longitude,
            latitude: latitude,
          });

          setDialogOpen(false);
        }
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              "Location access denied. Please enable location permissions in your browser.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }

        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

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

      <CardHeader className="relative z-10 p-3 sm:p-4 md:px-6 md:pt-6">
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

      <CardContent className="relative flex-1 z-10 p-3 sm:p-4 md:p-6 pt-0 sm:pt-0">
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4">
          {locationAvailable ? (
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-secondary" />
                <h3 className="text-white text-sm sm:text-base font-semibold">
                  Location Set
                </h3>
              </div>
              <p className="text-secondary text-xs sm:text-sm font-normal line-clamp-2">
                {location?.address}
              </p>
              <p className="text-white/60 text-xs mt-1">
                Lat: {location?.latitude?.toFixed(4)}, Lng:{" "}
                {location?.longitude?.toFixed(4)}
              </p>
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-white text-xl sm:text-2xl font-bold mb-1">
                Location Not Set
              </h3>
              <p className="text-secondary text-xs sm:text-sm font-normal">
                Set your precise location for better visibility
              </p>
            </div>
          )}

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant={locationAvailable ? "secondary" : "secondary"}
                className={`!py-2 sm:py-3 px-3 sm:px-4 h-auto rounded-lg sm:rounded-xl flex-shrink-0 w-full sm:w-auto text-xs sm:text-sm `}
              >
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>
                  {locationAvailable ? "Update Location" : "Set Location"}
                </span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Set Aggregator Location</DialogTitle>
                <DialogDescription>
                  Choose between entering coordinates manually or using address
                  geocoding
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="geocode" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="geocode">Address Geocoding</TabsTrigger>
                  <TabsTrigger value="manual">Manual Coordinates</TabsTrigger>
                </TabsList>

                <TabsContent value="geocode" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Enter full address (e.g., 123 Main St, Lagos, Nigeria)"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Enter a complete address to find coordinates automatically
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleGeocodeAddress}
                      disabled={isGeocoding || !addressInput?.trim()}
                      variant="outline"
                      className="w-full"
                    >
                      {isGeocoding && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      {isGeocoding ? "Geocoding..." : "Geocode Address"}
                    </Button>
                    <Button
                      onClick={handleAutoDetectLocation}
                      disabled={isGeocoding}
                      className="w-full"
                    >
                      {isGeocoding && (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      )}
                      <MapPin className="w-4 h-4 mr-2" />
                      {isGeocoding ? "Detecting..." : "Auto-Detect"}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="manual" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.0001"
                        placeholder="-0.1234"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.0001"
                        placeholder="6.5244"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address-manual">Address (Optional)</Label>
                    <Input
                      id="address-manual"
                      placeholder="e.g., Lekki, Lagos"
                      value={addressInput}
                      onChange={(e) => setAddressInput(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleManualLocation}
                    disabled={isUpdatingLocation || !longitude || !latitude}
                    className="w-full"
                  >
                    {isUpdatingLocation && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    {isUpdatingLocation ? "Saving..." : "Save Location"}
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

export default AggregatorDetail;
