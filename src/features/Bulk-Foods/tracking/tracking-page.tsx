"use client";
import React from "react";
import {
  MapPin,
  Package,
  Truck,
  Clock,
  Phone,
  User,
  ArrowLeft,
  Star,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface TrackingPageProps {
  requestId?: string;
}

const TrackingPage: React.FC<TrackingPageProps> = ({ requestId }) => {
  const router = useRouter();

  // Mock data
  const trackingData = {
    orderId: requestId || "BT-2024-001",
    status: "out_for_delivery",
    aggregator: "Gbendan Company Limited",
    location: "Igbogbo LGA, Ikorodu",
    dispatch: {
      name: "John Adebayo",
      phone: "+234 801 234 5678",
      vehicle: "Truck",
      vehicleNumber: "LAG-123-XY",
      rating: 4.8,
    },
    estimatedArrival: "2:30 PM",
    currentLocation: "5.2 km away",
    items: [
      { name: "Yam", quantity: 200, unit: "kg" },
      { name: "Cassava", quantity: 500, unit: "kg" },
      { name: "Rice", quantity: 300, unit: "kg" },
    ],
    timeline: [
      {
        status: "Order Accepted",
        time: "10:30 AM",
        completed: true,
      },
      {
        status: "Preparing for Dispatch",
        time: "11:00 AM",
        completed: true,
      },
      {
        status: "Out for Delivery",
        time: "12:15 PM",
        completed: true,
      },
      {
        status: "Delivered",
        time: "Est. 2:30 PM",
        completed: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">Back</span>
            </button>
            <div className="text-right">
              <p className="text-xs text-gray-500">Order ID</p>
              <p className="text-sm font-semibold text-gray-900">
                {trackingData.orderId}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="grid lg:grid-cols-3 gap-3">
          {/* Main Content - Map Area */}
          <div className="lg:col-span-2 space-y-3">
            {/* Compact Map */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-[280px] sm:h-[450px] bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Live Tracking Map</p>
                  <p className="text-gray-500 text-xs mt-1">
                    Map integration coming soon
                  </p>
                </div>

                {/* Compact Floating Status */}
                <div className="absolute top-2 left-2 right-2 bg-white rounded-lg shadow-lg p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Truck className="w-4 h-4 text-green-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm truncate">
                          Out for Delivery
                        </p>
                        <p className="text-xs text-gray-600">
                          {trackingData.currentLocation}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-500">ETA</p>
                      <p className="font-semibold text-gray-900 text-sm">
                        {trackingData.estimatedArrival}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <Package className="w-4 h-4 text-green-600" />
                Order Items
              </h2>
              <div className="space-y-1.5">
                {trackingData.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-1.5 border-b last:border-b-0 text-sm"
                  >
                    <span className="text-gray-900 font-medium">
                      {item.name}
                    </span>
                    <span className="text-gray-600">
                      {item.quantity} {item.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Compact Sidebar */}
          <div className="space-y-3">
            {/* Compact Dispatch Rider */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-2.5">
                Dispatch Rider
              </h2>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {trackingData.dispatch.name}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-gray-600">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{trackingData.dispatch.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {trackingData.dispatch.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600">
                    <Truck className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">
                      {trackingData.dispatch.vehicle} -{" "}
                      {trackingData.dispatch.vehicleNumber}
                    </span>
                  </div>
                </div>

                <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-sm">
                  <Phone className="w-4 h-4" />
                  Call Rider
                </button>
              </div>
            </div>

            {/* Compact Timeline */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-2.5 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-green-600" />
                Timeline
              </h2>
              <div className="space-y-2.5">
                {trackingData.timeline.map((event, index) => (
                  <div key={index} className="flex gap-2">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                          event.completed ? "bg-green-600" : "bg-gray-200"
                        }`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${
                            event.completed ? "bg-white" : "bg-gray-400"
                          }`}
                        />
                      </div>
                      {index < trackingData.timeline.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            event.completed ? "bg-green-600" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-1 min-w-0">
                      <p
                        className={`font-medium text-xs truncate ${
                          event.completed ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {event.status}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Compact Aggregator Info */}
            <div className="bg-white rounded-lg shadow-sm p-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">
                Delivery To
              </h2>
              <div className="space-y-1">
                <p className="font-medium text-gray-900 text-sm">
                  {trackingData.aggregator}
                </p>
                <p className="text-xs text-gray-600 flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>{trackingData.location}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingPage;
