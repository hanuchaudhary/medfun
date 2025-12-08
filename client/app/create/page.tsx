"use client";

import { useState, useRef } from "react";
import { TokenCreationForm } from "@/components/create/token-creation-form";

export default function CreateTokenPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const dragCounter = useRef(0);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDraggedImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  return (
    <div
      className="relative w-full px-6 py-4  "
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm pointer-events-none"
          style={{ pointerEvents: "none" }}
        >
          <div className="border-4 border-dashed border-primary rounded-lg p-12 bg-background/50">
            <div className="flex flex-col items-center gap-4">
              <div className="text-6xl">📁</div>
              <p className="text-2xl font-bold">Drop your image here</p>
              <p className="text-muted-foreground">
                Release to upload as token image
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-6 md:px-0 px-4">
        <TokenCreationForm
          draggedImage={draggedImage}
          onImageUsed={() => setDraggedImage(null)}
        />
      </div>
    </div>
  );
}
