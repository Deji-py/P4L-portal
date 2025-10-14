/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import moment from "moment";
import type React from "react";
import {
  Star,
  Download,
  Mail,
  Phone,
  Check,
  X,
  FileText,
  Info,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  ImageIcon,
  Eye,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import clsx from "clsx";
import { formatCurrency } from "../../../../helpers/formatCurrency";
import { ShareActions } from "./share-actions";
import { CellRendererProps, CellType } from "./types/table.types";
import Image from "next/image";

// Default placeholder images

const DEFAULT_IMAGE =
  "data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23f3f4f6' stroke='%23d1d5db' strokeWidth='1'/%3e%3cpath d='m25 25 50 50m0-50-50 50' stroke='%239ca3af' strokeWidth='2'/%3e%3c/svg%3e";

export const cellRenderers: Record<CellType, React.ComponentType<any>> = {
  text: ({ value }) => (
    <span className="text-sm text-gray-900 dark:text-gray-100 truncate whitespace-nowrap">
      {value?.toString() || (
        <span className="text-gray-400 dark:text-gray-500">—</span>
      )}
    </span>
  ),

  category: ({ value }) => (
    <Badge
      variant="secondary"
      className="bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:text-blue-300 dark:border-blue-700/30 font-medium"
    >
      {value || "—"}
    </Badge>
  ),

  number: ({ value }) => (
    <span className="font-mono text-sm text-right whitespace-nowrap text-gray-900 dark:text-gray-100 bg-accent dark:bg-gray-800/30 px-2 py-1 rounded-md border">
      {typeof value === "number" ? value.toLocaleString() : value || "—"}
    </span>
  ),

  currency: ({ value }) => (
    <span className="font-mono text-sm font-semibold text-right whitespace-nowrap text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md border border-green-200 dark:border-green-700/30">
      {formatCurrency(value) || "—"}
    </span>
  ),

  percentage: ({ value }) => (
    <div className="flex items-center gap-2">
      <div className="w-12 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-300"
          style={{
            width: `${
              typeof value === "number" ? Math.min(value * 100, 100) : 0
            }%`,
          }}
        />
      </div>
      <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
        {typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "—"}
      </span>
    </div>
  ),
  date: ({ value }) => (
    <div className="flex items-center gap-2 text-sm">
      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
      <span className="text-gray-700 dark:text-gray-300 whitespace-nowrap">
        {value ? moment(value).format("MMM DD, YYYY") : "—"}
      </span>
    </div>
  ),

  datetime: ({ value }) => (
    <div className="flex flex-col gap-0.5">
      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
        {value ? moment(value).format("MMM DD, YYYY") : "—"}
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
        {value ? moment(value).format("HH:mm A") : ""}
      </span>
    </div>
  ),

  time: ({ value }) => (
    <span className="text-sm font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border text-gray-700 dark:text-gray-300">
      {value ? moment(value).format("HH:mm A") : ""}
    </span>
  ),

  boolean: ({ value }) => (
    <div className="flex justify-center">
      {value ? (
        <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 px-2 py-1 rounded-full border border-green-200 dark:border-green-700/30">
          <Check className="h-3 w-3" />
          <span className="text-xs font-medium">Yes</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 px-2 py-1 rounded-full border border-red-200 dark:border-red-700/30">
          <X className="h-3 w-3" />
          <span className="text-xs font-medium">No</span>
        </div>
      )}
    </div>
  ),

  badge: ({ value }) => (
    <Badge className="bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:text-purple-300 dark:border-purple-700/30 font-medium shadow-sm">
      {value?.toString() || "—"}
    </Badge>
  ),

  status: ({ value }: { value: string }) => {
    const lower = (value || "").toLowerCase();

    let colorClasses =
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600";
    let icon = <Info className="h-3 w-3" />;

    if (
      lower.includes("active") ||
      lower.includes("success") ||
      lower.includes("completed") ||
      lower.includes("done") ||
      lower.includes("approved") ||
      lower.includes("published")
    ) {
      colorClasses =
        "bg-green-600/20 text-primary  dark:bg-primary dark:text-white dark:border-green-700";
      icon = <CheckCircle className="h-3 w-3" />;
    } else if (
      lower.includes("pending") ||
      lower.includes("warning") ||
      lower.includes("process") ||
      lower.includes("open")
    ) {
      colorClasses =
        "bg-amber-600/20 text-amber-600 border-amber-600 dark:bg-amber-600 dark:text-white dark:border-amber-700";
      icon = <Clock className="h-3 w-3" />;
    } else if (
      lower.includes("error") ||
      lower.includes("failed") ||
      lower.includes("inactive")
    ) {
      colorClasses =
        "bg-red-600/20 text-red-600  dark:bg-red-600 dark:text-white dark:border-red-700";
      icon = <XCircle className="h-3 w-3" />;
    } else if (lower.includes("assigned")) {
      colorClasses =
        "bg-purple-600/20 text-purple-600  dark:bg-purple-600 dark:text-white dark:border-purple-700";
      icon = <XCircle className="h-3 w-3" />;
    }

    return (
      <div
        className={clsx(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full  font-medium text-xs ",
          colorClasses
        )}
      >
        {icon}
        <span>{value?.toString() || "—"}</span>
      </div>
    );
  },

  avatar: ({ value, row }) => {
    const src = typeof value === "object" ? value?.src : value;
    const name = typeof value === "object" ? value?.name : row?.name || "User";
    const initials =
      name
        ?.split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "?";

    return (
      <div className="flex items-center gap-3 group">
        <div className="relative">
          <Avatar className="h-9 w-9 bg-accent shadow-sm transition-transform duration-200 group-hover:scale-105">
            <AvatarImage src={src} alt={name} />
            <AvatarFallback className="text-xs font-semibold  bg-accent ">
              {initials}
            </AvatarFallback>
          </Avatar>
          {src && (
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[120px]">
            {name}
          </span>
          {row?.email && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              {row.email}
            </span>
          )}
        </div>
      </div>
    );
  },

  image: ({ value }) => {
    return (
      <div className="relative group">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-accent   shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:scale-105">
          {!value ? (
            <div className="w-full h-full bg-secondary/30  flex items-center justify-center">
              <ImageIcon className="h-5 w-5 text-secondary-foreground" />
            </div>
          ) : (
            <Image
              src={value}
              alt="Preview"
              width={300}
              height={300}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      </div>
    );
  },

  link: ({ value }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md px-2 py-1"
    >
      <a
        href={value?.startsWith("http") ? value : `https://${value}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 group"
        title={value}
      >
        <ExternalLink className="h-3 w-3 flex-shrink-0 transition-transform group-hover:scale-110" />
        <span className="truncate max-w-[160px] text-sm font-medium">
          {value?.replace(/^https?:\/\//, "") || "—"}
        </span>
      </a>
    </Button>
  ),

  email: ({ value }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-all duration-200 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-md px-2 py-1"
    >
      <a
        href={`mailto:${value}`}
        className="flex items-center gap-2 group"
        title={value}
      >
        <Mail className="h-3 w-3 flex-shrink-0 transition-transform group-hover:scale-110" />
        <span className="truncate max-w-[160px] text-sm font-medium">
          {value || "—"}
        </span>
      </a>
    </Button>
  ),

  phone: ({ value }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-all duration-200 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md px-2 py-1"
    >
      <a
        href={`tel:${value}`}
        className="flex items-center gap-2 group"
        title={value}
      >
        <Phone className="h-3 w-3 flex-shrink-0 transition-transform group-hover:scale-110" />
        <span className="truncate max-w-[140px] text-sm font-medium">
          {value || "—"}
        </span>
      </a>
    </Button>
  ),

  progress: ({ value }) => {
    const progressValue =
      typeof value === "number" ? Math.max(0, Math.min(100, value)) : 0;

    return (
      <div className="w-full min-w-[120px]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Progress
          </span>
          <span className="text-xs font-mono text-gray-600 dark:text-gray-400">
            {progressValue}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500 ease-out shadow-sm"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    );
  },

  rating: ({ value }) => {
    const rating =
      typeof value === "number" ? Math.max(0, Math.min(5, value)) : 0;

    return (
      <div className="flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded-lg border border-yellow-200 dark:border-yellow-700/30">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`h-3.5 w-3.5 transition-colors ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">
          {rating.toFixed(1)}
        </span>
      </div>
    );
  },

  tags: ({ value, row }) => {
    const tagColors = [
      "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700/30",
      "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-700/30",
      "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700/30",
      "bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-300 dark:border-pink-700/30",
      "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700/30",
      "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/20 dark:text-teal-300 dark:border-teal-700/30",
    ];

    const tags = Array.isArray(value)
      ? value
      : typeof value === "string"
      ? value
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    const isDraft = row?.status === "draft";

    if (isDraft) {
      return (
        <span className="text-gray-400 dark:text-gray-500 text-sm italic">
          Draft
        </span>
      );
    }

    if (tags.length === 0) {
      return <span className="text-gray-400 dark:text-gray-500">—</span>;
    }

    return (
      <div className="flex gap-1 max-w-[300px]">
        {tags.slice(0, 1).map((tag, index) => (
          <Badge
            key={index}
            className={clsx(
              "text-xs font-medium px-2 py-0.5 rounded-md border transition-all hover:shadow-sm",
              tagColors[index % tagColors.length]
            )}
          >
            {tag}
          </Badge>
        ))}
        {tags.length > 1 && (
          <Badge className="text-xs font-medium px-2 py-0.5 rounded-md border bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 border-gray-300 dark:border-gray-600">
            +{tags.length - 1}
          </Badge>
        )}
      </div>
    );
  },

  json: ({ value }) => {
    return (
      <div className="group relative">
        <details className="cursor-pointer bg-accent border rounded-lg overflow-hidden">
          <summary className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center gap-2">
            <FileText className="h-3 w-3" />
            View JSON
          </summary>
          <div className="relative">
            <pre className="text-xs bg-muted dark:bg-gray-950 text-gray-100 p-3 overflow-auto max-h-48 max-w-xs border-t">
              {JSON.stringify(value, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    );
  },

  code: ({ value }) => (
    <code className="bg-accent dark:bg-accent text-accent-foreground px-2 py-1 rounded-md text-xs font-mono  max-w-[200px] block truncate">
      {value?.toString() || "—"}
    </code>
  ),

  color: ({ value }) => (
    <div className="flex items-center gap-3 bg-accent px-2 py-1 rounded-lg border">
      <div
        className="w-6 h-6 rounded-md border-2 border-white dark:border-gray-700 shadow-sm"
        style={{ backgroundColor: value || "#000000" }}
      />
      <span className="text-xs font-mono text-gray-700 dark:text-gray-300 uppercase">
        {value || "—"}
      </span>
    </div>
  ),

  file: ({ value }) => {
    const fileName = typeof value === "object" ? value?.name : value;
    const fileUrl = typeof value === "object" ? value?.url : value;
    const extension = fileName?.split(".").pop()?.toLowerCase();

    const isImage = ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(
      extension
    );
    const isPdf = extension === "pdf";

    if (isImage) {
      return (
        <div className="group relative">
          <div className="w-8 h-8 relative rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-sm transition-all group-hover:shadow-md group-hover:scale-105">
            <Image
              layout="fill"
              objectFit="cover"
              src={fileUrl || DEFAULT_IMAGE}
              alt={fileName}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
            <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 bg-accent px-3 py-2 rounded-lg border hover:shadow-sm transition-all group">
        <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <div className="flex flex-col">
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
            {fileName || "Unknown"}
          </span>
          {extension && (
            <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              {extension}
            </span>
          )}
        </div>
        {fileUrl && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            asChild
          >
            <a href={fileUrl} download={fileName}>
              <Download className="h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    );
  },

  custom: ({ value, column, row }) => {
    if (column?.render) {
      return column?.render(value, row);
    }
    return (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {value?.toString() || "—"}
      </span>
    );
  },

  share: ({ value, column, row }: { value?: any; column?: any; row?: any }) => {
    if (column?.render) {
      return column.render(value, row);
    }

    const slug = row?.slug;
    const title = row?.title || "Content";
    const summary = row?.summary || row?.description || "";
    const isDraft = row?.status === "draft";

    if (isDraft) {
      return (
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm italic">Draft</span>
        </div>
      );
    }

    return <ShareActions slug={slug} title={title} summary={summary} />;
  },

  options: ({ value }: { value?: any; column?: any; row?: any }) => {
    return <p>{value}</p>;
  },
  "rich-text": ({ value }: { value?: any; column?: any; row?: any }) => {
    // Strip HTML tags and decode HTML entities
    const stripHTML = (html: string): string => {
      if (!html) return "";

      // Create a temporary div to parse HTML
      const tmp = document.createElement("div");
      tmp.innerHTML = html;

      // Get text content (this strips all HTML tags)
      const text = tmp.textContent || tmp.innerText || "";

      return text.trim();
    };

    // Truncate text if too long for table cell
    const truncateText = (text: string, maxLength: number = 100): string => {
      if (text.length <= maxLength) return text;
      return text.substring(0, maxLength) + "...";
    };

    const cleanText = stripHTML(value);
    const displayText = truncateText(cleanText);

    return (
      <p className="truncate" title={cleanText}>
        {displayText || "—"}
      </p>
    );
  },
};

export function CellRenderer<T>({ value, row, column }: CellRendererProps<T>) {
  const type = column?.type || "text";
  const RendererComponent = cellRenderers[type];

  if (!RendererComponent) {
    return (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {value?.toString() || "—"}
      </span>
    );
  }

  return <RendererComponent value={value} row={row} column={column} />;
}
