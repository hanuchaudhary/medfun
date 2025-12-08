"use client";

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
  const handleChange = (field: keyof SocialLinks, newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="grid md:grid-cols-3 grid-cols-1 md:divide-x divide-y">
      <div>
        <Input
          id="twitter"
          type="url"
          className="lowercase"
          placeholder="https://twitter.com/yourtoken"
          value={value.twitter}
          onChange={(e) => handleChange("twitter", e.target.value)}
        />
      </div>
      <div>
        <Input
          className="lowercase"
          id="telegram"
          type="url"
          placeholder="https://t.me/yourtoken"
          value={value.telegram}
          onChange={(e) => handleChange("telegram", e.target.value)}
        />
      </div>
      <div>
        <Input
          className="lowercase"
          id="website"
          type="url"
          placeholder="https://yourtoken.com"
          value={value.website}
          onChange={(e) => handleChange("website", e.target.value)}
        />
      </div>
    </div>
  );
}
