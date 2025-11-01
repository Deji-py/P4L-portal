import { Button } from "@/components/ui/button";
import ProduceCheckViewer from "@/features/Aggregators/dialogs/ProduceCheckViewer";
import { Submission, useSubmissions } from "@/hooks/aggregators/useSubmissions";
import clsx from "clsx";
import { useState } from "react";

interface SubmissionCardProps {
  submission: Submission;
}

function SubmissionCard({ submission }: SubmissionCardProps) {
  const [showProceeds, setShowProceeds] = useState(false);
  const { handleApproveSubmission, handleRejectSubmission, isUpdating } =
    useSubmissions(submission.aggregator_id as number);

  const produceItems = submission.produce || [];
  const displayedProduce = produceItems.slice(0, 3);

  return (
    <>
      <ProduceCheckViewer
        open={showProceeds}
        onClose={() => setShowProceeds(false)}
        data={submission}
        onApprove={(requestId, selectedDate, selectedTime) =>
          handleApproveSubmission(requestId, selectedDate, selectedTime)
        }
        onReject={(requestId, reason) =>
          handleRejectSubmission(requestId, reason)
        }
        isUpdating={isUpdating}
      />
      <div className="bg-[#F5F5F5] border flex-none p-4 h-[160px] w-xs rounded-2xl">
        <div className="flex items-center gap-3 justify-between">
          <div className=" flex items-center gap-3">
            <div className="w-11 flex-none h-11 flex flex-col justify-center items-center bg-[rgba(143,198,69,0.2)] rounded-lg">
              <svg
                width="31"
                height="25"
                viewBox="0 0 31 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M24.9726 15.3225C23.7988 16.036 22.4506 16.4113 21.077 16.4069C19.9261 16.3978 18.7884 16.1624 17.7284 15.7141C16.9115 16.8674 16.4743 18.2466 16.4776 19.66V23.2692C16.4779 23.4034 16.4506 23.5363 16.3974 23.6595C16.3441 23.7827 16.2662 23.8937 16.1683 23.9855C16.0704 24.0774 15.9546 24.1481 15.8282 24.1933C15.7019 24.2385 15.5675 24.2572 15.4336 24.2483C15.1819 24.2264 14.9479 24.1102 14.7783 23.9229C14.6087 23.7357 14.5162 23.4912 14.5194 23.2386V21.7161L9.79269 16.9894C9.09006 17.2516 8.34695 17.3887 7.59704 17.3945C6.56463 17.3972 5.55154 17.1147 4.66949 16.5782C2.00264 14.9578 0.567015 11.2286 0.844838 6.59861C0.858826 6.35908 0.960283 6.13302 1.12995 5.96335C1.29961 5.79369 1.52567 5.69223 1.7652 5.67824C6.39518 5.40532 10.1244 6.83604 11.7399 9.5029C12.3746 10.5482 12.6517 11.7718 12.5293 12.9885C12.5217 13.0828 12.4869 13.1729 12.4292 13.2478C12.3715 13.3227 12.2934 13.3794 12.2042 13.4108C12.115 13.4423 12.0186 13.4472 11.9266 13.4251C11.8347 13.4029 11.7511 13.3546 11.6861 13.2859L9.33618 10.8259C9.15107 10.6501 8.90458 10.5535 8.64926 10.5567C8.39395 10.56 8.15001 10.6629 7.96946 10.8434C7.78891 11.024 7.68604 11.2679 7.68277 11.5232C7.6795 11.7785 7.7761 12.025 7.95196 12.2101L14.5463 18.9721C14.5536 18.8767 14.5622 18.7812 14.572 18.687C14.7861 16.8716 15.5871 15.1759 16.8533 13.8575L23.045 7.31458C23.2287 7.13103 23.332 6.882 23.3321 6.6223C23.3322 6.36259 23.2291 6.11347 23.0456 5.92975C22.862 5.74603 22.613 5.64276 22.3533 5.64264C22.0936 5.64253 21.8445 5.74558 21.6608 5.92914L15.6637 12.2713C15.6037 12.3349 15.5277 12.3813 15.4437 12.4056C15.3597 12.4298 15.2707 12.4312 15.186 12.4095C15.1013 12.3877 15.024 12.3437 14.9621 12.282C14.9001 12.2202 14.8559 12.143 14.8339 12.0584C14.2538 9.91902 14.5096 7.78945 15.6172 5.96096C17.8031 2.35294 22.8895 0.421639 29.2244 0.793701C29.4639 0.80769 29.69 0.909147 29.8596 1.07881C30.0293 1.24848 30.1308 1.47453 30.1448 1.71407C30.5119 8.05014 28.5806 13.1366 24.9726 15.3225Z"
                  fill="#136B3B"
                />
              </svg>
            </div>
            <div className="flex-1 ">
              <h3 className=" font-bold text-sm  leading-tight line-clamp-1">
                {submission.farmer_info.full_name || "Farm Name"}
              </h3>
              <p className="text-sm">
                {submission.farmer_info.local_gov_area || "Farm Location"}
              </p>
            </div>
          </div>
          <Button variant="secondary" onClick={() => setShowProceeds(true)}>
            Review
          </Button>
        </div>
        {/* Proceeds */}
        <div className="flex flex-col border-t gap-1 pt-4 mt-2">
          {displayedProduce.length > 0
            ? displayedProduce.map((produce, index) => {
                return (
                  <div
                    className="flex text-sm font-semibold items-center gap-2 "
                    key={produce.id || index}
                  >
                    <div className=" flex items-center justify-between w-full">
                      <div className=" flex items-center gap-2">
                        <div
                          className={clsx(
                            "w-2 h-2 bg-blue-500 rounded-full",
                            [
                              "bg-red-500",
                              "bg-green-500",
                              "bg-orange-400",
                              "bg-purple-500",
                              "bg-pink-500",
                            ][index]
                          )}
                        ></div>
                        <p className="line-clamp-1 ">
                          {produce.product_name || "Cocoa"}
                        </p>
                      </div>
                      <div className="text-sm flex items-center gap-1">
                        <p>{produce.quantity || 0}</p>
                        <p className="line-clamp-1">
                          {produce.unit_measure || "unit"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            : null}
          {produceItems.length > 3 && (
            <p className="text-xs text-gray-500">
              +{produceItems.length - 3} more
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export default SubmissionCard;
