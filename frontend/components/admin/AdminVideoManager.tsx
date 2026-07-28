"use client";

// Reading this as: Executive cloud video pipeline manager for an elite branding agency, using dark-mode dropzone chrome, tactile upload physics, and high-contrast video exhibition cards with a Live Side Telemetry Console.
// DESIGN_VARIANCE: 7
// MOTION_INTENSITY: 5
// VISUAL_DENSITY: 5

import React, { useState, useEffect, useRef } from "react";
import { Upload, Film, Trash2, Edit2, CheckCircle2, AlertCircle, Loader2, RefreshCw, Terminal, Activity, ChevronRight, Clock, ShieldAlert } from "lucide-react";
import { upload } from "@vercel/blob/client";
import { LazyVideoPlayer } from "../video/LazyVideoPlayer";
import { EditMediaModal } from "./EditMediaModal";
import { softDeleteMedia, getAdminMedia } from "@/app/actions/mediaActions";

interface LogEntry {
  timestamp: string;
  stage: "API" | "QUEUE" | "WORKER" | "ERROR" | "SUCCESS";
  message: string;
}

interface VideoRecord {
  id: string;
  userId: string;
  originalFileName: string;
  originalSize: number;
  durationSeconds: string | null;
  status: "uploaded" | "queued" | "processing" | "completed" | "failed";
  inputPath: string;
  webmPath: string | null;
  mp4Path: string | null;
  thumbnailPath: string | null;
  errorMessage: string | null;
  createdAt: string;
  processedAt: string | null;
  logs?: LogEntry[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "";

interface AdminVideoManagerProps {
  isModal?: boolean;
  onSelectVideo?: (url: string, videoObj?: VideoRecord) => void;
}

export const AdminVideoManager: React.FC<AdminVideoManagerProps> = ({ isModal = false, onSelectVideo }) => {
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);

  const [editVideo, setEditVideo] = useState<VideoRecord | null>(null);

  // Fetch all videos from backend API
  const fetchVideos = async () => {
    try {
      const res = await getAdminMedia('videos');
      if (res.success) {
        setVideos(res.data);
        
        // Auto-select most recently active or first video if none selected
        if (!selectedVideoId && res.data.length > 0) {
          setSelectedVideoId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error("Failed to fetch videos:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Poll for active/processing videos every 3 seconds
  useEffect(() => {
    fetchVideos();
    const interval = setInterval(() => {
      fetchVideos();
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedVideoId]);

  // Auto-scroll console window to bottom when logs update
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [videos, selectedVideoId]);

  // Handle File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const allowedTypes = ["video/mp4", "video/quicktime", "video/webm"];
    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const allowedExts = [".mp4", ".mov", ".webm"];

    if (!allowedTypes.includes(file.type) && !allowedExts.includes(ext)) {
      setUploadError("Invalid file type. Only MP4, MOV, and WebM videos are allowed.");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setUploadError("File size exceeds 100MB limit.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      const newBlob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/videos/upload",
        onUploadProgress: (progress) => {
          setUploadProgress(progress.percentage);
        },
      });

      const res = await fetch(`${BACKEND_URL}/api/videos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inputUrl: newBlob.url,
          originalFileName: file.name,
          originalSize: file.size,
          userId: "admin",
        }),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.video?.id) {
          setSelectedVideoId(result.video.id);
        }
      }

      setIsUploading(false);
      setUploadProgress(null);
      fetchVideos();
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err: any) {
      console.error("Vercel Blob direct upload error:", err);
      setIsUploading(false);
      setUploadProgress(null);
      setUploadError(err.message || "Failed to upload video.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to soft-delete this video?")) return;
    try {
      const res = await softDeleteMedia('videos', id);
      if (res.success) {
        fetchVideos();
        if (selectedVideoId === id) {
          setSelectedVideoId(videos[0]?.id || null);
        }
      } else {
        alert(res.error);
      }
    } catch (err) {
      console.error("Failed to delete video:", err);
    }
  };

  const selectedVideo = videos.find((v) => v.id === selectedVideoId) || videos[0];

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
      {(isModal || onSelectVideo) && (
        <div className="bg-gradient-to-r from-emerald-50 via-warm-100 to-white text-navy-950 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="space-y-0.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white border border-emerald-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              ⚡ VIDEO ASSET SELECTOR
            </span>
            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-navy-950 font-display">Select Cloud Video for Dossier</h3>
            <p className="text-xs text-navy-600 max-w-xl leading-snug">
              Upload above or click a video below, then click <strong className="text-navy-950 underline">&ldquo;USE THIS VIDEO&rdquo;</strong>.
            </p>
          </div>
          {selectedVideo ? (
            <button
              onClick={() => {
                if (onSelectVideo) {
                  onSelectVideo(selectedVideo.webmPath || selectedVideo.mp4Path || selectedVideo.inputPath, selectedVideo);
                }
              }}
              className="w-full md:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-mono font-bold text-xs rounded-xl shadow-md border border-emerald-600 hover:scale-102 active:scale-95 transition-all flex items-center justify-center gap-2 flex-shrink-0 group/btn"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>USE SELECTED: &ldquo;{selectedVideo.originalFileName.slice(0, 16)}&rdquo;</span>
            </button>
          ) : (
            <div className="w-full md:w-auto px-4 py-2 bg-white text-navy-500 font-mono text-xs rounded-lg border border-navy-200 shadow-sm text-center flex-shrink-0 font-semibold">
              👈 CLICK A VIDEO BELOW
            </div>
          )}
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-200/80 pb-6">
        <div>
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-bronze-600 block mb-1">
            CLOUD PIPELINE / 03
          </span>
          <h1 className="text-display sm:text-h2 font-bold text-navy-950 tracking-tight">
            Video Transcoding Engine
          </h1>
          <p className="text-navy-600 text-sm mt-1 max-w-2xl leading-relaxed">
            Upload source MP4/MOV media. Watch serverless workers transcode and extract thumbnails in real-time via the Live Telemetry Console.
          </p>
        </div>
        <button
          onClick={fetchVideos}
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
                  <h4 className="text-base font-bold text-navy-950 font-display">Upload New Video Asset</h4>
                  <p className="text-xs text-navy-500">MP4, MOV, WebM up to 100MB. Transcoded in real-time.</p>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
                id="admin-video-file-input-modal"
              />
              <label
                htmlFor="admin-video-file-input-modal"
                className={`px-6 py-3 rounded-xl bg-navy-950 text-white font-mono text-xs font-bold cursor-pointer hover:bg-navy-900 transition-all shadow-md flex items-center gap-2 flex-shrink-0 ${
                  isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                }`}
              >
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-bronze-400" /> : <Film className="w-4 h-4 text-bronze-400" />}
                <span>{isUploading ? "TRANSMITTING..." : "⚡ SELECT & UPLOAD"}</span>
              </label>
            </div>
          ) : (
            <div className="bg-navy-950 text-warm-50 p-8 md:p-10 rounded-2xl border-2 border-dashed border-navy-800 hover:border-bronze-500 transition-all shadow-md relative overflow-hidden group">
              <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-bronze-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col items-center justify-center text-center max-w-lg mx-auto relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-navy-900 border border-navy-700 flex items-center justify-center text-bronze-400 mb-5 group-hover:scale-110 group-hover:border-bronze-500 transition-all shadow-inner">
                  <Upload className="w-7 h-7" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-bronze-400 mb-2 font-bold">VERCEL BLOB CDN + UPSTASH QUEUE</span>
                <h3 className="text-h3 font-bold text-warm-50 mb-2">Deploy Media Asset</h3>
                <p className="text-sm text-navy-300 mb-6 leading-relaxed">
                  Drag &amp; drop high-resolution MP4, MOV, or WebM video file, or initialize local browser selection (Max 100MB payload).
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="hidden"
                  id="admin-video-file-input"
                />

                <label
                  htmlFor="admin-video-file-input"
                  className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-warm-50 text-navy-950 font-bold text-sm cursor-pointer hover:bg-warm-100 active:scale-[0.98] active:-translate-y-[1px] transition-all shadow-xl group/btn ${
                    isUploading ? "opacity-50 cursor-not-allowed pointer-events-none" : ""
                  }`}
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-bronze-600" /> : <Film className="w-5 h-5 text-bronze-600 group-hover/btn:rotate-12 transition-transform" />}
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

          {/* Videos List Grid */}
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-h3 font-bold text-navy-950">Indexed Cloud Assets ({videos.length})</h3>
              <span className="text-xs font-mono text-navy-500">AUTO-REFRESHING EVERY 3S</span>
            </div>

            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center text-navy-500 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-bronze-600" />
                <span className="text-xs font-mono">SYNCHRONIZING WITH NEON DATABASE...</span>
              </div>
            ) : videos.length === 0 ? (
              <div className="bg-warm-50 p-12 rounded-2xl text-center border border-navy-200/80 text-navy-500 font-mono text-xs">
                No media assets recorded in database yet. Upload a video above to watch real-time worker transcoding.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {videos.map((v) => {
                  const isSelected = v.id === selectedVideo?.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVideoId(v.id)}
                      className={`bg-warm-50 rounded-2xl border transition-all p-6 shadow-md hover:shadow-xl cursor-pointer flex flex-col justify-between group relative ${
                        isSelected ? "border-2 border-bronze-600 ring-2 ring-bronze-600/10" : "border-navy-200/80 hover:border-navy-400"
                      }`}
                    >
                      <div className="space-y-4">
                        {/* Status Badge & Header */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-navy-950 text-base truncate max-w-[280px]" title={v.originalFileName}>
                              {v.heading || v.originalFileName}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-mono font-bold bg-bronze-500 text-warm-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                MONITORING
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {v.status === "completed" && (
                              <span className="px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> CDN READY
                              </span>
                            )}

                            {(v.status === "processing" || v.status === "queued" || v.status === "uploaded") && (
                              <span className="px-3 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                {v.status === "processing" ? "TRANSCODING..." : "BULLMQ QUEUED"}
                              </span>
                            )}

                            {v.status === "failed" && (
                              <span className="px-3 py-1 rounded-full bg-red-950 text-red-300 border border-red-800 text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-sm">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400" /> TRANSCODE FAILED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Player View */}
                        <div className="rounded-xl overflow-hidden border border-navy-900/10 shadow-inner bg-navy-950 max-h-[360px]">
                          <LazyVideoPlayer
                            webmUrl={v.webmPath}
                            mp4Url={v.mp4Path || v.inputPath}
                            posterUrl={v.thumbnailPath}
                            title={v.originalFileName}
                          />
                        </div>
                      </div>

                      {/* Footer details & Actions */}
                      <div className="pt-4 mt-4 border-t border-navy-200/80 flex items-center justify-between text-xs font-mono text-navy-500">
                        <div className="flex items-center gap-4">
                          {v.durationSeconds && <span>DUR: {v.durationSeconds}s</span>}
                          <span>SIZE: {(v.originalSize / (1024 * 1024)).toFixed(1)} MB</span>
                          <span>ID: {v.id.slice(0, 8)}...</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {onSelectVideo && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectVideo(v.webmPath || v.mp4Path || v.inputPath, v);
                              }}
                              className="px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 font-mono text-[10px] font-bold rounded border border-emerald-600/60 shadow-sm transition-all hover:scale-105"
                              title="Inject this video directly"
                            >
                              ⚡ USE
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditVideo(v);
                            }}
                            className="p-1.5 text-navy-500 hover:text-navy-900 bg-navy-100 hover:bg-navy-200 rounded-lg transition-all active:scale-95"
                            title="Edit Details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-bronze-600 font-bold group-hover:underline flex items-center gap-1">
                            <span>Inspect Telemetry</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(v.id);
                            }}
                            className="p-2 text-navy-400 hover:text-warm-50 hover:bg-red-900/90 rounded-lg transition-all active:scale-95"
                            title="Delete Video from Cloud CDN and DB"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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
                    <span>LIVE WORKER CONSOLE</span>
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
                    {selectedVideo ? selectedVideo.originalFileName : "NO JOB SELECTED"}
                  </span>
                </div>
                {selectedVideo && (
                  <span className="text-[10px] bg-navy-800 px-2 py-0.5 rounded text-navy-300 uppercase">
                    {selectedVideo.status}
                  </span>
                )}
              </div>

              {/* Terminal Output Body */}
              <div className="flex-1 overflow-y-auto p-5 font-mono text-xs space-y-3 bg-[#070b14] scrollbar-thin scrollbar-thumb-navy-800 scrollbar-track-transparent">
                {!selectedVideo ? (
                  <div className="h-full flex flex-col items-center justify-center text-navy-600 space-y-2 text-center py-12">
                    <Terminal className="w-8 h-8 opacity-40" />
                    <p>Select a video job on the left to inspect real-time worker logs.</p>
                  </div>
                ) : !selectedVideo.logs || selectedVideo.logs.length === 0 ? (
                  <div className="space-y-3 text-navy-400">
                    <div className="flex items-start gap-2.5">
                      <span className="text-navy-600 font-semibold">[{new Date().toLocaleTimeString()}]</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-navy-900 text-navy-300 border border-navy-800">
                        SYSTEM
                      </span>
                      <span className="text-warm-300">Awaiting worker telemetry feed for job #{selectedVideo.id.slice(0, 8)}...</span>
                    </div>
                    {selectedVideo.errorMessage && (
                      <div className="flex items-start gap-2.5 text-red-400">
                        <span className="text-navy-600 font-semibold">[{new Date().toLocaleTimeString()}]</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                          ERROR
                        </span>
                        <span>{selectedVideo.errorMessage}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  selectedVideo.logs.map((log, idx) => (
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
                {selectedVideo && (
                  <div className="pt-2 flex items-center gap-2 text-bronze-400 font-semibold">
                    <span className="text-navy-600">&gt;</span>
                    <span className="text-xs">
                      {selectedVideo.status === "completed"
                        ? "JOB FINISHED // MP4 RENDITION ENCODED"
                        : selectedVideo.status === "failed"
                        ? "JOB TERMINATED // ERROR ENCOUNTERED"
                        : "PROCESSING ACTIVE // WORKER LISTENING"}
                    </span>
                    <span className="w-2 h-4 bg-bronze-400 animate-pulse inline-block" />
                  </div>
                )}
                <div ref={consoleEndRef} />
              </div>

              {/* Console Footer Details */}
              <div className="bg-navy-900/90 border-t border-navy-800 px-5 py-3 flex flex-col gap-2">
                {selectedVideo && onSelectVideo && (
                  <button
                    onClick={() => onSelectVideo(selectedVideo.webmPath || selectedVideo.mp4Path || selectedVideo.inputPath, selectedVideo)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>USE &ldquo;{selectedVideo.originalFileName.slice(0, 16)}&rdquo; IN DOSSIER</span>
                  </button>
                )}
                <div className="flex items-center justify-between text-[11px] text-navy-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-navy-500" />
                    <span>POLL INTERVAL: 3000ms</span>
                  </div>
                  <div className="text-navy-500">
                    {selectedVideo?.logs?.length || 0} EVENTS LOGGED
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}   </div>

      </div>
      {editVideo && (
        <EditMediaModal 
          media={editVideo}
          type="videos"
          onClose={() => setEditVideo(null)}
          onRefresh={fetchVideos}
        />
      )}
    </div>
  );
};
