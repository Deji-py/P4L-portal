"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Clock,
  Star,
  Upload,
  Video,
  AlertCircle,
  ImageIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  Package,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useFarmerData } from "@/hooks/farmers/useFarmerData";
import useAuth from "@/hooks/useAuth";
import { CreateProduceRequestDialog } from "@/features/farmers/produceRequestDialog";
import { RequestsTable } from "@/features/farmers/requests-table";
import { supabaseClient } from "@/utils/client";
import Image from "next/image";

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const {
    farmer,
    analytics,
    analyticsLoading,
    useFarmerRequests,
    farmerLoading,
    updateProfile,
    isUpdatingProfile,
  } = useFarmerData(user?.id as string);

  const [selectedStatus, setSelectedStatus] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCompleteProfileDialog, setShowCompleteProfileDialog] =
    useState(false);
  const [uploadType, setUploadType] = useState<"image" | "video" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data: requestsData, isLoading: requestsLoading } = useFarmerRequests(
    selectedStatus,
    1,
    10
  );

  // Clean up preview URL on unmount or dialog close
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!showCompleteProfileDialog) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setUploadType(null);
      setPreviewUrl(null);
      setUploadError(null);
    }
  }, [showCompleteProfileDialog, previewUrl]);

  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Clean up previous preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    if (uploadType === "video") {
      if (!file.type.startsWith("video/")) {
        setUploadError("Please select a valid video file");
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setUploadError("Video file is too large (max 50MB)");
        return;
      }

      const video = document.createElement("video");
      video.preload = "metadata";

      video.onloadedmetadata = () => {
        const objectUrl = video.src;
        if (video.duration > 10) {
          setUploadError("Video must be 10 seconds or less");
          setSelectedFile(null);
          setPreviewUrl(null);
          URL.revokeObjectURL(objectUrl);
        } else {
          setSelectedFile(file);
          setPreviewUrl(objectUrl);
        }
      };

      video.onerror = () => {
        setUploadError("Unable to read video file");
        setSelectedFile(null);
        setPreviewUrl(null);
      };

      video.src = URL.createObjectURL(file);
    } else if (uploadType === "image") {
      if (!file.type.startsWith("image/")) {
        setUploadError("Please select a valid image file");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError("Image file is too large (max 5MB)");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!selectedFile || !farmer || !uploadType) return;

    try {
      setUploadError(null);

      const fileExt = selectedFile.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${farmer.id}-${timestamp}.${fileExt}`;
      const filePath = `${
        uploadType === "image" ? "farm-images" : "farm-videos"
      }/${fileName}`;

      const { error: uploadError } = await supabaseClient.storage
        .from("farm-media")
        .upload(filePath, selectedFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("farm-media").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      await new Promise<void>((resolve, reject) => {
        updateProfile(
          {
            [uploadType === "image" ? "farm_image_url" : "farm_video_url"]:
              publicUrl,
          },
          {
            onSuccess: () => {
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              setSelectedFile(null);
              setUploadType(null);
              setPreviewUrl(null);
              setShowCompleteProfileDialog(false);
              resolve();
            },
            onError: (error) => {
              reject(error);
            },
          }
        );
      });
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError(
        error instanceof Error
          ? error.message
          : "Upload failed. Please try again."
      );
    }
  };

  // Loading state
  if (farmerLoading || !farmer) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
          <div>
            <p className="text-base font-medium">Loading your dashboard</p>
            <p className="text-sm text-muted-foreground mt-1">
              Please wait while we fetch your data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Incomplete profile state
  if (
    !farmer?.farm_image_url &&
    !farmer?.farm_video_url &&
    !farmer?.profile_approved
  ) {
    return (
      <>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6">
          <Card className="max-w-2xl w-full ">
            <CardHeader className="text-center pb-6 space-y-4">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-2xl flex items-center justify-center">
                <Upload className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl sm:text-3xl">
                  Welcome, {farmer?.full_name.split(" ")[0]}! 👋
                </CardTitle>
                <CardDescription className="text-base max-w-md mx-auto">
                  Complete your profile by uploading farm media to start
                  submitting produce requests.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 px-6 pb-6">
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-900/50">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
                  Farm media helps us verify your profile and connect you with
                  trusted aggregators in your area.
                </AlertDescription>
              </Alert>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <ImageIcon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Photo Upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG up to 5MB
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <Video className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Video Upload</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      MP4, max 10 seconds, 50MB
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full h-12 text-base"
                size="lg"
                onClick={() => setShowCompleteProfileDialog(true)}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Farm Media
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upload Dialog */}
        <Dialog
          open={showCompleteProfileDialog}
          onOpenChange={setShowCompleteProfileDialog}
        >
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload Farm Media</DialogTitle>
              <DialogDescription>
                Choose to upload either an image or a video of your farmland.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              {!uploadType ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUploadType("image")}
                    className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl hover:border-primary hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <ImageIcon className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                    <span className="font-semibold text-sm">Image</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 5MB
                    </span>
                  </button>

                  <button
                    onClick={() => setUploadType("video")}
                    className="group relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl hover:border-primary hover:bg-accent/50 transition-all duration-200"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Video className="h-12 w-12 text-muted-foreground group-hover:text-primary transition-colors mb-3" />
                    <span className="font-semibold text-sm">Video</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 10s, 50MB
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b">
                    <span className="text-sm font-semibold">
                      {uploadType === "image" ? "Image Upload" : "Video Upload"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setUploadType(null);
                        setSelectedFile(null);
                        setUploadError(null);
                        if (previewUrl) {
                          URL.revokeObjectURL(previewUrl);
                          setPreviewUrl(null);
                        }
                      }}
                    >
                      Change Type
                    </Button>
                  </div>

                  <div className="border-2 border-dashed rounded-xl p-6 text-center bg-muted/20">
                    <input
                      type="file"
                      accept={uploadType === "image" ? "image/*" : "video/*"}
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    {!selectedFile ? (
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center py-6"
                      >
                        {uploadType === "image" ? (
                          <ImageIcon className="h-16 w-16 text-muted-foreground mb-4" />
                        ) : (
                          <Video className="h-16 w-16 text-muted-foreground mb-4" />
                        )}
                        <p className="font-semibold text-base mb-1">
                          Click to select file
                        </p>
                        <p className="text-xs text-muted-foreground">
                          or drag and drop here
                        </p>
                      </label>
                    ) : (
                      <div className="space-y-4">
                        {previewUrl && (
                          <div className="rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                            {uploadType === "image" ? (
                              <Image
                                src={previewUrl}
                                alt="Preview"
                                width={400}
                                height={300}
                                className="w-full h-56 object-cover"
                              />
                            ) : (
                              <video
                                src={previewUrl}
                                controls
                                className="w-full h-56 object-cover"
                              >
                                Your browser does not support video preview.
                              </video>
                            )}
                          </div>
                        )}
                        <div className="space-y-2 text-left p-4 bg-muted rounded-lg">
                          <p className="font-medium text-sm truncate">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 cursor-pointer"
                        >
                          Change File
                        </label>
                      </div>
                    )}
                  </div>

                  {uploadError && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{uploadError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCompleteProfileDialog(false)}
                      disabled={isUpdatingProfile}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={handleUpload}
                      disabled={!selectedFile || isUpdatingProfile}
                    >
                      {isUpdatingProfile ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Pending approval state
  if (!farmer?.profile_approved) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6">
        <Card className="max-w-2xl w-full ">
          <CardHeader className="text-center pb-6 space-y-4">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30 rounded-2xl flex items-center justify-center animate-pulse">
              <Clock className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl sm:text-3xl">
                Profile Under Review
              </CardTitle>
              <CardDescription className="text-base max-w-md mx-auto">
                Your profile is being reviewed by our team. This typically takes
                24-48 hours.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-6">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900/50">
              <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                You&apos;ll receive a notification once approved. Then you can
                start submitting produce requests to aggregators.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 rounded-xl bg-muted/50">
              <p className="font-medium text-sm">What happens next?</p>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Our team verifies your farm media</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>Profile gets approved within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                  <span>You can start submitting produce requests</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Need help?{" "}
                <a
                  href="mailto:support@farmapp.com"
                  className="text-primary hover:underline font-medium"
                >
                  Contact support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  const averageScore = analytics?.averageScore || 0;
  const rating = averageScore > 0 ? (averageScore / 100) * 5 : 5.0;

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 dark:text-green-400";
    if (rating >= 3.5) return "text-blue-600 dark:text-blue-400";
    if (rating >= 2.5) return "text-orange-500 dark:text-orange-400";
    if (rating >= 1.5) return "text-crimson-600 dark:text-crimson-400";
    return "text-red-600 dark:text-red-400";
  };

  const statsData = [
    {
      name: "Total Requests",
      stat: analytics?.totalRequests || 0,
      change: "+12.5%",
      changeType: "positive" as const,
      icon: Package,
    },
    {
      name: "Accepted",
      stat: analytics?.acceptedRequests || 0,
      change: "+8.2%",
      changeType: "positive" as const,
      icon: CheckCircle2,
    },
    {
      name: "Rejected",
      stat: analytics?.rejectedRequests || 0,
      change: "-3.1%",
      changeType: "negative" as const,
      icon: XCircle,
    },
    {
      name: "Pending",
      stat: analytics?.pendingRequests || 0,
      change: "+5.4%",
      changeType: "positive" as const,
      icon: Clock,
    },
    {
      name: "Average Score",
      stat: rating.toFixed(1),
      change: "+2.3%",
      changeType: "positive" as const,
      suffix: "/5.0",
      ratingColor: getRatingColor(rating),
      rating: rating,
      icon: Star,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8  w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Hello, {farmer?.full_name.split(" ")[0]}! 👋
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your farm activity and produce submissions
          </p>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          size="lg"
          className="w-full sm:w-auto shadow-sm"
        >
          <Plus className="mr-2 h-5 w-5" />
          New Request
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 lg:gap-6">
        {statsData.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.name}
              className="relative overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              <CardContent className="p-6 py-0">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      {item.name}
                    </p>
                    <div className="flex items-baseline  gap-4 text-sm">
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            "text-3xl font-bold tracking-tight",
                            item.ratingColor || "text-foreground"
                          )}
                        >
                          {item.stat}
                          {item.suffix && (
                            <span className="text-base text-muted-foreground ml-1 font-medium">
                              {item.suffix}
                            </span>
                          )}
                        </span>
                      </div>

                      {item.name === "Average Score" && (
                        <div className="flex items-center gap-0.5 pt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                "h-3.5 w-3.5",
                                i < Math.floor(item.rating || 0)
                                  ? "fill-orange-400 text-orange-400"
                                  : "fill-none text-muted-foreground/30"
                              )}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-secondary/40 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Submissions Table */}
      <Card className="shadow-sm pt-0">
        <CardHeader className="border-b pt-6 pb-0 bg-muted/30">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-md">Produce Submissions</CardTitle>
              <CardDescription>
                Track and manage all your produce requests
              </CardDescription>
            </div>
            <Tabs
              value={selectedStatus}
              onValueChange={setSelectedStatus}
              className="w-full sm:w-auto"
            >
              <TabsList className="grid border border-muted-foreground/10 w-full grid-cols-4 sm:w-auto">
                <TabsTrigger value="all" className="text-xs sm:text-sm">
                  All
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs sm:text-sm">
                  Pending
                </TabsTrigger>
                <TabsTrigger value="accepted" className="text-xs sm:text-sm">
                  Accepted
                </TabsTrigger>
                <TabsTrigger value="rejected" className="text-xs sm:text-sm">
                  Rejected
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="px-4">
          <Tabs value={selectedStatus}>
            <TabsContent value={selectedStatus} className="m-0">
              {requestsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center space-y-3">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Loading requests...
                    </p>
                  </div>
                </div>
              ) : (
                <RequestsTable
                  requests={requestsData?.data || []}
                  isLoading={false}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create Request Dialog */}
      <CreateProduceRequestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        farmer={farmer}
      />
    </div>
  );
}
