"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SocialLinks {
  twitter: string;
  telegram: string;
  website: string;
}

interface SocialLinksInputProps {
  value: SocialLinks;
  onChange: (value: SocialLinks) => void;
}

export function SocialLinksInput({ value, onChange }: SocialLinksInputProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleChange = (field: keyof SocialLinks, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors"
      >
        <svg
          className={`w-4 h-4 transition-transform ${
            isExpanded ? "rotate-90" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
        Add social links{" "}
        <span className="text-muted-foreground">(Optional)</span>
      </button>

      {isExpanded && (
        <div className="space-y-3">
          <Input
            id="twitter"
            type="url"
            className="lowercase rounded-lg py-0 h-10"
            placeholder="https://twitter.com/yourtoken"
            value={value.twitter}
            onChange={(e) => handleChange("twitter", e.target.value)}
          />
          <Input
            className="lowercase rounded-lg py-0 h-10"
            id="telegram"
            type="url"
            placeholder="https://t.me/yourtoken"
            value={value.telegram}
            onChange={(e) => handleChange("telegram", e.target.value)}
          />
          <Input
            className="lowercase rounded-lg py-0 h-10"
            id="website"
            type="url"
            placeholder="https://yourtoken.com"
            value={value.website}
            onChange={(e) => handleChange("website", e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
