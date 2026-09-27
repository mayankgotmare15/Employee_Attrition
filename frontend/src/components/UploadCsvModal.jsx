import React, { useState } from "react";
import { X, Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "../services/api";

export default function UploadCsvModal({ isOpen, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setResult(null);
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
      const res = await api.employees.uploadCSV(file);
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || "Failed to process CSV file");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Batch CSV Ingestion</h3>
            <p className="text-xs text-slate-400">Upload employee records to automatically ingest and run batch ML scoring</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-500/10 border border-rose-500/30 p-3 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{result.message}</span>
          </div>
        )}

        {/* Drag & Drop Area */}
        <div className="mt-5 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-950/50 p-6 text-center hover:border-indigo-500/50 transition-colors">
          <FileText className="h-10 w-10 text-indigo-400/80 mb-2" />
          <p className="text-xs font-semibold text-slate-200">
            {file ? file.name : "Click to select or drag & drop CSV file"}
          </p>
          <p className="text-[11px] text-slate-500 mt-1">Supports standard IBM HR format or custom company export (up to 10MB)</p>
          
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-800 mt-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            {result ? "Done" : "Cancel"}
          </button>
          
          {!result && (
            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="btn-shimmer flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>{loading ? "Processing..." : "Upload & Score"}</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
