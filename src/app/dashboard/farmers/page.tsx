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
  Image,
  Video,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { useFarmerData } from "@/hooks/farmers/useFarmerData";
import useAuth from "@/hooks/useAuth";
import { CreateProduceRequestDialog } from "@/features/farmers/produceRequestDialog";
import { RequestsTable } from "@/features/farmers/requests-table";
import { supabaseClient } from "@/utils/client";

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
  }, [showCompleteProfileDialog]);

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
      // Check if it's a video file
      if (!file.type.startsWith("video/")) {
        setUploadError("Please select a valid video file");
        return;
      }
      // Check file size
      if (file.size > 50 * 1024 * 1024) {
        // 50MB limit
        setUploadError("Video file is too large (max 50MB)");
        return;
      }

      // Check video duration
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
        // 5MB limit
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

      // Get file extension
      const fileExt = selectedFile.name.split(".").pop();
      const timestamp = Date.now();
      const fileName = `${farmer.id}-${timestamp}.${fileExt}`;
      const filePath = `${
        uploadType === "image" ? "farm-images" : "farm-videos"
      }/${fileName}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } =
        await supabaseClient.storage
          .from("farm-media")
          .upload(filePath, selectedFile, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL
      const {
        data: { publicUrl },
      } = supabaseClient.storage.from("farm-media").getPublicUrl(filePath);

      if (!publicUrl) {
        throw new Error("Failed to get public URL for uploaded file");
      }

      // Update farmer profile with the URL using Promise wrapper
      await new Promise<void>((resolve, reject) => {
        updateProfile(
          {
            [uploadType === "image" ? "farm_image_url" : "farm_video_url"]:
              publicUrl,
          },
          {
            onSuccess: () => {
              // Clean up preview URL
              if (previewUrl) {
                URL.revokeObjectURL(previewUrl);
              }
              // Reset state
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
  if (farmerLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen p-6">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading your dashboard...
          </p>
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
        <div className="flex items-center justify-center min-h-screen p-6">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-3">
                <svg
                  className="w-10 h-10 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
              </div>
              <CardTitle className="text-xl">
                Welcome, {farmer?.full_name.split(" ")[0]}!
              </CardTitle>
              <CardDescription className="text-sm mt-2">
                To get started, please upload a photo or video of your farmland
                to complete your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Farm media helps us verify your profile and connect you with
                  the right aggregators in your area.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full"
                onClick={() => setShowCompleteProfileDialog(true)}
              >
                <Upload className="mr-2 h-4 w-4" />
                Complete Your Profile
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Upload Dialog */}
        <Dialog
          open={showCompleteProfileDialog}
          onOpenChange={setShowCompleteProfileDialog}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Farm Media</DialogTitle>
              <DialogDescription>
                Choose to upload either an image or a short video (max 10
                seconds) of your farmland.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!uploadType ? (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setUploadType("image")}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors"
                  >
                    <Image className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="font-medium">Upload Image</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      JPG, PNG (Max 5MB)
                    </span>
                  </button>

                  <button
                    onClick={() => setUploadType("video")}
                    className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg hover:border-primary hover:bg-accent transition-colors"
                  >
                    <Video className="h-12 w-12 text-muted-foreground mb-2" />
                    <span className="font-medium">Upload Video</span>
                    <span className="text-xs text-muted-foreground mt-1">
                      MP4 (Max 10 sec, 50MB)
                    </span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
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
                      Change
                    </Button>
                  </div>

                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
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
                        className="cursor-pointer flex flex-col items-center"
                      >
                        {uploadType === "image" ? (
                          <Image className="h-12 w-12 text-muted-foreground mb-2" />
                        ) : (
                          <Video className="h-12 w-12 text-muted-foreground mb-2" />
                        )}
                        <p className="font-medium">Click to select file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          or drag and drop
                        </p>
                      </label>
                    ) : (
                      <div className="space-y-3">
                        {/* Preview */}
                        {previewUrl && (
                          <div className="rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                            {uploadType === "image" ? (
                              <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-48 object-cover"
                              />
                            ) : (
                              <video
                                src={previewUrl}
                                controls
                                className="w-full h-48 object-cover"
                              >
                                Your browser does not support video preview.
                              </video>
                            )}
                          </div>
                        )}
                        {/* File info */}
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {selectedFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        {/* Change file button */}
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-9 px-3 cursor-pointer"
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

                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCompleteProfileDialog(false)}
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
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload & Continue
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
      <div className="flex items-center justify-center min-h-fit p-6">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-16 h-16 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center mb-3">
              <svg
                className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <CardTitle className="text-xl">Profile Under Review</CardTitle>
            <CardDescription className="text-sm mt-2">
              Your profile is currently being reviewed by our admin team. This
              usually takes 24-48 hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-900/50">
              <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-sm text-yellow-800 dark:text-yellow-200">
                You&apos;ll receive a notification once your profile is approved
                and you can start submitting produce requests.
              </AlertDescription>
            </Alert>

            <div className="pt-2">
              <p className="text-xs text-muted-foreground text-center">
                Need help? Contact support at{" "}
                <a
                  href="mailto:support@farmapp.com"
                  className="text-primary hover:underline"
                >
                  support@farmapp.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main dashboard
  // Convert average score (0-100) to rating (0-5)
  const averageScore = analytics?.averageScore || 0;
  const rating = averageScore > 0 ? (averageScore / 100) * 5 : 5.0;

  // Determine color severity based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600 dark:text-green-400";
    if (rating >= 3.5) return "text-blue-600 dark:text-blue-400";
    if (rating >= 2.5) return "text-yellow-600 dark:text-yellow-400";
    if (rating >= 1.5) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const statsData = [
    {
      name: "Total Requests",
      stat: analytics?.totalRequests || 0,
      change: "+12.5%",
      changeType: "positive",
    },
    {
      name: "Accepted",
      stat: analytics?.acceptedRequests || 0,
      change: "+8.2%",
      changeType: "positive",
    },
    {
      name: "Rejected",
      stat: analytics?.rejectedRequests || 0,
      change: "-3.1%",
      changeType: "negative",
    },
    {
      name: "Pending",
      stat: analytics?.pendingRequests || 0,
      change: "+5.4%",
      changeType: "positive",
    },
    {
      name: "Average Score",
      stat: rating.toFixed(1),
      change: "+2.3%",
      changeType: "positive",
      suffix: "/5.0",
      ratingColor: getRatingColor(rating),
      rating: rating,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Hello, {farmer?.full_name.split(" ")[0]}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Explore your farm activity and produce submissions
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="default">
          <Plus className="mr-2 h-4 w-4" />
          New Request
        </Button>
      </div>

      {/* Stats Grid */}
      <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statsData.map((item) => (
          <Card key={item.name} className="p-6 py-4">
            <CardContent className="p-0">
              <dt className="text-sm font-medium text-muted-foreground">
                {item.name}
              </dt>
              <dd className="mt-2 flex items-baseline space-x-2.5">
                <span
                  className={cn(
                    "text-3xl font-semibold",
                    item.ratingColor || "text-foreground"
                  )}
                >
                  {item.stat}
                  {item.suffix && (
                    <span className="text-sm text-muted-foreground ml-1">
                      {item.suffix}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    item.changeType === "positive"
                      ? "text-green-800 dark:text-green-400"
                      : "text-red-800 dark:text-red-400",
                    "text-sm font-medium"
                  )}
                >
                  {item.change}
                </span>
              </dd>
              {item.name === "Average Score" && (
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={cn(
                        "h-3 w-3",
                        i < Math.floor(item.rating || 0)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </dl>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Produce Submissions</CardTitle>
              <CardDescription className="mt-1">
                Track and manage all your produce requests
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedStatus} onValueChange={setSelectedStatus}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="accepted">Accepted</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedStatus} className="mt-0">
              <RequestsTable
                requests={requestsData?.data || []}
                isLoading={requestsLoading}
              />
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
