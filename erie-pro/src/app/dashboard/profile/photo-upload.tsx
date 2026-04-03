"use client";

// ── Photo Upload Component ───────────────────────────────────────────
// Shows current photo or placeholder avatar, with file input for uploading.

import { useState, useRef, type ChangeEvent } from "react";

interface PhotoUploadProps {
  currentPhotoUrl: string | null;
  businessName: string;
}

export function PhotoUpload({ currentPhotoUrl, businessName }: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const initials = businessName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side preview
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setErrorMsg("");

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const res = await fetch("/api/provider/photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error ?? "Failed to upload photo");
        setStatus("error");
        return;
      }

      setPhotoUrl(data.data.photoUrl);
      setPreview(null);
      setStatus("success");

      // Reset file input
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      setErrorMsg("Network error. Please try again.");
      setStatus("error");
    }
  }

  const displayUrl = preview ?? photoUrl;

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
        Profile Photo
      </h2>

      <div className="flex items-center gap-6">
        {/* Avatar / Photo */}
        <div className="shrink-0">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={`${businessName} profile photo`}
              className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
            />
          ) : (
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center border-2 border-gray-200 dark:border-gray-700">
              <span className="text-xl font-bold text-blue-700 dark:text-blue-300">
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="block text-sm text-gray-600 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50 file:cursor-pointer"
          />
          <p className="text-xs text-gray-400 dark:text-gray-500">
            JPEG, PNG, WebP, or GIF. Maximum 5MB.
          </p>

          {preview && (
            <button
              onClick={handleUpload}
              disabled={status === "uploading"}
              className="inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === "uploading" ? "Uploading..." : "Upload Photo"}
            </button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {status === "success" && (
        <p className="text-sm text-green-700 dark:text-green-400">
          Photo updated successfully.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700 dark:text-red-400">{errorMsg}</p>
      )}
    </section>
  );
}
