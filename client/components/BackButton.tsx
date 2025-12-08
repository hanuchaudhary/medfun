"use client";

import { IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import React from "react";

export default function BackButton({ href }: { href?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        href ? router.push(href) : router.back();
      }}
      className="fixed top-8 left-6 z-50 group cursor-pointer"
    >
      <IconArrowLeft className="size-5 dark:hover:text-primary hover:text-primary transition-colors dark:text-neutral-600 text-neutral-400 font-thin" />
    </button>
  );
}
