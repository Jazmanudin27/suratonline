import React, { useState, useRef } from "react";
import {
  Paperclip,
  UploadCloud,
  FileSpreadsheet,
  FileImage,
  FileText,
  File,
  Trash2,
  Download,
  Eye,
  X,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { generateId } from "../utils/helpers";
import { api } from "../services/api";

export default function AttachmentUploader({
  attachments = [],
  onChange,
  readOnly = false,
  maxFileSizeMB = 5,
}) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [previewImage, setPreviewImage] = useState(null);

  // Allowed MIME types & extensions
  const ALLOWED_EXTENSIONS = [
    "xlsx",
    "xls",
    "csv",
    "jpg",
    "jpeg",
    "png",
    "webp",
    "pdf",
  ];

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes || bytes === 0) return "0 B";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getFileExtension = (filename) => {
    return filename.split(".").pop().toLowerCase();
  };

  const getFileCategory = (ext) => {
    if (["xlsx", "xls", "csv"].includes(ext)) return "excel";
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
    if (ext === "pdf") return "pdf";
    return "other";
  };

  const compressImageFile = (file, targetSize = 500, quality = 0.82) => {
    return new Promise((resolve) => {
      if (
        !file.type.startsWith("image/") ||
        file.type === "image/svg+xml" ||
        file.type === "image/gif"
      ) {
        const reader = new FileReader();
        reader.onload = (e) =>
          resolve({ dataUrl: e.target.result, size: file.size });
        reader.onerror = () => resolve({ dataUrl: "", size: 0 });
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Resize gambar besar maupun kecil secara proporsional ke 500px
          if (width >= height) {
            height = Math.round((height * targetSize) / width);
            width = targetSize;
          } else {
            width = Math.round((width * targetSize) / height);
            height = targetSize;
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL("image/jpeg", quality);
          const approxSize = Math.round((compressedDataUrl.length * 3) / 4);
          resolve({ dataUrl: compressedDataUrl, size: approxSize });
        };
        img.onerror = () =>
          resolve({ dataUrl: e.target.result, size: file.size });
        img.src = e.target.result;
      };
      reader.onerror = () => resolve({ dataUrl: "", size: 0 });
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files) => {
    setErrorMsg("");
    const fileList = Array.from(files);
    if (fileList.length === 0) return;

    const newItems = [];
    for (const file of fileList) {
      const ext = getFileExtension(file.name);
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrorMsg(
          `Format file "${file.name}" tidak didukung. Harap upload Excel (.xlsx, .xls), Gambar (.jpg, .png), atau PDF.`,
        );
        continue;
      }

      if (file.size > maxFileSizeMB * 1024 * 1024) {
        setErrorMsg(
          `Ukuran file "${file.name}" melebihi batas maksimal ${maxFileSizeMB} MB.`,
        );
        continue;
      }

      const isImg = ["jpg", "jpeg", "png", "webp"].includes(ext);
      let fileDataUrl = "";
      let finalSize = file.size;

      if (isImg) {
        const res = await compressImageFile(file);
        fileDataUrl = res.dataUrl;
        finalSize = res.size;
      } else {
        fileDataUrl = await new Promise((res) => {
          const reader = new FileReader();
          reader.onload = (e) => res(e.target.result);
          reader.onerror = () => res("");
          reader.readAsDataURL(file);
        });
      }

      // Upload ke backend API dan simpan fisik ke public/lampiran
      let fileUrl = "";
      try {
        const uploadRes = await api.uploadLampiran({
          fileName: file.name,
          fileType: isImg ? "image/jpeg" : file.type || "application/octet-stream",
          dataUrl: fileDataUrl,
        });
        if (uploadRes && uploadRes.success && uploadRes.url) {
          fileUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn("Upload lampiran ke server gagal, fallback ke data lokal:", err);
      }

      if (fileDataUrl || fileUrl) {
        newItems.push({
          id: generateId("att"),
          name: file.name,
          size: finalSize,
          type: isImg ? "image/jpeg" : file.type || "application/octet-stream",
          extension: isImg ? "jpg" : ext,
          category: getFileCategory(ext),
          url: fileUrl || fileDataUrl,
          dataUrl: fileUrl || fileDataUrl,
          uploadedAt: new Date().toISOString(),
        });
      }
    }

    if (newItems.length > 0 && onChange) {
      onChange([...attachments, ...newItems]);
    }
  };

  const handleRemove = (id, e) => {
    e.stopPropagation();
    if (readOnly) return;
    if (onChange) {
      onChange(attachments.filter((a) => a.id !== id));
    }
  };

  const handleDownload = (att, e) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = att.url || att.dataUrl;
    link.download = att.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (readOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-3">
      {/* Upload Zone (Only visible in edit mode) */}
      {!readOnly && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition duration-150 ${
            dragActive
              ? "border-indigo-500 bg-indigo-50/50"
              : "border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.jpg,.jpeg,.png,.webp,.pdf"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-1.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs text-slate-700">
              <span className="font-bold text-indigo-600 hover:underline">
                Klik untuk upload file
              </span>{" "}
              atau drag & drop file ke sini
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              Mendukung: <strong>Excel (.xlsx, .xls)</strong>,{" "}
              <strong>Gambar (.jpg, .png)</strong>, dan <strong>PDF</strong>{" "}
              (Maks. {maxFileSizeMB} MB)
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Attachment List / Cards */}
      {attachments.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {attachments.map((att) => {
            const isExcel = att.category === "excel";
            const isImage = att.category === "image";
            const isPdf = att.category === "pdf";

            return (
              <div
                key={att.id}
                className="bg-white border border-slate-300 rounded-xl p-2.5 shadow-sm hover:shadow-md transition flex items-center gap-2.5 group overflow-hidden"
              >
                {/* File Thumbnail / Icon */}
                <div className="w-11 h-11 rounded-lg shrink-0 overflow-hidden flex items-center justify-center border border-slate-200 bg-slate-50">
                  {isImage && (att.url || att.dataUrl) ? (
                    <img
                      src={att.url || att.dataUrl}
                      alt={att.name}
                      onDoubleClick={() => setPreviewImage(att)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition duration-150 select-none"
                      title="Double-klik untuk perbesar gambar (klik sekali tidak memperbesar)"
                    />
                  ) : isExcel ? (
                    <div className="flex flex-col items-center justify-center text-emerald-600">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">
                        XLS
                      </span>
                    </div>
                  ) : isPdf ? (
                    <div className="flex flex-col items-center justify-center text-rose-600">
                      <FileText className="w-5 h-5" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">
                        PDF
                      </span>
                    </div>
                  ) : (
                    <File className="w-5 h-5 text-slate-500" />
                  )}
                </div>

                {/* File Meta */}
                <div className="flex-1 min-w-0 leading-tight">
                  <span
                    className="block font-bold text-slate-800 text-xs truncate"
                    title={att.name}
                  >
                    {att.name}
                  </span>
                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500">
                    <span className="font-medium">{formatBytes(att.size)}</span>
                    <span className="uppercase px-1.5 py-0.2 bg-slate-100 rounded text-[9px] font-bold text-slate-600">
                      {att.extension}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {isImage && (
                    <button
                      type="button"
                      onClick={() => setPreviewImage(att)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-md transition"
                      title="Lihat Gambar"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDownload(att, e)}
                    className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition"
                    title="Unduh Berkas Lampiran"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={(e) => handleRemove(att.id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="Hapus Lampiran"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : readOnly ? (
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500 font-medium">
          Tidak ada berkas lampiran pendukung.
        </div>
      ) : null}

      {/* Image Preview Modal (Lightbox) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200"
          >
            <div className="p-3 px-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <span className="font-bold text-xs text-slate-800 truncate">
                {previewImage.name}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => handleDownload(previewImage, e)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh</span>
                </button>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-900/5">
              <img
                src={previewImage.url || previewImage.dataUrl}
                alt={previewImage.name}
                className="max-h-[70vh] w-auto object-contain rounded-lg shadow-sm"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
