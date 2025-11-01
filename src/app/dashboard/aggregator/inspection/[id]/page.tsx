/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Leaf,
  User2,
  Phone,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Package,
  CheckCircle,
  XCircle,
  Save,
  Send,
  Loader,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { PolarAngleAxis, RadialBar, RadialBarChart } from "recharts";
import { ChartConfig, ChartContainer } from "@/components/ui/chart";
import clsx from "clsx";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import { useParams } from "next/navigation";
import ProceedsViewer from "@/features/Aggregators/dialogs/ProceedsViewer";
import { toast } from "sonner";
import Link from "next/link";
import { IconArrowLeft } from "@tabler/icons-react";

type Product = {
  id: number;
  name: string;
  submittedQty: number;
  unit: string;
  price: number;
  rejectedQty: number;
};

type InspectionStats = {
  totalSubmitted: number;
  totalRejected: number;
  totalAccepted: number;
  overallScore: number;
  totalSubmittedValue: number;
  totalAcceptedValue: number;
};

const formatNaira = (amount: number): string => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getScoreColor = (score: number): string => {
  if (score >= 90) return "hsl(142.1 76.2% 36.3%)";
  if (score >= 75) return "hsl(221.2 83.2% 53.3%)";
  if (score >= 60) return "hsl(37.7 92.1% 50.2%)";
  return "hsl(0 84.2% 60.2%)";
};

function InspectionPage() {
  const params = useParams();
  const aggregatorId = params?.id ? parseInt(params.id as string) : null;

  const {
    submissions,
    submissionsLoading,
    submissionsError,
    updateSubmissionMutation,
    isUpdating,
  } = useSubmissions(aggregatorId as number, true);

  const [showProceedsViewer, setShowProceedsViewer] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Effect hook to transform submission data into product format
   * Loads existing inspection data if available
   */
  useEffect(() => {
    if (submissions && submissions.length > 0) {
      const submission = submissions[0];
      setCurrentSubmission(submission);

      if (submission.produce && submission.produce.length > 0) {
        const transformedProducts: Product[] = submission.produce.map(
          (produce: any, index: number) => ({
            id: produce.id || index,
            name: produce.product_name || "Unknown Product",
            submittedQty: produce.quantity || 0,
            unit: produce.unit_measure || "kg",
            price: produce.unit_price || 0,
            // Load existing rejected quantity if available, otherwise default to 0
            rejectedQty: produce.rejected || 0,
          })
        );
        setProducts(transformedProducts);
      }
    }
  }, [submissions]);

  const handleRejectedQtyChange = useCallback((id: number, value: string) => {
    const numValue = parseInt(value) || 0;
    setProducts((prevProducts) =>
      prevProducts.map((p) => {
        if (p.id === id) {
          const clamped = Math.max(0, Math.min(numValue, p.submittedQty));
          return { ...p, rejectedQty: clamped };
        }
        return p;
      })
    );
  }, []);

  const stats: InspectionStats = useMemo(() => {
    const totalSubmitted = products.reduce((sum, p) => sum + p.submittedQty, 0);
    const totalRejected = products.reduce((sum, p) => sum + p.rejectedQty, 0);
    const totalAccepted = totalSubmitted - totalRejected;
    const overallScore =
      totalSubmitted > 0 ? (totalAccepted / totalSubmitted) * 100 : 0;

    const totalSubmittedValue = products.reduce(
      (sum, p) => sum + p.submittedQty * p.price,
      0
    );
    const totalAcceptedValue = products.reduce(
      (sum, p) => sum + (p.submittedQty - p.rejectedQty) * p.price,
      0
    );

    return {
      totalSubmitted,
      totalRejected,
      totalAccepted,
      overallScore,
      totalSubmittedValue,
      totalAcceptedValue,
    };
  }, [products]);

  /**
   * Handles saving inspection data
   * Updates both the farmer_requests table and individual farmer_produce records
   */
  const handleSave = useCallback(async () => {
    if (!currentSubmission || !aggregatorId) {
      console.error("Missing submission data");
      toast.error("Missing submission data");
      return;
    }

    setIsSaving(true);

    try {
      // Prepare produce inspection data
      const produceInspections = products.map((product) => {
        const acceptedQty = product.submittedQty - product.rejectedQty;
        const score =
          product.submittedQty > 0
            ? (acceptedQty / product.submittedQty) * 100
            : 0;

        return {
          produceId: product.id,
          rejected: product.rejectedQty,
          accepted: acceptedQty,
          score: parseFloat(score.toFixed(2)),
        };
      });

      const inspectionData = {
        requestId: currentSubmission.id,
        status: "inspected",
        score: parseFloat(stats.overallScore.toFixed(2)),
        accepted: stats.totalAccepted,
        rejected: stats.totalRejected,
        inspectionDate: new Date().toISOString().split("T")[0],
        inspectionTime: new Date().toTimeString().split(" ")[0],
        produceInspections,
      };

      console.log("Saving inspection data:", inspectionData);

      updateSubmissionMutation(inspectionData);
    } catch (error) {
      console.error("Error saving inspection:", error);
      toast.error("Failed to save inspection data");
    } finally {
      setIsSaving(false);
    }
  }, [
    currentSubmission,
    aggregatorId,
    stats,
    products,
    updateSubmissionMutation,
  ]);

  /**
   * Opens the ProceedsViewer dialog for assigning produce to bulk traders
   * Saves inspection first, then opens the dialog
   */
  const handleAssignToBulkFoods = useCallback(async () => {
    if (!currentSubmission || !aggregatorId) {
      toast.error("Missing submission data");
      return;
    }

    setIsSaving(true);

    try {
      // Prepare produce inspection data
      const produceInspections = products.map((product) => {
        const acceptedQty = product.submittedQty - product.rejectedQty;
        const score =
          product.submittedQty > 0
            ? (acceptedQty / product.submittedQty) * 100
            : 0;

        return {
          produceId: product.id,
          rejected: product.rejectedQty,
          accepted: acceptedQty,
          score: parseFloat(score.toFixed(2)),
        };
      });

      const inspectionData = {
        requestId: currentSubmission.id,
        status: "inspected",
        score: parseFloat(stats.overallScore.toFixed(2)),
        accepted: stats.totalAccepted,
        rejected: stats.totalRejected,
        inspectionDate: new Date().toISOString().split("T")[0],
        inspectionTime: new Date().toTimeString().split(" ")[0],
        produceInspections,
      };

      console.log("Saving inspection before assignment:", inspectionData);

      // Wait for the mutation to complete
      updateSubmissionMutation(inspectionData, {
        onSuccess: () => {
          // Open dialog only after successful save
          setShowProceedsViewer(true);
        },
        onError: () => {
          toast.error("Failed to save inspection. Please try again.");
        },
      });
    } catch (error) {
      console.error("Error saving inspection:", error);
      toast.error("Failed to save inspection data");
    } finally {
      setIsSaving(false);
    }
  }, [
    currentSubmission,
    aggregatorId,
    stats,
    products,
    updateSubmissionMutation,
  ]);

  const chartConfig = {
    progress: {
      label: "Progress",
      color: "var(--primary)",
    },
  } satisfies ChartConfig;

  if (submissionsLoading) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading submission data...</p>
        </div>
      </div>
    );
  }

  if (submissionsError || !currentSubmission) {
    return (
      <div className="p-4 sm:p-6 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-3">
          <p className="text-red-600 font-semibold">Error loading submission</p>
          <p className="text-muted-foreground">{"No submission found"}</p>
        </div>
      </div>
    );
  }

  const farmerInfo = currentSubmission.farmer_info || {};

  return (
    <>
      <ProceedsViewer
        submission={currentSubmission as Submission}
        aggregatorId={aggregatorId as number}
        open={showProceedsViewer}
        onClose={() => setShowProceedsViewer(false)}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className=" items-center flex gap-4">
            <Link
              className="bg-accent p-2 rounded-full text-primary"
              href={"/dashboard/aggregator/submissions"}
            >
              <IconArrowLeft />
            </Link>
            <div className="w-full sm:w-auto">
              <h1 className="text-xl sm:text-2xl font-bold">
                Produce Inspection
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Review and validate farmer submissions
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Button
              onClick={handleSave}
              variant="outline"
              className="gap-2 text-sm w-full sm:w-auto"
              disabled={isSaving || isUpdating}
            >
              {isSaving || isUpdating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Saving...</span>
                  <span className="sm:hidden">Save...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span className="hidden sm:inline">Save Inspection</span>
                  <span className="sm:hidden">Save</span>
                </>
              )}
            </Button>

            <Button
              onClick={handleAssignToBulkFoods}
              className="gap-2 bg-primary hover:bg-primary/90 text-sm w-full sm:w-auto"
              disabled={isSaving || isUpdating}
            >
              {isSaving || isUpdating ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Processing...</span>
                  <span className="sm:hidden">Wait...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span className="hidden sm:inline">Assign to Bulk Foods</span>
                  <span className="sm:hidden">Assign</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 rounded-2xl ring-4 ring-primary/10 border-primary/40 border bg-gradient-to-b from-[#f5f5f5] to-accent p-4 sm:p-5">
            <div className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 sm:h-11 w-10 sm:w-11 items-center justify-center rounded-lg bg-[rgba(143,198,69,0.2)] flex-shrink-0">
                    <Leaf className="text-green-700" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold mb-1 truncate">
                      {farmerInfo.farm_cluster_name || "Farm Name"}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      {farmerInfo.state || "State"}, Nigeria
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <User2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="font-medium truncate">
                      {farmerInfo.full_name || "Unknown"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {farmerInfo.contact_information || "N/A"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      {farmerInfo.local_gov_area || "Location not available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">
                      Submitted:{" "}
                      {currentSubmission.submitted_at
                        ? new Date(
                            currentSubmission.submitted_at
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Card className="p-0 col-span-1 gap-0">
            <CardContent className="p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative flex items-center justify-center flex-shrink-0">
                  <ChartContainer
                    config={chartConfig}
                    className="h-20 w-20 sm:h-[80px] sm:w-[80px]"
                  >
                    <RadialBarChart
                      data={[{ progress: stats.overallScore }]}
                      innerRadius={30}
                      outerRadius={60}
                      barSize={6}
                      startAngle={90}
                      endAngle={-270}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, 100]}
                        angleAxisId={0}
                        tick={false}
                        axisLine={false}
                      />
                      <RadialBar
                        dataKey="progress"
                        background
                        cornerRadius={10}
                        fill={getScoreColor(stats.overallScore)}
                        angleAxisId={0}
                      />
                    </RadialBarChart>
                  </ChartContainer>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="text-sm sm:text-base font-medium"
                      style={{ color: getScoreColor(stats.overallScore) }}
                    >
                      {stats.overallScore.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-left">
                  <dd className="text-base sm:text-base font-medium text-foreground">
                    {stats.totalAccepted} / {stats.totalSubmitted}
                  </dd>
                  <dt className="text-xs sm:text-sm text-muted-foreground">
                    Overall Score
                  </dt>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex border-t border-border p-0 px-3 sm:px-4 py-2 sm:py-3">
              <div className="space-y-2 sm:space-y-3 flex flex-col sm:flex-row justify-between w-full items-center gap-2 sm:gap-4">
                <p className="text-xs text-muted-foreground">
                  Quality acceptance rate
                </p>
                <div className="flex items-center gap-3 sm:gap-4 text-xs">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Accepted</span>
                    <span className="font-semibold text-primary ml-2">
                      {stats.totalAccepted}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-between">
                    <span className="text-muted-foreground">Rejected</span>
                    <span className="font-semibold text-red-600 ml-2">
                      {stats.totalRejected}
                    </span>
                  </div>
                </div>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-100 flex-shrink-0">
                <Package className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Submitted Value
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold truncate">
              {formatNaira(stats.totalSubmittedValue)}
            </p>
          </div>

          <div className="rounded-xl border bg-card p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-green-100 flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Accepted Value
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-primary truncate">
              {formatNaira(stats.totalAcceptedValue)}
            </p>
          </div>
        </div>

        <div className="rounded-xl border p-3 sm:p-5 bg-card shadow-sm overflow-hidden">
          <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
            <Table className="border !rounded-2xl mb-3 text-xs sm:text-sm">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px] sm:w-[200px] pl-2 sm:pl-4">
                    Product
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Qty
                  </TableHead>
                  <TableHead className="text-center whitespace-nowrap">
                    Unit
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap">
                    Price
                  </TableHead>
                  <TableHead className="text-right whitespace-nowrap hidden sm:table-cell">
                    Total
                  </TableHead>

                  <TableHead className="bg-red-50 text-center border-l-2 border-red-200 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
                      <span className="text-red-600 font-semibold hidden sm:inline">
                        Rejected
                      </span>
                      <span className="text-red-600 font-semibold sm:hidden">
                        Rej
                      </span>
                    </div>
                  </TableHead>

                  <TableHead className="bg-primary/5 text-center border-l border-primary/10 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                      <span className="text-primary font-semibold hidden sm:inline">
                        Accepted
                      </span>
                      <span className="text-primary font-semibold sm:hidden">
                        Acc
                      </span>
                    </div>
                  </TableHead>

                  <TableHead className="bg-blue-50 text-center border-l border-blue-200 whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Award className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      <span className="text-blue-600 font-semibold hidden sm:inline">
                        Score
                      </span>
                      <span className="text-blue-600 font-semibold sm:hidden">
                        %
                      </span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {products.map((product, index) => {
                  const acceptedQty =
                    product.submittedQty - product.rejectedQty;

                  const score =
                    product.submittedQty > 0
                      ? (acceptedQty / product.submittedQty) * 100
                      : 0;

                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-semibold flex items-center px-2 sm:px-4 gap-2 py-2 sm:py-3">
                        <div
                          className={clsx(
                            "w-2 h-2 bg-blue-500 rounded-full flex-shrink-0",
                            [
                              "bg-red-500",
                              "bg-green-500",
                              "bg-orange-400",
                              "bg-purple-500",
                              "bg-pink-500",
                            ][index]
                          )}
                        ></div>
                        <span className="truncate text-xs sm:text-sm">
                          {product.name}
                        </span>
                      </TableCell>

                      <TableCell className="text-center font-semibold py-2 sm:py-3">
                        {product.submittedQty}
                      </TableCell>

                      <TableCell className="text-center text-muted-foreground py-2 sm:py-3">
                        {product.unit}
                      </TableCell>

                      <TableCell className="text-right font-semibold py-2 sm:py-3 text-xs sm:text-sm">
                        {formatNaira(product.price)}
                      </TableCell>

                      <TableCell className="text-right font-bold py-2 sm:py-3 hidden sm:table-cell text-xs sm:text-sm">
                        {formatNaira(product.price * product.submittedQty)}
                      </TableCell>

                      <TableCell className="bg-red-50/50 border-l-2 border-red-200 py-2 sm:py-3 px-1 sm:px-2">
                        <Input
                          type="number"
                          min="0"
                          max={product.submittedQty}
                          value={product.rejectedQty}
                          onChange={(e) =>
                            handleRejectedQtyChange(product.id, e.target.value)
                          }
                          className="w-16 sm:w-24 text-center font-semibold border-red-300 focus:border-red-500 focus:ring-red-500 text-xs sm:text-sm py-1 h-auto"
                          aria-label={`Rejected quantity for ${product.name}`}
                        />
                      </TableCell>

                      <TableCell className="bg-primary/5 text-center border-l border-primary/10 py-2 sm:py-3 px-1 sm:px-2">
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-700 border-green-300 font-bold text-xs px-2 py-1 w-full justify-center"
                        >
                          {acceptedQty}
                        </Badge>
                      </TableCell>

                      <TableCell className="bg-blue-50/50 text-center border-l border-blue-200 py-2 sm:py-3 px-1 sm:px-2">
                        <Badge
                          variant="outline"
                          className={`font-bold text-xs px-2 py-1 w-full justify-center ${
                            score >= 90
                              ? "bg-green-100 text-green-700 border-green-300"
                              : score >= 75
                              ? "bg-blue-100 text-blue-700 border-blue-300"
                              : score >= 60
                              ? "bg-amber-100 text-amber-700 border-amber-300"
                              : "bg-red-100 text-red-700 border-red-300"
                          }`}
                        >
                          {score.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="bg-muted/30 mt-2 sm:mt-1 border rounded-2xl p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="text-center">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                  Total Submitted
                </p>
                <p className="text-lg sm:text-xl font-bold">
                  {stats.totalSubmitted}
                </p>
              </div>

              <div className="text-center border-t sm:border-t-0 sm:border-x pt-4 sm:pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                  Total Accepted
                </p>
                <p className="text-lg sm:text-xl font-bold text-primary">
                  {stats.totalAccepted}
                </p>
              </div>

              <div className="text-center border-t sm:border-t-0 pt-4 sm:pt-0">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2">
                  Total Rejected
                </p>
                <p className="text-lg sm:text-xl font-bold text-red-600">
                  {stats.totalRejected}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default InspectionPage;
