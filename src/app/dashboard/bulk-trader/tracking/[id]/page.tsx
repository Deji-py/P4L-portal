import TrackingPage from "@/features/Bulk-Foods/tracking/tracking-page";

// In /app/bulk-trader/tracking/[id]/page.tsx
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const param = await params;
  const id = param?.id;
  return <TrackingPage requestId={id} />;
}
