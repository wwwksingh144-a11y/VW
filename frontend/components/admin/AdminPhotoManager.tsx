"use client";

// Reading this as: Executive cloud image & GIF pipeline manager for an elite branding agency, using dark-mode dropzone chrome, tactile upload physics, and high-contrast image exhibition cards with a Live Side Telemetry Console.
// DESIGN_VARIANCE: 7
// MOTION_INTENSITY: 5
// VISUAL_DENSITY: 5

import React, { useState, useEffect, useRef } from "react";
import { Upload, Image as ImageIcon, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, RefreshCw, Terminal, Activity, ChevronRight, Clock, Maximize2 } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { EditMediaModal } from "./EditMediaModal";
import { softDeleteMedia, getAdminMedia } from "@/app/actions/mediaActions";

interface LogEntry {
  timestamp: string;
  stage: "API" | "QUEUE" | "WORKER" | "ERROR" | "SUCCESS";
  message: string;
}

interface PhotoRecord {
  id: string;
  userId: string;
  originalFileName: string;
  originalSize: number;
  originalMimeType: string;
  width: number | null;
  height: number | null;
  status: "uploaded" | "queued" | "processing" | "completed" | "failed";
  inputPath: string;
  webpPath: string | null;
  thumbnailPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
  logs?: LogEntry[];
  heading?: string | null;
  subHeading?: string | null;
  description?: string | null;
  altText?: string | null;
  tags?: string[] | null;
  category?: string | null;
  publishStatus?: "published" | "draft" | "archived";
  displayOrder?: number;
  isStarred?: boolean;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://vwapi.onrender.com";

interface AdminPhotoManagerProps {
  isModal?: boolean;
  onSelectPhoto?: (url: string) => void;
}

export const AdminPhotoManager: React.FC<AdminPhotoManagerProps> = ({ isModal = false, onSelectPhoto }) => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [editPhoto, setEditPhoto] = useState<PhotoRecord | null>(null);

  // Fetch all photos from backend API
  const fetchPhotos = async () => {
    try {
      const res = await getAdminMedia('photos');
      if (res.success) {
        setPhotos(res.data);
        
        // Auto-select most recently active or first photo if none selected
        if (!selectedPhotoId && res.data.length > 0) {
          setSelectedPhotoId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch photos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for active/processing photos every 3 seconds
  useEffect(() => {
    fetchPhotos();
    const interval = setInterval(() => {
      fetchPhotos();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedPhotoId]);

  // Auto-scroll console window to bottom when logs update
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [photos, selectedPhotoId]);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setUploadError("Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setUploadError("File size exceeds 50MB limit.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/photos/upload",
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      const res = await fetch(`${BACKEND_URL}/api/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrl: newBlob.url,
          originalFileName: file.name,
          originalSize: file.size,
          originalMimeType: file.type || "image/jpeg",
          userId: "admin",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.photo?.id) {
          setSelectedPhotoId(result.photo.id);
        }
      }

      setIsUploading(false);
      setUploadProgress(null);
      fetchPhotos();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Vercel Blob direct photo upload error:", err);
      setIsUploading(false);
      setUploadProgress(null);
      setUploadError(err.message || "Failed to upload photo.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to soft-delete this photo?")) return;
    try {
      const res = await softDeleteMedia('photos', id);
      if (res.success) {
        fetchPhotos();
        if (selectedPhotoId === id) {
          setSelectedPhotoId(photos[0]?.id || null);
        }
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error("Failed to delete photo:", err);
    }
  };

  const selectedPhoto = photos.find((p) => p.id === selectedPhotoId) || photos[0];

  const getStageBadgeStyle = (stage: LogEntry["stage"]) => {
    switch (stage) {
      case "API":
        return "bg-sky-950/80 text-sky-300 border-sky-700/60";
      case "QUEUE":
        return "bg-purple-950/80 text-purple-300 border-purple-700/60";
      case "WORKER":
        return "bg-amber-950/80 text-amber-300 border-amber-700/60";
      case "SUCCESS":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
      case "ERROR":
        return "bg-red-950/80 text-red-300 border-red-700/60";
      default:
        return "bg-navy-900 text-navy-300 border-navy-700";
    }
  };

  return (
    <div className="space-y-12">
      {/* Modal Selection Banner */}
      {(isModal || onSelectPhoto) && (
        <div className="bg-gradient-to-r from-bronze-50 via-warm-100 to-white text-navy-950 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-bronze-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bronze-600 text-white border border-bronze-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              ⚡ ASSET SELECTOR
            </span>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-navy-950 font-display">Select Cloud Asset for Dossier</h3>
            <p className="text-xs text-navy-600 max-w-xl leading-snug">
              Upload above or click an asset below, then click <strong className="text-navy-950 underline">&ldquo;USE THIS ASSET&rdquo;</strong>.
            </p>
          </div>
          {selectedPhoto ? (
            <button
              onClick={() => {
                if (onSelectPhoto) {
                  onSelectPhoto(selectedPhoto.webpPath || selectedPhoto.inputPath);
                }
              }}
              className="w-full md:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs rounded-xl shadow-md border border-emerald-600 hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0 group/btn"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>USE SELECTED: &ldquo;{selectedPhoto.originalFileName.slice(0, 16)}&rdquo;</span>
            </button>
          ) : (
            <div className="w-full md:w-auto px-4 py-2 bg-white text-navy-500 font-mono text-xs rounded-lg border border-navy-200 shadow-sm text-center flex-shrink-0 font-semibold">
              👈 CLICK AN ASSET BELOW
            </div>
          )}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-200/80 pb-6">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-bronze-600 block mb-1">
            CLOUD PIPELINE / 04
          </span>
          <h1 className="text-display sm:text-h2 font-bold text-navy-950 tracking-tight">
            Image &amp; GIF Transcoding Engine
          </h1>
          <p className="text-navy-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Upload JPEG, PNG, or animated GIF media. Watch serverless Sharp &amp; FFmpeg workers transcode into optimized high-speed WebP renditions in real-time.
          </p>
        </div>
        <button
          onClick={fetchPhotos}
          className="flex items-center gap-2 text-xs font-mono font-bold text-navy-900 hover:text-bronze-600 active:scale-[0.98] active:-translate-y-[1px] transition-all bg-warm-200/80 hover:bg-warm-200 px-4 py-2.5 rounded-lg border border-navy-300/40 shadow-sm"
          data-interactive
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>SYNC TELEMETRY</span>
        </button>
      </div>

      {/* Main Responsive Layout */}
      <div className={`grid grid-cols-1 ${isModal ? "gap-6" : "lg:grid-cols-12 gap-8"} items-start`}>
        
        {/* LEFT COLUMN: Dropzone & Cloud Assets */}
        <div className={`${isModal ? "w-full" : "lg:col-span-7 xl:col-span-8"} space-y-8`}>
          
          {/* Executive Cloud Dropzone */}
          {isModal ? (
            <div className="bg-warm-50/90 text-navy-950 p-5 rounded-2xl border-2 border-dashed border-navy-300 hover:border-bronze-500 transition-all shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 text-left">
                <div className="w-12 h-12 rounded-xl bg-white border border-navy-200 text-bronze-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-navy-950 font-display">Upload New Image Asset</h4>
                  <p className="text-xs text-navy-500">JPEG, PNG, GIF up to 50MB. Auto-optimized to WebP.</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id="admin-photo-file-input-modal"
              />
              <label
                htmlFor="admin-photo-file-input-modal"
                className={`px-6 py-3 rounded-xl bg-navy-950 text-white font-mono text-xs font-bold cursor-pointer hover:bg-navy-900 transition-all shadow-md flex items-center gap-2 flex-shrink-0 ${
                  isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-bronze-400" /> : <ImageIcon className="w-4 h-4 text-bronze-400" />}
                <span>{isUploading ? "TRANSMITTING..." : "⚡ SELECT & UPLOAD"}</span>
              </label>
            </div>
          ) : (
            <div className="bg-navy-950 text-warm-50 p-8 md:p-10 rounded-2xl border-2 border-dashed border-navy-800 hover:border-bronze-500 transition-all shadow-2xl relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-bronze-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center text-bronze-400 mb-5 group-hover:scale-110 group-hover:border-bronze-500 transition-all shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-bronze-400 mb-2 font-bold">SHARP OPTIMIZATION + FFMPEG GIF ENGINE</span>
                <h3 className="text-h3 font-bold text-warm-50 mb-2">Deploy Image Asset</h3>
                <p className="text-sm text-navy-300 mb-6 leading-relaxed">
                  Drag &amp; drop high-resolution JPEG, PNG, or animated GIF file, or initialize local browser selection (Max 50MB payload).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="admin-photo-file-input"
                />

                <label
                  htmlFor="admin-photo-file-input"
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-warm-50 text-navy-950 font-bold text-sm cursor-pointer hover:bg-warm-100 active:scale-[0.98] active:-translate-y-[1px] transition-all shadow-xl group/btn ${
                    isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-bronze-600" /> : <ImageIcon className="w-5 h-5 text-bronze-600 group-hover/btn:rotate-12 transition-transform" />}
                  <span>{isUploading ? "TRANSMITTING TO CLOUD..." : "INITIALIZE UPLOAD"}</span>
                </label>

                {uploadProgress !== null && (
                  <div className="w-full max-w-md mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-mono font-semibold text-bronze-400">
                      <span>BUFFERING PAYLOAD TO CDN...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-3 bg-navy-900 rounded-full overflow-hidden border border-navy-800 p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-bronze-600 to-bronze-400 transition-all duration-300 rounded-full shadow-sm"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {uploadError && (
                  <div className="mt-6 p-4 rounded-xl bg-red-950/90 text-red-200 border border-red-800 text-xs font-mono flex items-center gap-3 w-full">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <span className="text-left">{uploadError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Photos List Grid */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-h3 font-bold text-navy-950">Indexed Image Assets ({photos.length})</h3>
              <span className="text-xs font-mono text-navy-500">AUTO-REFRESHING EVERY 3S</span>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-navy-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-bronze-600" />
                <span className="text-xs font-mono">SYNCHRONIZING WITH NEON DATABASE...</span>
              </div>
            ) : photos.length === 0 ? (
              <div className="bg-warm-50 p-12 rounded-2xl text-center border border-navy-200/80 text-navy-500 font-mono text-xs">
                No image assets recorded in database yet. Upload a photo or GIF above to watch real-time worker transcoding.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {photos.map((p) => {
                  const isSelected = p.id === selectedPhoto?.id;
                  const displayUrl = p.webpPath || p.inputPath;
                  const isGif = p.originalMimeType === "image/gif" || p.originalFileName.toLowerCase().endsWith(".gif");

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhotoId(p.id)}
                      className={`bg-warm-50 rounded-2xl border transition-all p-5 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                        isSelected ? "border-2 border-bronze-600 ring-2 ring-bronze-600/10" : "border-navy-200/80 hover:border-navy-400"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Status Badge & Header */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 truncate">
                            <span className="font-bold text-navy-950 text-sm truncate" title={p.originalFileName}>
                              {p.heading || p.originalFileName}
                            </span>
                          </div>

                          <div className="flex-shrink-0">
                            {p.status === "completed" && (
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> WEBP READY
                              </span>
                            )}

                            {(p.status === "processing" || p.status === "queued" || p.status === "uploaded") && (
                              <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                                {p.status === "processing" ? "SHARP..." : "QUEUED"}
                              </span>
                            )}

                            {p.status === "failed" && (
                              <span className="px-2.5 py-0.5 rounded-full bg-red-950 text-red-300 border border-red-800 text-[10px] font-mono font-bold flex items-center gap-1 shadow-sm">
                                <AlertCircle className="w-3 h-3 text-red-400" /> FAILED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Image Preview Card */}
                        <div className="relative rounded-xl overflow-hidden border border-navy-900/10 shadow-inner bg-navy-950 aspect-video flex items-center justify-center group/img">
                          <img
                            src={displayUrl}
                            alt={p.originalFileName}
                            className="w-full h-full object-contain transition-transform duration-500 group-hover/img:scale-105"
                          />
                          {isGif && (
                            <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-bronze-600/90 text-warm-50 text-[10px] font-mono font-bold rounded shadow backdrop-blur-sm">
                              ANIMATED GIF &rarr; WEBP
                            </span>
                          )}
                          {isSelected && (
                            <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 bg-navy-900/90 text-bronze-400 text-[10px] font-mono font-bold rounded border border-navy-700 shadow backdrop-blur-sm">
                              ACTIVE CONSOLE
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Footer details & Actions */}
                      <div className="pt-3 mt-3 border-t border-navy-200/80 flex items-center justify-between text-[11px] font-mono text-navy-500">
                        <div className="flex items-center gap-3 truncate">
                          {p.width && p.height ? (
                            <span>{p.width}&times;{p.height}px</span>
                          ) : (
                            <span>{(p.originalSize / (1024 * 1024)).toFixed(2)} MB</span>
                          )}
                          <span className="truncate">#{p.id.slice(0, 6)}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectPhoto && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectPhoto(p.webpPath || p.inputPath);
                              }}
                              className="px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-600/60 shadow-sm transition-all hover:scale-105"
                              title="Inject this asset directly"
                            >
                              ⚡ USE
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditPhoto(p);
                            }}
                            className="p-1.5 text-navy-500 hover:text-navy-900 bg-navy-100 hover:bg-navy-200 rounded-lg transition-all active:scale-95"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-bronze-600 font-bold group-hover:underline flex items-center gap-0.5 text-[11px]">
                            <span>Logs</span>
                            <ChevronRight className="w-3 h-3" />
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(p.id);
                            }}
                            className="p-1.5 text-navy-400 hover:text-warm-50 hover:bg-red-900/90 rounded-lg transition-all active:scale-95"
                            title="Delete Photo from Cloud CDN and DB"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Side Telemetry Console (Hidden in Modal Mode to keep popup compact and smooth) */}
        {!isModal && (
          <div className="lg:col-span-5 xl:col-span-4 sticky top-8 space-y-4">
            <div className="bg-navy-950 rounded-2xl border border-navy-800 shadow-2xl overflow-hidden flex flex-col h-[650px]">
              
              {/* Console Header */}
              <div className="bg-navy-900/90 border-b border-navy-800 px-5 py-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="h-4 w-[1px] bg-navy-700 mx-1" />
                  <div className="flex items-center gap-2 text-warm-100 font-mono text-xs font-bold tracking-wider">
                    <Terminal className="w-4 h-4 text-bronze-400" />
                    <span>LIVE PHOTO WORKER CONSOLE</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 text-[10px] font-mono border border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ACTIVE
                  </span>
                </div>
              </div>

              {/* Target Job Selector Bar */}
              <div className="bg-navy-900/40 border-b border-navy-800/60 px-5 py-2.5 flex items-center justify-between text-xs font-mono text-navy-400">
                <div className="flex items-center gap-2 truncate">
                  <Activity className="w-3.5 h-3.5 text-bronze-400 flex-shrink-0" />
                  <span>TARGET:</span>
                  <span className="text-warm-100 font-semibold truncate max-w-[180px]">
                    {selectedPhoto ? selectedPhoto.originalFileName : "NO JOB SELECTED"}
                  </span>
                </div>
                {selectedPhoto && (
                  <span className="text-[10px] bg-navy-800 px-2 py-0.5 rounded text-navy-300 uppercase">
                    {selectedPhoto.status}
                  </span>
                )}
              </div>

              {/* Terminal Output Body */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-3 bg-[#070b14] scrollbar-thin scrollbar-thumb-navy-800 scrollbar-track-transparent">
                {!selectedPhoto ? (
                  <div className="h-full flex flex-col items-center justify-center text-navy-600 space-y-2 text-center py-12">
                    <Terminal className="w-8 h-8 opacity-40" />
                    <p>Select a photo job on the left to inspect real-time worker logs.</p>
                  </div>
                ) : !selectedPhoto.logs || selectedPhoto.logs.length === 0 ? (
                  <div className="space-y-3 text-navy-400">
                    <div className="flex items-start gap-2.5">
                      <span className="text-navy-600 font-semibold">[{new Date().toLocaleTimeString()}]</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-900 text-navy-300 border border-navy-800">
                        SYSTEM
                      </span>
                      <span className="text-warm-300">Awaiting worker telemetry feed for job #{selectedPhoto.id.slice(0, 8)}...</span>
                    </div>
                    {selectedPhoto.errorMessage && (
                      <div className="flex items-start gap-2.5 text-red-400">
                        <span className="text-navy-600 font-semibold">[{new Date().toLocaleTimeString()}]</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                          ERROR
                        </span>
                        <span>{selectedPhoto.errorMessage}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  selectedPhoto.logs.map((log, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 leading-relaxed group/log">
                      <span className="text-navy-600 font-semibold flex-shrink-0 select-none">
                        [{log.timestamp}]
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border flex-shrink-0 uppercase ${getStageBadgeStyle(
                          log.stage
                        )}`}
                      >
                        {log.stage}
                      </span>
                      <span
                        className={`break-words font-medium ${
                          log.stage === "ERROR"
                            ? "text-red-400 font-semibold"
                            : log.stage === "SUCCESS"
                            ? "text-emerald-300 font-semibold"
                            : log.stage === "WORKER"
                            ? "text-warm-100"
                            : "text-navy-300"
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))
                )}

                {/* Blinking Prompt Line */}
                {selectedPhoto && (
                  <div className="pt-2 flex items-center gap-2 text-bronze-400 font-semibold">
                    <span className="text-navy-600">&gt;</span>
                    <span className="text-xs">
                      {selectedPhoto.status === "completed"
                        ? "JOB FINISHED // WEBP RENDITION ENCODED"
                        : selectedPhoto.status === "failed"
                        ? "JOB TERMINATED // ERROR ENCOUNTERED"
                        : "PROCESSING ACTIVE // SHARP WORKER LISTENING"}
                    </span>
                    <span className="w-2 h-4 bg-bronze-400 animate-pulse inline-block" />
                  </div>
                )}
                <div ref={consoleEndRef} />
              </div>

              {/* Console Footer Details */}
              <div className="bg-navy-900/90 border-t border-navy-800 px-5 py-3 flex flex-col gap-2">
                {selectedPhoto && onSelectPhoto && (
                  <button
                    onClick={() => onSelectPhoto(selectedPhoto.webpPath || selectedPhoto.inputPath)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>USE &ldquo;{selectedPhoto.originalFileName.slice(0, 16)}&rdquo; IN DOSSIER</span>
                  </button>
                )}
                <div className="flex items-center justify-between text-[11px] text-navy-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-navy-500" />
                    <span>POLL INTERVAL: 3000ms</span>
                  </div>
                  <div className="text-navy-500">
                    {selectedPhoto?.logs?.length || 0} EVENTS LOGGED
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      {editPhoto && (
        <EditMediaModal 
          media={editPhoto}
          type="photos"
          onClose={() => setEditPhoto(null)}
          onRefresh={fetchPhotos}
        />
      )}
    </div>
  );
};
