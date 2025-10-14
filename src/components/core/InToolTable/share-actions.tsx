"use client";

import { useState } from "react";
import {
  Share2,
  Code,
  Link2,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Instagram,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandInstagramFilled,
  IconBrandLinkedin,
  IconBrandX,
} from "@tabler/icons-react";

interface ShareActionsProps {
  slug: string;
  title: string;
  summary?: string;
}

export function ShareActions({ slug, title, summary = "" }: ShareActionsProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [embedDialogOpen, setEmbedDialogOpen] = useState(false);
  const [sharePopoverOpen, setSharePopoverOpen] = useState(false);

  const baseUrl =
    process.env.NEXT_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000";
  const fullUrl = `${baseUrl}/newsroom/${slug}`;

  // Generate embed code
  const embedCode = `<iframe src="${fullUrl}" width="100%" height="600" frameborder="0" scrolling="auto" title="${title.replace(
    /"/g,
    "&quot;"
  )}"></iframe>`;

  // Social sharing URLs
  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      fullUrl
    )}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(
      fullUrl
    )}&text=${encodeURIComponent(title)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
      fullUrl
    )}`,
  };

  const copyToClipboard = async (text: string, type: "link" | "embed") => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === "link") {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      } else {
        setCopiedEmbed(true);
        setTimeout(() => setCopiedEmbed(false), 2000);
      }
      toast.success("Copied!", {
        description: `${
          type === "link" ? "Link" : "Embed code"
        } copied to clipboard`,
      });
    } catch (err) {
      toast.error("Error", {
        description: "Failed to copy to clipboard",
      });
    }
  };

  const openSocialShare = (platform: keyof typeof shareUrls) => {
    window.open(
      shareUrls[platform],
      "_blank",
      "width=600,height=400,scrollbars=yes,resizable=yes"
    );
    setSharePopoverOpen(false);
  };

  const handleInstagramShare = () => {
    copyToClipboard(fullUrl, "link");
    toast.success("Link copied!", {
      description:
        "Instagram doesn't support direct sharing. Link copied to clipboard - paste it in your Instagram post.",
    });
    setSharePopoverOpen(false);
  };

  const handleCopyLink = () => {
    copyToClipboard(fullUrl, "link");
    setSharePopoverOpen(false);
  };

  const handleEmbedClick = () => {
    setEmbedDialogOpen(true);
    setSharePopoverOpen(false);
  };

  return (
    <>
      <Popover open={sharePopoverOpen} onOpenChange={setSharePopoverOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="h-9 px-3">
            <Share2 className="h-3 w-3 text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-60 p-0" align="end">
          <div className="p-4">
            <h4 className="font-medium text-sm mb-3">
              Share this press release
            </h4>

            {/* Social Media Section */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Social Media
                </Label>
                <div className="mt-2 flex flex-row gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className=" flex-col gap-1 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => openSocialShare("facebook")}
                  >
                    <div className="w-5 h-5 rounded bg-[#1877f2] flex items-center justify-center">
                      <IconBrandFacebook className="w-3 h-3 text-white" />
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className=" flex-col gap-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                    onClick={() => openSocialShare("twitter")}
                  >
                    <div className="w-5 h-5 rounded bg-black dark:bg-white flex items-center justify-center">
                      <IconBrandX className="w-3 h-3 text-white dark:text-black" />
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className=" flex-col gap-1 hover:bg-blue-50 dark:hover:bg-blue-950"
                    onClick={() => openSocialShare("linkedin")}
                  >
                    <div className="w-5 h-5 rounded bg-[#0077b5] flex items-center justify-center">
                      <IconBrandLinkedin className="w-3 h-3 text-white" />
                    </div>
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className=" flex-col gap-1 hover:bg-pink-50 dark:hover:bg-pink-950"
                    onClick={handleInstagramShare}
                  >
                    <div className="w-5 h-5 rounded bg-gradient-to-br from-purple-600 via-pink-600 to-orange-400 flex items-center justify-center">
                      <IconBrandInstagram className="w-3 h-3 text-white" />
                    </div>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div>
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Quick Actions
                </Label>
                <div className="space-y-2 mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9"
                    onClick={handleCopyLink}
                  >
                    {copiedLink ? (
                      <Check className="w-4 h-4 mr-3 text-green-600" />
                    ) : (
                      <Link2 className="w-4 h-4  text-muted-foreground" />
                    )}
                    {copiedLink ? "Link copied!" : "Copy link"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start h-9"
                    onClick={handleEmbedClick}
                  >
                    <Code className="w-4 h-4  text-muted-foreground" />
                    Get embed code
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Embed Dialog */}
      <Dialog open={embedDialogOpen} onOpenChange={setEmbedDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Embed This Press Release</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium">Preview</Label>
              <div className="mt-2 border rounded-lg p-4 bg-muted/30">
                <iframe
                  src={fullUrl}
                  width="100%"
                  height="300"
                  frameBorder="0"
                  scrolling="auto"
                  title={title}
                  className="rounded border bg-background"
                />
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Embed Code</Label>
              <div className="mt-2 relative">
                <Textarea
                  value={embedCode}
                  readOnly
                  className="font-mono text-sm resize-none pr-20 bg-muted/30"
                  rows={4}
                />
                <Button
                  onClick={() => copyToClipboard(embedCode, "embed")}
                  className="absolute top-2 right-2"
                  size="sm"
                  variant="secondary"
                >
                  {copiedEmbed ? (
                    <>
                      <Check className="w-4 h-4 mr-1" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-1 bg-muted/30 p-3 rounded-lg">
              <p className="font-medium">How to use:</p>
              <p>• Copy and paste this code into your website's HTML</p>
              <p>• You can adjust the width and height attributes as needed</p>
              <p>
                • The iframe will automatically adapt to your site's styling
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
