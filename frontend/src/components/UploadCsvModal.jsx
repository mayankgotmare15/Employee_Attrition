import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Download,
  Loader2,
  Database,
  ShieldAlert,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { api } from "../services/api";

export default function UploadCsvModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFile = (selectedFile) => {
    if (!selectedFile) return;
    const name = selectedFile.name.toLowerCase();
    if (!name.endsWith(".csv")) {
      setError("Please select a valid CSV file (.csv).");
      return;
    }
    setFile(selectedFile);
    setError(null);
    setResult(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a valid CSV file first.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setLoadingStep("Uploading CSV & mapping columns...");

      setTimeout(() => {
        setLoadingStep("Ingesting records & running ML batch scoring...");
      }, 700);

      const res = await api.employees.uploadCSV(file);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to process CSV file");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  const handleDownloadSample = () => {
    api.employees.downloadSampleCSV();
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(2)} MB`;
  };

  const handleClose = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={loading}
          className="absolute top-5 right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Batch CSV Ingestion & Scoring
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                Vectorized ML
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Upload employee records to auto-ingest and calculate attrition risk
            </p>
          </div>
        </div>

        {/* Alert Notifications */}
        {error && (
          <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Upload failed: </span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4 text-xs text-emerald-300 space-y-3">
            <div className="flex items-center gap-2 font-semibold text-emerald-200">
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
              <span>{result.message}</span>
            </div>

            {result.riskBreakdown && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-emerald-500/20 text-center">
                <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                  <div className="text-[10px] uppercase font-bold text-rose-400">High Risk</div>
                  <div className="text-base font-extrabold text-rose-300">{result.riskBreakdown.high}</div>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] uppercase font-bold text-amber-400">Medium Risk</div>
                  <div className="text-base font-extrabold text-amber-300">{result.riskBreakdown.medium}</div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                  <div className="text-[10px] uppercase font-bold text-emerald-400">Low Risk</div>
                  <div className="text-base font-extrabold text-emerald-300">{result.riskBreakdown.low}</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Drag & Drop Area */}
        {!result && (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative mt-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? "border-indigo-400 bg-indigo-500/10 scale-[1.01]"
                : file
                ? "border-emerald-500/40 bg-emerald-950/10"
                : "border-slate-700/80 bg-slate-950/50 hover:border-indigo-500/50 hover:bg-slate-950/80"
            }`}
          >
            {/* Dedicated isolated file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />

            {file ? (
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
                  <FileText className="h-6 w-6" />
                </div>
                <p className="text-xs font-bold text-white max-w-xs truncate">{file.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {formatFileSize(file.size)} • Click to change file
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-semibold text-emerald-400">
                  <CheckCircle className="h-3 w-3" />
                  Ready to Ingest & Score
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-2">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-slate-200">
                  Click to select or drag & drop CSV file
                </p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Supports standard IBM HR dataset or custom company CSVs (up to 25MB)
                </p>
              </div>
            )}
          </div>
        )}

        {/* Feature Highlights & Template Downloader */}
        {!result && (
          <div className="mt-4 flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-xs">
            <div className="flex items-center gap-2 text-slate-400 text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span>Auto-detects headers & missing attributes</span>
            </div>
            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Download className="h-3 w-3" />
              <span>Sample CSV Template</span>
            </button>
          </div>
        )}

        {/* Loading state indicator */}
        {loading && (
          <div className="mt-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-3 flex items-center gap-3 text-xs text-indigo-300">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-400 shrink-0" />
            <span className="font-medium">{loadingStep || "Processing..."}</span>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800 mt-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            {result ? "Close" : "Cancel"}
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-shimmer flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload & Score</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="btn-shimmer flex items-center gap-2 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/25"
            >
              <CheckCircle className="h-3.5 w-3.5" />
              <span>View in Dashboard</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
