import React, { useRef, useEffect, useState, useCallback } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import FontFamily from "@tiptap/extension-font-family";

// Custom TipTap Table: Mendukung Tabel Bergaris (Data) dan Tanpa Garis (Kop/Layout Surat)
const CustomTable = Table.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      borderless: {
        default: false,
        parseHTML: (element) => {
          const style = element.getAttribute("style") || "";
          const border = element.getAttribute("border");
          const cls = element.getAttribute("class") || "";
          const dataBorderless = element.getAttribute("data-borderless");
          if (
            dataBorderless === "true" ||
            cls.includes("borderless") ||
            cls.includes("header-table") ||
            border === "0" ||
            style.includes("border: none") ||
            style.includes("border:none") ||
            style.includes("border: 0")
          ) {
            return true;
          }
          // Deteksi otomatis tabel header surat resmi (ada Nomor dan Perihal/Kepada/Lampiran)
          const text = element.textContent || "";
          if (
            (text.includes("Nomor") && text.includes("Perihal")) ||
            (text.includes("Nomor") && text.includes("Kepada")) ||
            (text.includes("Nomor") && text.includes("Lampiran"))
          ) {
            if (border !== "1" && !style.includes("border: 1px")) {
              return true;
            }
          }
          return false;
        },
        renderHTML: (attributes) => {
          if (!attributes.borderless) {
            return {
              border: "1",
              "data-borderless": "false",
              class: "data-table",
              style: "width: 100%; border-collapse: collapse; margin: 12px 0;",
            };
          }
          return {
            "data-borderless": "true",
            class: "borderless-table",
            border: "0",
            style:
              "width: 100%; border: none; border-collapse: collapse; margin: 4px 0 14px 0;",
          };
        },
      },
    };
  },
});

const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          if (colwidth) {
            return colwidth.split(",").map((item) => parseInt(item, 10));
          }
          const text = (element.textContent || "").trim();
          if (text === ":") {
            return [28];
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.colwidth) return {};
          return {
            colwidth: attributes.colwidth.join(","),
          };
        },
      },
    };
  },
});

const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      colwidth: {
        default: null,
        parseHTML: (element) => {
          const colwidth = element.getAttribute("colwidth");
          if (colwidth) {
            return colwidth.split(",").map((item) => parseInt(item, 10));
          }
          return null;
        },
        renderHTML: (attributes) => {
          if (!attributes.colwidth) return {};
          return {
            colwidth: attributes.colwidth.join(","),
          };
        },
      },
    };
  },
});
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  RotateCcw,
  RotateCw,
  Layout,
  Columns,
  Plus,
  Trash2,
  Grid,
  ZoomIn,
  ZoomOut,
  Highlighter,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  X,
  Split,
  Merge,
  Sparkles,
  Clipboard,
} from "lucide-react";

export default function RichEditor({
  value,
  onChange,
  readOnly = false,
  availableVariables = [],
  letterNumber = "",
  perihal = "",
  submitterName = "",
  submitterPosition = "",
  isFullscreen = false,
  onSave = null,
  onClose = null,
}) {
  const paperRef = useRef(null);

  // Ribbon Word Tabs: 'home' | 'insert' | 'layout' | 'table'
  const [activeTab, setActiveTab] = useState("home");
  const [zoomLevel, setZoomLevel] = useState(105);
  const [fontFamily, setFontFamily] = useState("Calibri");
  const [fontSize, setFontSize] = useState("11pt");
  const [wordCount, setWordCount] = useState(0);

  // Excel Modal
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState("");
  const [excelHeaderFirstRow, setExcelHeaderFirstRow] = useState(true);

  // Inisialisasi Mesin TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: true,
      }),
      CustomTable.configure({
        resizable: true,
        lastColumnResizable: false,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      FontFamily,
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (onChange) onChange(html);
      const text = editor.getText() || "";
      setWordCount(
        text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0,
      );
    },
  });

  // Sinkronisasi value prop ke editor jika konten berubah dari luar
  useEffect(() => {
    if (editor && value !== undefined && editor.getHTML() !== value) {
      editor.commands.setContent(value || "", false);
      const text = editor.getText() || "";
      setWordCount(
        text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0,
      );
    }
  }, [value, editor]);

  // Global Keyboard Shortcuts (Ctrl+S, Ctrl+P)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        if (onSave) onSave();
      } else if (key === "p") {
        e.preventDefault();
        window.print();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [onSave]);

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(200, prev + 10));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(50, prev - 10));
  const handleZoomReset = () => setZoomLevel(100);

  // TipTap Format Actions
  const toggleBold = () => editor?.chain().focus().toggleBold().run();
  const toggleItalic = () => editor?.chain().focus().toggleItalic().run();
  const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run();
  const toggleStrike = () => editor?.chain().focus().toggleStrike().run();

  const setAlign = (align) => editor?.chain().focus().setTextAlign(align).run();
  const toggleBulletList = () =>
    editor?.chain().focus().toggleBulletList().run();
  const toggleOrderedList = () =>
    editor?.chain().focus().toggleOrderedList().run();

  const handleUndo = () => editor?.chain().focus().undo().run();
  const handleRedo = () => editor?.chain().focus().redo().run();

  const applyFontFamily = (family) => {
    setFontFamily(family);
    editor?.chain().focus().setFontFamily(family).run();
  };

  const applyFontColor = (hex) => {
    if (!hex) return;
    editor?.chain().focus().setColor(hex).run();
  };

  const applyHighlight = (hex) => {
    if (!hex) return;
    editor?.chain().focus().toggleHighlight({ color: hex }).run();
  };

  // TipTap Table Actions
  const insertTable = (rows = 3, cols = 3) => {
    if (!editor || readOnly) return;
    editor
      .chain()
      .focus()
      .insertTable({ rows, cols, withHeaderRow: true })
      .run();
  };

  const addRowAbove = () => editor?.chain().focus().addRowBefore().run();
  const addRowBelow = () => editor?.chain().focus().addRowAfter().run();
  const deleteCurrentRow = () => editor?.chain().focus().deleteRow().run();

  const addColLeft = () => editor?.chain().focus().addColumnBefore().run();
  const addColRight = () => editor?.chain().focus().addColumnAfter().run();
  const deleteCurrentCol = () => editor?.chain().focus().deleteColumn().run();

  const deleteTable = () => editor?.chain().focus().deleteTable().run();
  const toggleTableBorder = () => {
    if (!editor) return;
    const isCurrentBorderless = Boolean(
      editor.getAttributes("table")?.borderless,
    );
    editor
      .chain()
      .focus()
      .updateAttributes("table", { borderless: !isCurrentBorderless })
      .run();
  };
  const mergeOrSplit = () => {
    if (!editor) return;
    if (editor.can().mergeCells()) {
      editor.chain().focus().mergeCells().run();
    } else if (editor.can().splitCell()) {
      editor.chain().focus().splitCell().run();
    }
  };

  // Header Surat Resmi Otomatis
  const insertOfficialHeader = () => {
    if (!editor || readOnly) return;
    const numDisplay = letterNumber || "{{nomor_surat}}";
    const perihalDisplay =
      perihal && perihal.trim() ? perihal.trim() : "Permohonan";
    const dariDisplay = submitterName || "[Nama Pemohon]";

    const html = `
<table data-borderless="true" class="borderless-table" style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px; font-family: Tahoma, Arial, sans-serif; font-size: 11pt; table-layout: fixed;">
  <tbody>
    <tr>
      <td style="width: 15%; vertical-align: top; padding: 2px 4px; border: none;"><strong>Nomor</strong></td>
      <td style="width: 3%; vertical-align: top; padding: 2px 4px; border: none; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #000000; background-color: #f8fafc; padding: 1px 5px; border-radius: 3px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi otomatis dari sistem (Terkunci)">${numDisplay}</span></td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><strong>Lampiran</strong></td>
      <td style="vertical-align: top; padding: 2px 4px; border: none; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 2px 4px; border: none;">-</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><strong>Perihal</strong></td>
      <td style="vertical-align: top; padding: 2px 4px; border: none; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><strong>${perihalDisplay}</strong></td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><strong>Dari</strong></td>
      <td style="vertical-align: top; padding: 2px 4px; border: none; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 2px 4px; border: none;">${dariDisplay}</td>
    </tr>
    <tr>
      <td style="vertical-align: top; padding: 2px 4px; border: none;"><strong>Kepada</strong></td>
      <td style="vertical-align: top; padding: 2px 4px; border: none; text-align: center;">:</td>
      <td style="vertical-align: top; padding: 2px 4px; border: none;">Yth. [Pimpinan / Manajer Terkait]</td>
    </tr>
  </tbody>
</table>
<p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertFieldRowLayout = () => {
    if (!editor || readOnly) return;
    const html = `
<table data-borderless="true" class="borderless-table" style="width: 100%; border: none; border-collapse: collapse; margin: 12px 0; font-family: Tahoma, Arial, sans-serif; font-size: 11pt; line-height: 1.6; table-layout: fixed;">
  <tbody>
    <tr>
      <td style="width: 25%; padding: 2px 4px; border: none;">Nama Lengkap</td>
      <td style="width: 3%; text-align: center; padding: 2px 4px; border: none;">:</td>
      <td style="padding: 2px 4px; border: none;"><strong>[Isi Nama]</strong></td>
    </tr>
    <tr>
      <td style="padding: 2px 4px; border: none;">Jabatan / Unit</td>
      <td style="text-align: center; padding: 2px 4px; border: none;">:</td>
      <td style="padding: 2px 4px; border: none;">[Isi Jabatan]</td>
    </tr>
    <tr>
      <td style="padding: 2px 4px; border: none;">Unit Kerja / Cabang</td>
      <td style="text-align: center; padding: 2px 4px; border: none;">:</td>
      <td style="padding: 2px 4px; border: none;">{{nama_cabang}}</td>
    </tr>
    <tr>
      <td style="padding: 2px 4px; vertical-align: top; border: none;">Keterangan / Keperluan</td>
      <td style="text-align: center; padding: 2px 4px; vertical-align: top; border: none;">:</td>
      <td style="padding: 2px 4px; vertical-align: top; border: none;">[Uraikan keperluan di sini...]</td>
    </tr>
  </tbody>
</table>
<p></p>`;
    editor.chain().focus().insertContent(html).run();
  };

  const insertVariable = (varKey) => {
    if (!editor || readOnly) return;
    if (varKey === "nomor_surat") {
      const numDisplay = letterNumber || "{{nomor_surat}}";
      const badge = `<span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #000000; background-color: #f8fafc; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi (Terkunci)">${numDisplay}</span>&nbsp;`;
      editor.chain().focus().insertContent(badge).run();
    } else {
      editor.chain().focus().insertContent(`{{${varKey}}}`).run();
    }
  };

  const insertImage = () => {
    if (!editor || readOnly) return;
    const url = prompt(
      "Masukkan URL Gambar:",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    );
    if (url) {
      editor
        .chain()
        .focus()
        .insertContent(
          `<p style="text-align:center;"><img src="${url}" alt="Lampiran" style="max-width:80%; border-radius:4px;" /></p><p></p>`,
        )
        .run();
    }
  };

  // Paste dari Excel TSV
  const insertExcelTableFromModal = () => {
    if (!excelPasteText.trim() || !editor) return;
    const lines = excelPasteText.trim().split(/\r\n|\r|\n/);
    if (lines.length === 0) return;

    const matrix = lines.map((line) => line.split("\t"));
    const maxCols = Math.max(...matrix.map((r) => r.length));
    const widthPct = (100 / maxCols).toFixed(1);

    let html = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1; font-family: inherit; font-size: 11pt; table-layout: fixed;"><tbody>`;
    matrix.forEach((row, rowIdx) => {
      html += `<tr>`;
      for (let c = 0; c < maxCols; c++) {
        const val = row[c] !== undefined ? row[c].trim() : "";
        const cleanVal = val
          ? val.replace(/</g, "&lt;").replace(/>/g, "&gt;")
          : "<br>";
        let align = "text-align: left;";
        if (
          val &&
          !isNaN(val.replace(/[.,%Rp\s]/g, "")) &&
          !/[a-zA-Z]/.test(val)
        ) {
          align = "text-align: right;";
        }
        if (rowIdx === 0 && excelHeaderFirstRow) {
          html += `<th style="width:${widthPct}%; border:1px solid #cbd5e1; padding:6px 10px; background-color:#f1f5f9; font-weight:bold; ${align}">${cleanVal}</th>`;
        } else {
          html += `<td style="width:${widthPct}%; border:1px solid #cbd5e1; padding:6px 10px; ${align}">${cleanVal}</td>`;
        }
      }
      html += `</tr>`;
    });
    html += `</tbody></table><p></p>`;

    editor.chain().focus().insertContent(html).run();
    setShowExcelModal(false);
    setExcelPasteText("");
  };

  const handleRibbonPaste = async () => {
    if (readOnly || !editor) return;
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (text.includes("\t")) {
            setExcelPasteText(text);
            setShowExcelModal(true);
            return;
          }
          editor
            .chain()
            .focus()
            .insertContent(text.replace(/\r\n/g, "\n"))
            .run();
          return;
        }
      }
    } catch (err) {
      console.warn("Clipboard access:", err);
    }
  };

  const isTableActive = Boolean(editor?.isActive("table"));

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-[#e9ecef] flex flex-col h-screen w-screen overflow-hidden animate-fadeIn select-none font-sans"
    : "bg-[#f3f4f6] border border-slate-300 rounded-lg overflow-hidden shadow-xl flex flex-col font-sans select-none";

  return (
    <div className={containerClasses}>
      {/* 1. TITLE BAR MICROSOFT WORD (#2b579a) */}
      <div className="bg-[#2b579a] text-white px-3 py-1.5 flex items-center justify-between text-xs shadow-xs shrink-0 select-none">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#185abd] text-white rounded flex items-center justify-center font-bold text-[11px] shadow-2xs border border-white/20">
            W
          </div>
          <div className="flex items-center gap-1 border-r border-white/20 pr-2">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!editor?.can().undo()}
              className="p-1 hover:bg-white/15 disabled:opacity-40 rounded text-white transition"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!editor?.can().redo()}
              className="p-1 hover:bg-white/15 disabled:opacity-40 rounded text-white transition"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            {onSave && (
              <button
                type="button"
                onClick={onSave}
                className="p-1 hover:bg-white/15 rounded text-white/90 hover:text-white transition"
                title="Simpan Draft (Ctrl+S)"
              >
                <Save className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <span className="font-semibold text-xs tracking-wide truncate max-w-sm">
            {letterNumber || perihal || "Dokumen1"} - Microsoft Word (TipTap
            Engine)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition border border-white/20 shadow-xs"
              title="Simpan draft surat"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simpan Draft</span>
            </button>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1.5 transition shadow-xs"
              title="Selesai & kembali ke review surat"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selesai &amp; Review</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. RIBBON TABS */}
      <div className="bg-[#2b579a] text-white px-3 flex items-center gap-0.5 text-xs select-none border-t border-[#185abd]">
        <button
          type="button"
          onClick={() => setActiveTab("home")}
          className={`px-3.5 py-1.5 font-medium transition ${
            activeTab === "home"
              ? "bg-[#f3f4f6] text-[#2b579a] font-bold rounded-t-sm shadow-2xs"
              : "text-white/90 hover:bg-white/10 rounded-t-sm"
          }`}
        >
          Beranda (Home)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("insert")}
          className={`px-3.5 py-1.5 font-medium transition ${
            activeTab === "insert"
              ? "bg-[#f3f4f6] text-[#2b579a] font-bold rounded-t-sm shadow-2xs"
              : "text-white/90 hover:bg-white/10 rounded-t-sm"
          }`}
        >
          Sisipkan (Insert)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("layout")}
          className={`px-3.5 py-1.5 font-medium transition ${
            activeTab === "layout"
              ? "bg-[#f3f4f6] text-[#2b579a] font-bold rounded-t-sm shadow-2xs"
              : "text-white/90 hover:bg-white/10 rounded-t-sm"
          }`}
        >
          Tata Letak (Layout)
        </button>

        {isTableActive && (
          <button
            type="button"
            onClick={() => setActiveTab("table")}
            className={`px-3.5 py-1.5 font-bold transition flex items-center gap-1.5 ml-2 ${
              activeTab === "table"
                ? "bg-[#f3f4f6] text-indigo-700 rounded-t-sm shadow-2xs border-t-2 border-indigo-600"
                : "bg-indigo-900/60 text-indigo-100 hover:bg-indigo-900/80 rounded-t-sm"
            }`}
          >
            <Grid className="w-3.5 h-3.5 text-amber-300" />
            <span>Alat Tabel (Table Tools)</span>
          </button>
        )}
      </div>

      {/* 3. RIBBON COMMAND TOOLBAR */}
      {!readOnly && (
        <div className="bg-[#f3f4f6] border-b border-slate-300 p-2 select-none shadow-2xs">
          {activeTab === "home" && (
            <div className="flex flex-wrap items-center gap-2">
              {/* GROUP: CLIPBOARD */}
              <div className="flex flex-col items-center border-r border-slate-300 pr-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleRibbonPaste}
                    className="p-1 text-slate-700 hover:bg-slate-200 rounded flex flex-col items-center gap-0.5 text-[10px]"
                    title="Paste dari Clipboard"
                  >
                    <Clipboard className="w-4 h-4 text-amber-600" />
                    <span>Paste</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExcelModal(true)}
                    className="p-1 text-emerald-800 hover:bg-emerald-100 rounded flex flex-col items-center gap-0.5 text-[10px] font-semibold border border-emerald-300 bg-emerald-50"
                    title="Paste Tabel Excel"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Excel</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">
                  Papan Klip
                </span>
              </div>

              {/* GROUP: FONT */}
              <div className="flex flex-col items-center border-r border-slate-300 pr-2">
                <div className="flex items-center gap-1">
                  <select
                    value={fontFamily}
                    onChange={(e) => applyFontFamily(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 font-medium w-28"
                  >
                    <option value="Calibri">Calibri</option>
                    <option value="Arial">Arial</option>
                    <option value="Tahoma">Tahoma</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  </select>

                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-800 font-medium w-16"
                  >
                    <option value="9pt">9</option>
                    <option value="10pt">10</option>
                    <option value="11pt">11</option>
                    <option value="12pt">12</option>
                    <option value="14pt">14</option>
                    <option value="16pt">16</option>
                  </select>
                </div>

                <div className="flex items-center gap-0.5 mt-1">
                  <button
                    type="button"
                    onClick={toggleBold}
                    className={`p-1 rounded ${editor?.isActive("bold") ? "bg-slate-300 text-blue-700 font-bold" : "hover:bg-slate-200 text-slate-700"}`}
                    title="Tebal (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleItalic}
                    className={`p-1 rounded ${editor?.isActive("italic") ? "bg-slate-300 text-blue-700 font-bold" : "hover:bg-slate-200 text-slate-700"}`}
                    title="Miring (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleUnderline}
                    className={`p-1 rounded ${editor?.isActive("underline") ? "bg-slate-300 text-blue-700 font-bold" : "hover:bg-slate-200 text-slate-700"}`}
                    title="Garis Bawah (Ctrl+U)"
                  >
                    <UnderlineIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleStrike}
                    className={`p-1 rounded ${editor?.isActive("strike") ? "bg-slate-300 text-blue-700" : "hover:bg-slate-200 text-slate-700"}`}
                    title="Coret"
                  >
                    <Strikethrough className="w-3.5 h-3.5" />
                  </button>

                  <span className="text-slate-300 mx-0.5">|</span>

                  <label
                    className="p-1 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-0.5"
                    title="Highlight"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                    <input
                      type="color"
                      defaultValue="#fef08a"
                      onChange={(e) => applyHighlight(e.target.value)}
                      className="w-3 h-3 p-0 border-0 rounded cursor-pointer bg-transparent"
                    />
                  </label>

                  <label
                    className="p-1 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-0.5"
                    title="Warna Font"
                  >
                    <span className="text-xs font-bold text-red-600 underline">
                      A
                    </span>
                    <input
                      type="color"
                      defaultValue="#000000"
                      onChange={(e) => applyFontColor(e.target.value)}
                      className="w-3 h-3 p-0 border-0 rounded cursor-pointer bg-transparent"
                    />
                  </label>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">
                  Huruf (Font)
                </span>
              </div>

              {/* GROUP: PARAGRAPH */}
              <div className="flex flex-col items-center border-r border-slate-300 pr-2">
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={() => setAlign("left")}
                    className={`p-1 rounded ${editor?.isActive({ textAlign: "left" }) ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Rata Kiri"
                  >
                    <AlignLeft className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign("center")}
                    className={`p-1 rounded ${editor?.isActive({ textAlign: "center" }) ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Rata Tengah"
                  >
                    <AlignCenter className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign("right")}
                    className={`p-1 rounded ${editor?.isActive({ textAlign: "right" }) ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Rata Kanan"
                  >
                    <AlignRight className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setAlign("justify")}
                    className={`p-1 rounded ${editor?.isActive({ textAlign: "justify" }) ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Rata Kanan Kiri"
                  >
                    <AlignJustify className="w-3.5 h-3.5 text-slate-700" />
                  </button>

                  <span className="text-slate-300 mx-0.5">|</span>

                  <button
                    type="button"
                    onClick={toggleBulletList}
                    className={`p-1 rounded ${editor?.isActive("bulletList") ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Bullet"
                  >
                    <List className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                  <button
                    type="button"
                    onClick={toggleOrderedList}
                    className={`p-1 rounded ${editor?.isActive("orderedList") ? "bg-slate-300" : "hover:bg-slate-200"}`}
                    title="Nomor"
                  >
                    <ListOrdered className="w-3.5 h-3.5 text-slate-700" />
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">
                  Paragraf
                </span>
              </div>

              {/* GROUP: TEMPLATE RESMI */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={insertOfficialHeader}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                    title="Sisipkan Kop Header Resmi"
                  >
                    <Layout className="w-3.5 h-3.5 text-blue-600" />
                    <span>Header Surat</span>
                  </button>
                  <button
                    type="button"
                    onClick={insertFieldRowLayout}
                    className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                    title="Sisipkan Kolom Biodata Rapi"
                  >
                    <Columns className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Kolom Rapi (Tab)</span>
                  </button>
                </div>
                <span className="text-[9px] text-slate-400 font-medium mt-1">
                  Format Surat Resmi
                </span>
              </div>
            </div>
          )}

          {activeTab === "insert" && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3">
                <button
                  type="button"
                  onClick={() => insertTable(3, 3)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                  title="Sisipkan Tabel 3x3"
                >
                  <TableIcon className="w-4 h-4 text-emerald-600" />
                  <span>Tabel (3x3)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const r = prompt("Jumlah Baris:", "3");
                    const c = prompt("Jumlah Kolom:", "3");
                    if (r && c) insertTable(parseInt(r, 10), parseInt(c, 10));
                  }}
                  className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-800 shadow-2xs"
                >
                  Kustom...
                </button>
                <button
                  type="button"
                  onClick={() => setShowExcelModal(true)}
                  className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 text-emerald-800 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Paste Excel</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 border-r border-slate-300 pr-3">
                <button
                  type="button"
                  onClick={insertImage}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs font-semibold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <ImageIcon className="w-4 h-4 text-sky-600" />
                  <span>Gambar</span>
                </button>
              </div>

              {availableVariables.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-600">
                    Variabel:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {availableVariables.slice(0, 5).map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="px-2 py-1 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded text-[11px] font-medium shadow-2xs"
                      >
                        +{v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "layout" && (
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Ukuran Kertas:</span>
                <span className="bg-white border border-slate-300 px-2.5 py-1 rounded font-semibold text-slate-800">
                  A4 (210 x 297 mm)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Batas Margin:</span>
                <span className="bg-white border border-slate-300 px-2.5 py-1 rounded font-semibold text-slate-800">
                  Normal (2.5 cm)
                </span>
              </div>
            </div>
          )}

          {/* TAB KONTEKSTUAL ALAT TABEL (TIPTAP ENGINE) */}
          {(activeTab === "table" || isTableActive) && (
            <div className="bg-indigo-50/90 -m-2 mt-1.5 p-2 border-t border-indigo-200 flex flex-wrap items-center gap-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-1 font-bold text-indigo-900 pr-2 border-r border-indigo-200">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>Alat Tabel:</span>
              </div>

              {/* Baris & Kolom */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={addRowAbove}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah baris di atas kursor"
                >
                  + Baris Atas
                </button>
                <button
                  type="button"
                  onClick={addRowBelow}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah baris di bawah kursor"
                >
                  + Baris Bawah
                </button>
                <button
                  type="button"
                  onClick={addColLeft}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah kolom di kiri"
                >
                  + Kolom Kiri
                </button>
                <button
                  type="button"
                  onClick={addColRight}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah kolom di kanan"
                >
                  + Kolom Kanan
                </button>
              </div>

              {/* Sel Gabung / Pecah */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={mergeOrSplit}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Gabung / Pecah Sel"
                >
                  Gabung / Pecah Sel
                </button>
              </div>

              {/* Mode Garis Tabel (Bergaris vs Tanpa Garis) */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={toggleTableBorder}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition ${
                    editor?.getAttributes("table")?.borderless
                      ? "bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                      : "hover:bg-indigo-50 text-slate-700"
                  }`}
                  title="Ubah garis tabel: Bergaris (Tabel Data) atau Tanpa Garis (Kop Surat & Formulir Rapi)"
                >
                  <Grid className="w-3.5 h-3.5 text-indigo-600" />
                  <span>
                    {editor?.getAttributes("table")?.borderless
                      ? "Garis: Tanpa Garis (Rapi)"
                      : "Garis: Bergaris (Kotak)"}
                  </span>
                </button>
              </div>

              {/* Hapus Baris / Kolom / Tabel */}
              <div className="flex items-center gap-1 bg-white border border-rose-200 rounded p-0.5 shadow-2xs ml-auto">
                <button
                  type="button"
                  onClick={deleteCurrentRow}
                  className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium"
                  title="Hapus baris kursor"
                >
                  Hapus Baris
                </button>
                <button
                  type="button"
                  onClick={deleteCurrentCol}
                  className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium"
                  title="Hapus kolom kursor"
                >
                  Hapus Kolom
                </button>
                <button
                  type="button"
                  onClick={deleteTable}
                  className="px-2 py-0.5 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-bold flex items-center gap-1"
                  title="Hapus seluruh tabel"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Hapus Tabel</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. PENGGARIS WORD (RULER) */}
      <div className="bg-[#e9ecef] border-b border-slate-300 flex justify-center overflow-x-hidden select-none py-0.5 shrink-0">
        <div
          style={{
            width: `${Math.round(820 * (zoomLevel / 100))}px`,
            maxWidth: "100%",
          }}
          className="h-5 bg-white border-x border-slate-300 relative flex items-center justify-between text-[9px] font-mono text-slate-500 shadow-2xs"
        >
          <div className="w-12 h-full bg-slate-200 border-r border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
            2.5 cm
          </div>
          <div className="flex-1 flex justify-between px-3 text-slate-400 font-sans tracking-widest text-[9px]">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
            <span>6</span>
            <span>7</span>
            <span>8</span>
            <span>9</span>
            <span>10</span>
            <span>11</span>
            <span>12</span>
            <span>13</span>
            <span>14</span>
            <span>15</span>
            <span>16</span>
            <span>17</span>
            <span>18</span>
          </div>
          <div className="w-12 h-full bg-slate-200 border-l border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
            2.5 cm
          </div>
        </div>
      </div>

      {/* 5. A4 PAPER SHEET WORKSPACE */}
      <div
        className={`bg-[#e9ecef] p-4 sm:p-8 flex justify-center relative ${
          isFullscreen
            ? "flex-1 overflow-y-auto"
            : "min-h-[580px] overflow-x-auto"
        }`}
      >
        <div
          ref={paperRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.12s ease-out",
            marginBottom:
              zoomLevel > 100 ? `${(zoomLevel - 100) * 8}px` : "20px",
          }}
          className="bg-white w-full max-w-[820px] min-h-[1050px] p-10 sm:p-14 shadow-2xl rounded-xs border border-slate-300/80 relative text-black"
        >
          <div className="absolute top-3 right-4 text-[10px] text-slate-400 font-mono select-none">
            Lembar Surat Resmi &bull; TipTap Document Engine
          </div>

          <style>{`
            .tiptap-paper {
              font-family: ${fontFamily}, Calibri, Tahoma, Arial, sans-serif;
              font-size: ${fontSize};
              color: #000000 !important;
            }
            .tiptap-paper .ProseMirror {
              outline: none;
              min-height: 900px;
              color: #000000 !important;
            }
            .tiptap-paper .ProseMirror p {
              margin-top: 0;
              margin-bottom: 6px;
              line-height: 1.4;
              color: #000000 !important;
            }
            /* Table ProseMirror Styles */
            .tiptap-paper .ProseMirror table {
              border-collapse: collapse;
              width: 100%;
              table-layout: fixed;
            }

            /* 1. DATA TABLES (BERGARIS): Tabel data biasa, matriks nominal, tabel excel */
            .tiptap-paper .ProseMirror table:not([data-borderless="true"]) {
              margin: 12px 0;
              border: 1px solid #94a3b8;
            }
            .tiptap-paper .ProseMirror table:not([data-borderless="true"]) td,
            .tiptap-paper .ProseMirror table:not([data-borderless="true"]) th {
              min-width: 28px;
              border: 1px solid #94a3b8;
              padding: 6px 10px;
              vertical-align: top;
              box-sizing: border-box;
              position: relative;
              color: #000000;
            }
            .tiptap-paper .ProseMirror table:not([data-borderless="true"]) th {
              font-weight: bold;
              background-color: #f1f5f9;
            }

            /* 2. LAYOUT & HEADER SURAT TABLES (TANPA GARIS / BORDERLESS): Rapi, rapat, sejajar, tanpa kotak */
            .tiptap-paper .ProseMirror table[data-borderless="true"],
            .tiptap-paper .ProseMirror table.borderless-table {
              border: none !important;
              margin: 4px 0 14px 0 !important;
            }
            .tiptap-paper .ProseMirror table[data-borderless="true"] td,
            .tiptap-paper .ProseMirror table[data-borderless="true"] th,
            .tiptap-paper .ProseMirror table.borderless-table td,
            .tiptap-paper .ProseMirror table.borderless-table th {
              border: none !important;
              outline: none !important;
              padding: 2px 4px !important;
              vertical-align: top !important;
              box-sizing: border-box;
              position: relative;
              color: #000000;
              background-color: transparent !important;
            }
            .tiptap-paper .ProseMirror table[data-borderless="true"] p,
            .tiptap-paper .ProseMirror table.borderless-table p {
              margin: 0 !important;
              padding: 0 !important;
              line-height: 1.4 !important;
              color: #000000 !important;
            }

            /* Kunci proporsionalitas kolom Header Surat agar tanda titik dua (:) rapat dan rapi */
            .tiptap-paper .ProseMirror table[data-borderless="true"] tr td:first-child,
            .tiptap-paper .ProseMirror table.borderless-table tr td:first-child {
              width: 130px !important;
              max-width: 150px !important;
              white-space: nowrap !important;
            }
            .tiptap-paper .ProseMirror table[data-borderless="true"] tr td:nth-child(2),
            .tiptap-paper .ProseMirror table.borderless-table tr td:nth-child(2) {
              width: 25px !important;
              max-width: 30px !important;
              text-align: center !important;
              padding: 2px 2px !important;
            }
            .tiptap-paper .ProseMirror table[data-borderless="true"] tr td:last-child,
            .tiptap-paper .ProseMirror table.borderless-table tr td:last-child {
              width: auto !important;
            }

            /* Panduan garis titik sangat halus hanya saat cursor diarahkan ke tabel agar tahu batas sel saat mengetik */
            .tiptap-paper .ProseMirror table[data-borderless="true"]:hover td {
              outline: 1px dashed rgba(203, 213, 225, 0.7);
            }

            /* ProseMirror Rectangular Cell Selection - Solves cross-column bleeding! */
            .tiptap-paper .ProseMirror .selectedCell:after {
              z-index: 2;
              position: absolute;
              content: "";
              left: 0; right: 0; top: 0; bottom: 0;
              background: rgba(59, 130, 246, 0.22);
              pointer-events: none;
            }
            .tiptap-paper .ProseMirror .column-resize-handle {
              position: absolute;
              right: -2px;
              top: 0;
              bottom: 0;
              width: 4px;
              background-color: #3b82f6;
              pointer-events: none;
            }
            .tiptap-paper .locked-letter-number {
              color: #000000 !important;
            }
          `}</style>

          <div className="tiptap-paper select-text">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>

      {/* 6. STATUS BAR */}
      <div className="bg-[#2b579a] text-white px-4 py-1 text-xs flex items-center justify-between shadow-inner shrink-0 select-none">
        <div className="flex items-center gap-3 text-[11px] text-white/90">
          <span>Halaman 1 dari 1</span>
          <span>&bull;</span>
          <span>{wordCount} kata</span>
          <span>&bull;</span>
          <span>Indonesia</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-white/15 rounded text-white transition"
            title="Zoom Out (-10%)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <input
            type="range"
            min="60"
            max="160"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-24 sm:w-28 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-white"
            title="Zoom Kertas A4"
          />

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:bg-white/15 rounded text-white transition"
            title="Zoom In (+10%)"
          >
            <Plus className="w-3 h-3" />
          </button>

          <button
            type="button"
            onClick={handleZoomReset}
            className="font-mono font-bold text-[11px] text-white/90 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/15 transition min-w-[38px] text-center"
            title="Reset ke 100%"
          >
            {zoomLevel}%
          </button>
        </div>
      </div>

      {/* MODAL PASTE EXCEL */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 rounded-lg text-white">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Paste Tabel dari Excel / Spreadsheet
                  </h3>
                  <p className="text-xs text-slate-300">
                    Otomatis mengubah sel Excel menjadi format tabel surat resmi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelPasteText("");
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <textarea
                value={excelPasteText}
                onChange={(e) => setExcelPasteText(e.target.value)}
                placeholder="Paste (Ctrl+V) data sel Excel Anda di sini..."
                rows={6}
                className="w-full font-mono text-[11px] p-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                autoFocus
              />

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={excelHeaderFirstRow}
                  onChange={(e) => setExcelHeaderFirstRow(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-700">
                  Jadikan baris pertama sebagai Header (Judul Kolom)
                </span>
              </label>
            </div>

            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelPasteText("");
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={insertExcelTableFromModal}
                disabled={!excelPasteText.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Sisipkan ke Lembar Surat</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
