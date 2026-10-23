import React, { useRef, useEffect, useState, useCallback } from "react";
import {
  Bold,
  Italic,
  Underline,
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
  Type,
  Maximize2,
  FileText,
  Tag,
  Layout,
  Columns,
  AlignVerticalJustifyCenter,
  Move,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Grid,
  ZoomIn,
  ZoomOut,
  Minus,
  Palette,
} from "lucide-react";

export default function RichEditor({
  value,
  onChange,
  readOnly = false,
  availableVariables = [],
  placeholder = "Mulai ketik isi surat...",
  letterNumber = "",
  perihal = "",
  submitterName = "",
  submitterPosition = "",
}) {
  const editorRef = useRef(null);
  const paperRef = useRef(null);

  // Table manipulation states
  const [activeTableState, setActiveTableState] = useState(null);
  const [resizeGuide, setResizeGuide] = useState(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const [lineSpacing, setLineSpacing] = useState("1.3");
  const [paragraphSpacing, setParagraphSpacing] = useState("tight");
  const [zoomLevel, setZoomLevel] = useState(110);
  const isDraggingColumnRef = useRef(false);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 10));
  };

  const handleZoomReset = () => {
    setZoomLevel(110);
  };

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  // Update floating handle position relative to paper
  const updateOverlayPosition = useCallback(() => {
    if (!activeTableState?.table || !paperRef.current) {
      setOverlayPos(null);
      return;
    }
    try {
      const table = activeTableState.table;
      const paper = paperRef.current;

      // Hitung koordinat murni dari offset agar kebal terhadap transform scale / zoom
      let top = 0;
      let left = 0;
      let curr = table;
      while (curr && curr !== paper) {
        top += curr.offsetTop || 0;
        left += curr.offsetLeft || 0;
        curr = curr.offsetParent;
      }

      setOverlayPos({
        // Posisikan tombol handle tepat di luar pojok kiri-atas tabel tanpa menutupi cell (-24px atas, -26px kiri)
        top: Math.max(4, top - 24),
        left: Math.max(4, left - 26),
        tableWidth: table.offsetWidth,
      });
    } catch {
      setOverlayPos(null);
    }
  }, [activeTableState]);

  useEffect(() => {
    updateOverlayPosition();
  }, [activeTableState, updateOverlayPosition]);

  // Detect active table when selection or click changes
  const updateActiveTable = useCallback(() => {
    if (isDraggingColumnRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) {
      return;
    }
    let node = selection.anchorNode;
    if (node.nodeType === 3) node = node.parentNode;
    const cell = node?.closest ? node.closest("td, th") : null;
    const table = cell?.closest ? cell.closest("table") : null;

    if (table && cell && editorRef.current?.contains(table)) {
      setActiveTableState({
        table,
        cell,
        colIndex: cell.cellIndex,
        rowIndex: cell.parentElement.rowIndex,
      });
    } else {
      setActiveTableState(null);
    }
  }, []);

  const format = (command, val = null) => {
    if (readOnly) return;
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyFontFamily = (fontName) => {
    if (readOnly) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand("fontName", false, fontName);
      if (editorRef.current) {
        // execCommand fontName creates <font face="...">, ensure inline style is applied
        const fontElements = editorRef.current.querySelectorAll(`font[face="${fontName}"]`);
        fontElements.forEach((el) => {
          el.style.fontFamily = fontName;
        });
      }
      handleInput();
    } else if (editorRef.current) {
      editorRef.current.style.fontFamily = fontName;
      handleInput();
    }
  };

  const applyFontColor = (colorHex) => {
    if (readOnly || !colorHex) return;
    document.execCommand("foreColor", false, colorHex);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyFontSize = (val) => {
    if (readOnly) return;
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand("fontSize", false, "7");
      if (editorRef.current) {
        const fontElements =
          editorRef.current.querySelectorAll('font[size="7"]');
        fontElements.forEach((el) => {
          el.removeAttribute("size");
          el.style.fontSize = val;
        });
      }
      handleInput();
    } else if (editorRef.current) {
      editorRef.current.style.fontSize = val;
      handleInput();
    }
  };

  const applyLineSpacing = (val) => {
    if (readOnly) return;
    setLineSpacing(val);
    if (editorRef.current) {
      editorRef.current.style.lineHeight = val;
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        let node = selection.anchorNode;
        if (node?.nodeType === 3) node = node.parentNode;
        const block = node?.closest
          ? node.closest("p, div, td, th, li, table")
          : null;
        if (block) {
          block.style.lineHeight = val;
        }
      }
      handleInput();
    }
  };

  const applyParagraphSpacing = (spacing) => {
    if (readOnly) return;
    setParagraphSpacing(spacing);
    if (editorRef.current) {
      const paragraphs = editorRef.current.querySelectorAll("p");
      paragraphs.forEach((p) => {
        if (spacing === "tight") {
          p.style.marginBottom = "4px";
          p.style.marginTop = "0px";
        } else if (spacing === "normal") {
          p.style.marginBottom = "10px";
          p.style.marginTop = "0px";
        } else if (spacing === "loose") {
          p.style.marginBottom = "18px";
          p.style.marginTop = "0px";
        }
      });
      handleInput();
    }
  };

  const handleKeyDown = (e) => {
    if (readOnly) return;

    // Lindungi nomor surat agar tidak bisa dihapus atau diedit
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const node = sel.anchorNode;
      const element =
        node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;

      if (element?.closest(".locked-letter-number")) {
        e.preventDefault();
        return;
      }

      if (e.key === "Backspace" || e.key === "Delete") {
        const range = sel.getRangeAt(0);
        if (e.key === "Backspace" && range.collapsed) {
          const prev =
            range.startContainer?.previousSibling ||
            element?.previousElementSibling;
          if (
            prev?.classList?.contains("locked-letter-number") ||
            prev?.querySelector?.(".locked-letter-number")
          ) {
            e.preventDefault();
            return;
          }
        }
        if (e.key === "Delete" && range.collapsed) {
          const next =
            range.startContainer?.nextSibling ||
            element?.nextElementSibling;
          if (
            next?.classList?.contains("locked-letter-number") ||
            next?.querySelector?.(".locked-letter-number")
          ) {
            e.preventDefault();
            return;
          }
        }
      }
    }

    // Handle TAB key like Word
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      handleInput();
    }
  };

  // --- MOUSE COLUMN RESIZE LOGIC (Word-like border drag) ---
  const getCellBorderNearMouse = (e) => {
    if (readOnly || !editorRef.current) return null;
    const cell = e.target.closest ? e.target.closest("td, th") : null;
    if (!cell || !editorRef.current.contains(cell)) return null;
    const table = cell.closest("table");
    if (!table || !editorRef.current.contains(table)) return null;

    const rect = cell.getBoundingClientRect();
    const mouseX = e.clientX;

    // Check right border within 6px threshold
    if (Math.abs(mouseX - rect.right) <= 6) {
      return {
        cell,
        table,
        colIndex: cell.cellIndex,
      };
    }
    // Check left border if previous column exists
    if (Math.abs(mouseX - rect.left) <= 6 && cell.previousElementSibling) {
      return {
        cell: cell.previousElementSibling,
        table,
        colIndex: cell.previousElementSibling.cellIndex,
      };
    }
    return null;
  };

  const handleEditorMouseMove = (e) => {
    if (readOnly || isDraggingColumnRef.current) return;
    const border = getCellBorderNearMouse(e);
    if (border) {
      if (editorRef.current) editorRef.current.style.cursor = "col-resize";
    } else if (
      editorRef.current &&
      editorRef.current.style.cursor === "col-resize"
    ) {
      editorRef.current.style.cursor = "text";
    }
  };

  const handleEditorMouseDown = (e) => {
    if (readOnly) return;
    const border = getCellBorderNearMouse(e);
    if (!border) return;

    e.preventDefault();
    e.stopPropagation();

    const { cell, table, colIndex } = border;
    isDraggingColumnRef.current = true;

    // Set table layout fixed for pixel-perfect resizing
    table.style.tableLayout = "fixed";

    // Compute and lock pixel widths for all columns
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return;

    const firstRowCells = Array.from(rows[0].children);
    const initialWidths = firstRowCells.map((c) => c.offsetWidth);

    rows.forEach((r) => {
      Array.from(r.children).forEach((c, idx) => {
        c.style.width = `${initialWidths[idx]}px`;
        c.style.boxSizing = "border-box";
      });
    });

    const nextCell = cell.nextElementSibling;
    const startX = e.clientX;
    const startCellWidth = initialWidths[colIndex] || 80;
    const nextColIndex = nextCell ? colIndex + 1 : null;
    const startNextWidth = nextCell ? initialWidths[nextColIndex] || 80 : null;
    const startTableWidth = table.offsetWidth;

    setResizeGuide({ x: e.clientX });

    const onWindowMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (nextCell && !moveEvent.shiftKey) {
        // Proportional adjacent column resize (keeps table width constant within page)
        const minW = 28;
        let newColW = startCellWidth + deltaX;
        let newNextW = startNextWidth - deltaX;

        if (newColW < minW) {
          newColW = minW;
          newNextW = startCellWidth + startNextWidth - minW;
        } else if (newNextW < minW) {
          newNextW = minW;
          newColW = startCellWidth + startNextWidth - minW;
        }

        rows.forEach((r) => {
          const c1 = r.children[colIndex];
          const c2 = r.children[nextColIndex];
          if (c1) c1.style.width = `${newColW}px`;
          if (c2) c2.style.width = `${newNextW}px`;
        });
      } else {
        // Last column or free resize
        const minW = 28;
        const newColW = Math.max(minW, startCellWidth + deltaX);
        rows.forEach((r) => {
          const c1 = r.children[colIndex];
          if (c1) c1.style.width = `${newColW}px`;
        });
        const newTableW = Math.max(100, startTableWidth + deltaX);
        table.style.width = `${newTableW}px`;
      }

      setResizeGuide({ x: moveEvent.clientX });
    };

    const onWindowMouseUp = () => {
      window.removeEventListener("mousemove", onWindowMouseMove);
      window.removeEventListener("mouseup", onWindowMouseUp);
      isDraggingColumnRef.current = false;
      setResizeGuide(null);
      if (editorRef.current) {
        editorRef.current.style.cursor = "text";
      }
      handleInput();
      updateActiveTable();
    };

    window.addEventListener("mousemove", onWindowMouseMove);
    window.addEventListener("mouseup", onWindowMouseUp);
  };

  // --- TABLE MOVE / DRAG HANDLE LOGIC ---
  const handleMoveHandleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!activeTableState?.table) return;

    const table = activeTableState.table;
    const startMargin = parseInt(table.style.marginLeft || "0", 10) || 0;
    const startX = e.clientX;
    const scale = (zoomLevel || 100) / 100;

    const onMouseMove = (moveEvent) => {
      const delta = (moveEvent.clientX - startX) / scale;
      const newMargin = Math.max(0, Math.min(450, startMargin + delta));
      table.style.marginLeft = `${newMargin}px`;
      table.style.marginRight = "auto";
      updateOverlayPosition();
    };

    const onMouseUp = () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      handleInput();
      updateOverlayPosition();
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  // --- TABLE TOOLS ACTIONS ---
  const addRowAbove = () => {
    if (!activeTableState) return;
    const { table, cell } = activeTableState;
    const row = cell.parentElement;
    const colCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const isHeader = row.children[i].tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.cssText = row.children[i].style.cssText;
      newCell.innerHTML = "Teks...";
      newRow.appendChild(newCell);
    }
    const tbody = table.querySelector("tbody");
    if (tbody) {
      tbody.insertBefore(newRow, row);
    } else {
      table.insertBefore(newRow, row);
    }
    handleInput();
    updateOverlayPosition();
  };

  const addRowBelow = () => {
    if (!activeTableState) return;
    const { cell } = activeTableState;
    const row = cell.parentElement;
    const colCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement("td");
      newCell.style.cssText = row.children[i].style.cssText;
      newCell.innerHTML = "Teks...";
      newRow.appendChild(newCell);
    }
    row.after(newRow);
    handleInput();
    updateOverlayPosition();
  };

  const addColLeft = () => {
    if (!activeTableState) return;
    const { table, colIndex } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((r, idx) => {
      const refCell = r.children[colIndex];
      const isHeader = idx === 0 && refCell?.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      if (refCell) newCell.style.cssText = refCell.style.cssText;
      newCell.style.width = "100px";
      newCell.innerHTML = isHeader ? `Kolom Baru` : `Teks...`;
      r.insertBefore(newCell, refCell);
    });
    handleInput();
    updateOverlayPosition();
  };

  const addColRight = () => {
    if (!activeTableState) return;
    const { table, colIndex } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((r, idx) => {
      const refCell = r.children[colIndex];
      const isHeader = idx === 0 && refCell?.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      if (refCell) newCell.style.cssText = refCell.style.cssText;
      newCell.style.width = "100px";
      newCell.innerHTML = isHeader ? `Kolom Baru` : `Teks...`;
      if (refCell && refCell.nextSibling) {
        r.insertBefore(newCell, refCell.nextSibling);
      } else {
        r.appendChild(newCell);
      }
    });
    handleInput();
    updateOverlayPosition();
  };

  const deleteCurrentRow = () => {
    if (!activeTableState) return;
    const { table, cell } = activeTableState;
    const row = cell.parentElement;
    if (table.querySelectorAll("tr").length <= 1) {
      table.remove();
      setActiveTableState(null);
    } else {
      row.remove();
    }
    handleInput();
    updateOverlayPosition();
  };

  const deleteCurrentCol = () => {
    if (!activeTableState) return;
    const { table, colIndex } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows[0] && rows[0].children.length <= 1) {
      table.remove();
      setActiveTableState(null);
    } else {
      rows.forEach((r) => {
        if (r.children[colIndex]) {
          r.children[colIndex].remove();
        }
      });
    }
    handleInput();
    updateOverlayPosition();
  };

  const deleteTable = () => {
    if (!activeTableState) return;
    activeTableState.table.remove();
    setActiveTableState(null);
    handleInput();
  };

  const indentTableRight = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    const currentMargin = parseInt(table.style.marginLeft || "0", 10) || 0;
    table.style.marginLeft = `${currentMargin + 24}px`;
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const indentTableLeft = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    const currentMargin = parseInt(table.style.marginLeft || "0", 10) || 0;
    table.style.marginLeft = `${Math.max(0, currentMargin - 24)}px`;
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const alignTableCenter = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    table.style.marginLeft = "auto";
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const alignTableLeft = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    table.style.marginLeft = "0";
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const distributeColumnsEvenly = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) return;
    const colCount = rows[0].children.length;
    const percent = (100 / colCount).toFixed(2);
    table.style.width = "100%";
    table.style.tableLayout = "fixed";
    rows.forEach((r) => {
      Array.from(r.children).forEach((c) => {
        c.style.width = `${percent}%`;
      });
    });
    handleInput();
    updateOverlayPosition();
  };

  const setTableFullWidth = () => {
    if (!activeTableState) return;
    const { table } = activeTableState;
    table.style.width = "100%";
    table.style.marginLeft = "0";
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const insertVariable = (varKey) => {
    if (readOnly) return;
    if (varKey === 'nomor_surat') {
      const numDisplay = letterNumber || '{{nomor_surat}}';
      const badge = `<span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #1e3a8a; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi (Terkunci)">${numDisplay}</span>`;
      document.execCommand("insertHTML", false, badge);
    } else {
      const tag = `{{${varKey}}}`;
      document.execCommand("insertText", false, tag);
    }
    handleInput();
  };

  // Sisipkan Format Baris Rapi (Tabel Tanpa Border mirip Tab Stop di Word)
  const insertOfficialHeader = () => {
    if (readOnly) return;
    const numDisplay = letterNumber || '{{nomor_surat}}';
    const perihalDisplay = (perihal && perihal.trim()) ? perihal.trim() : 'Permohonan';
    const dariDisplay = submitterName
      ? `${submitterName}${submitterPosition ? ` (${submitterPosition})` : ''}`
      : '[Nama / Jabatan Pemohon]';

    const html = `
<table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px; font-family: Tahoma, Arial, sans-serif; font-size: 11px; table-layout: fixed;">
  <tr>
    <td style="width: 14%; vertical-align: top; padding: 2px 0;"><strong>Nomor</strong></td>
    <td style="width: 2%; vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;"><span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #1e3a8a; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi otomatis dari sistem (Terkunci)">${numDisplay}</span></td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;"><strong>Lampiran</strong></td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;">-</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;"><strong>Perihal</strong></td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;"><strong>${perihalDisplay}</strong></td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;"><strong>Dari</strong></td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;">${dariDisplay}</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;"><strong>Kepada</strong></td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;">Yth. [Pimpinan / Manajer Terkait]</td>
  </tr>
  <tr>
    <td style="vertical-align: top; padding: 2px 0;"><strong>Tembusan</strong></td>
    <td style="vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;">1. Arsip Cabang</td>
  </tr>
</table>
<p><br></p>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  // Sisipkan Format Biodata / Rincian Isian Rapi (Kolom Titik Dua Sejajar)
  const insertFieldRowLayout = () => {
    if (readOnly) return;
    const html = `
<table style="width: 100%; border: none; border-collapse: collapse; margin: 12px 0; font-family: Tahoma, Arial, sans-serif; font-size: 11px; line-height: 1.8; table-layout: fixed;">
  <tr>
    <td style="width: 25%; padding: 3px 0;">Nama Lengkap</td>
    <td style="width: 2%; text-align: center; padding: 3px 0;">:</td>
    <td style="padding: 3px 0;"><strong>[Isi Nama]</strong></td>
  </tr>
  <tr>
    <td style="padding: 3px 0;">Jabatan / Unit</td>
    <td style="text-align: center; padding: 3px 0;">:</td>
    <td style="padding: 3px 0;">[Isi Jabatan]</td>
  </tr>
  <tr>
    <td style="padding: 3px 0;">Unit Kerja / Cabang</td>
    <td style="text-align: center; padding: 3px 0;">:</td>
    <td style="padding: 3px 0;">{{nama_cabang}}</td>
  </tr>
  <tr>
    <td style="padding: 3px 0; vertical-align: top;">Keterangan / Keperluan</td>
    <td style="text-align: center; padding: 3px 0; vertical-align: top;">:</td>
    <td style="padding: 3px 0; vertical-align: top;">[Uraikan keperluan di sini...]</td>
  </tr>
</table>
<p><br></p>`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  const insertTable = () => {
    if (readOnly) return;
    const rows = prompt("Masukkan jumlah baris tabel:", "3");
    const cols = prompt("Masukkan jumlah kolom tabel:", "3");
    if (!rows || !cols) return;

    const rowNum = parseInt(rows, 10) || 3;
    const colNum = parseInt(cols, 10) || 3;
    const widthPct = (100 / colNum).toFixed(1);

    let tableHtml =
      '<table style="width: 100%; border-collapse: collapse; margin: 8px 0; border: 1px solid #cbd5e1; font-family: Tahoma, Arial, sans-serif; font-size: 12px; table-layout: fixed;">';
    for (let r = 0; r < rowNum; r++) {
      tableHtml += "<tr>";
      for (let c = 0; c < colNum; c++) {
        if (r === 0) {
          tableHtml += `<th style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 4px 6px; background-color: #f1f5f9; text-align: left; font-weight: bold; font-size: 12px;">Kolom ${c + 1}</th>`;
        } else {
          tableHtml += `<td style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 3px 6px; font-size: 12px;">Teks...</td>`;
        }
      }
      tableHtml += "</tr>";
    }
    tableHtml += "</table><p><br></p>";
    document.execCommand("insertHTML", false, tableHtml);
    handleInput();
  };

  const insertImage = () => {
    if (readOnly) return;
    const url = prompt(
      "Masukkan URL Gambar (atau paste link gambar):",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    );
    if (url) {
      const imgHtml = `<p style="text-align: center;"><img src="${url}" alt="Lampiran Foto" style="max-width: 80%; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 12px auto; display: inline-block;" /></p><p><br></p>`;
      document.execCommand("insertHTML", false, imgHtml);
      handleInput();
    }
  };

  return (
    <div className="bg-white border border-slate-300 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Word-like Ribbon Toolbar */}
      {!readOnly && (
        <div className="bg-slate-100/90 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1.5 select-none sticky top-0 z-10">
          {/* History */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => format("undo")}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("redo")}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls di Toolbar */}
          <div
            className="flex items-center gap-0.5 bg-white rounded-lg border border-slate-200 px-1 py-0.5 shadow-xs"
            title="Zoom Kertas A4 (Seperti di Word)"
          >
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Zoom Out (-10%)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleZoomReset}
              className="text-[11px] font-bold text-slate-700 hover:text-indigo-600 px-1 font-mono min-w-[38px] text-center"
              title="Klik untuk reset zoom 100%"
            >
              {zoomLevel}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
              title="Zoom In (+10%)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Font Family & Size */}
          <div className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-1 py-0.5 shadow-xs">
            <select
              onChange={(e) => applyFontFamily(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 py-1 px-1.5 focus:outline-none cursor-pointer font-medium"
              defaultValue="Tahoma"
            >
              <option value="Tahoma">Tahoma</option>
              <option value="Arial">Arial</option>
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Courier New">Courier New</option>
            </select>
            <span className="text-slate-300">|</span>
            <select
              onChange={(e) => applyFontSize(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 py-1 px-1 focus:outline-none cursor-pointer font-medium"
              defaultValue="11px"
            >
              <option value="11px">11px (Standar)</option>
              <option value="12px">12px (Kecil)</option>
              <option value="14px">14px (Normal)</option>
              <option value="16px">16px (Sedang)</option>
              <option value="18px">18px (Besar)</option>
              <option value="24px">24px (Judul)</option>
            </select>
          </div>

          {/* Bold, Italic, Underline, Strikethrough, Font Color */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => format("bold")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded font-bold"
              title="Tebal (Bold)"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("italic")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded italic"
              title="Miring (Italic)"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("underline")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded underline"
              title="Garis Bawah (Underline)"
            >
              <Underline className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("strikeThrough")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Coret (Strikethrough)"
            >
              <Strikethrough className="w-4 h-4" />
            </button>

            {/* Font Color Picker */}
            <div className="relative flex items-center border-l border-slate-200 ml-0.5 pl-1" title="Warna Teks (Font Color)">
              <label className="p-1.5 text-slate-700 hover:bg-slate-100 rounded cursor-pointer flex items-center gap-1 group">
                <Palette className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
                <input
                  type="color"
                  defaultValue="#0f172a"
                  onChange={(e) => applyFontColor(e.target.value)}
                  className="w-4 h-4 p-0 border-0 rounded cursor-pointer bg-transparent"
                  title="Pilih Warna Teks"
                />
              </label>
            </div>
          </div>

          {/* Text Alignment */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => format("justifyLeft")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Rata Kiri"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("justifyCenter")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Rata Tengah"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("justifyRight")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Rata Kanan"
            >
              <AlignRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("justifyFull")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Rata Kanan-Kiri (Justify)"
            >
              <AlignJustify className="w-4 h-4" />
            </button>
          </div>

          {/* Spasi Baris / Line Spacing */}
          <div
            className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-1.5 py-0.5 shadow-xs"
            title="Atur Jarak Baris / Spasi Teks (Line Spacing)"
          >
            <span className="text-[11px] font-bold text-slate-500">Spasi:</span>
            <select
              value={lineSpacing}
              onChange={(e) => applyLineSpacing(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 py-1 px-1 focus:outline-none cursor-pointer font-medium"
            >
              <option value="1.0">1.0 (Rapat)</option>
              <option value="1.15">1.15 (Rapat Standar)</option>
              <option value="1.3">1.3 (Standar Surat)</option>
              <option value="1.5">1.5 (Sedang)</option>
              <option value="1.8">1.8 (Renggang)</option>
              <option value="2.0">2.0 (Ganda)</option>
            </select>
          </div>

          {/* Jarak Antar Paragraf */}
          <div
            className="flex items-center gap-1 bg-white rounded-lg border border-slate-200 px-1.5 py-0.5 shadow-xs"
            title="Atur Jarak Antar Paragraf"
          >
            <span className="text-[11px] font-bold text-slate-500">
              Paragraf:
            </span>
            <select
              value={paragraphSpacing}
              onChange={(e) => applyParagraphSpacing(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-700 py-1 px-1 focus:outline-none cursor-pointer font-medium"
            >
              <option value="tight">Rapat (4px)</option>
              <option value="normal">Standar (10px)</option>
              <option value="loose">Renggang (18px)</option>
            </select>
          </div>

          {/* Lists */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => format("insertUnorderedList")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Daftar Bullet"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => format("insertOrderedList")}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded"
              title="Daftar Nomor"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>

          {/* Media & Table & Official Layout (Tab / Word style) */}
          <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 shadow-xs">
            <button
              type="button"
              onClick={insertOfficialHeader}
              className="p-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-1 text-xs font-semibold"
              title="Sisipkan Header Surat Lengkap (Nomor, Lampiran, Perihal, Dari, Kepada, Tembusan dengan titik dua sejajar)"
            >
              <Layout className="w-4 h-4 text-indigo-600" />
              <span>Header Surat</span>
            </button>
            <button
              type="button"
              onClick={insertFieldRowLayout}
              className="p-1.5 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-1 text-xs font-semibold"
              title="Sisipkan Kolom Biodata Rapi (Titik dua sejajar otomatis seperti Tab di Word)"
            >
              <Columns className="w-4 h-4 text-indigo-600" />
              <span>Kolom Rapi (Tab)</span>
            </button>
            <button
              type="button"
              onClick={insertTable}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 text-xs"
              title="Sisipkan Tabel Kotak"
            >
              <TableIcon className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              type="button"
              onClick={insertImage}
              className="p-1.5 text-slate-700 hover:bg-slate-100 rounded flex items-center gap-1 text-xs"
              title="Sisipkan Gambar"
            >
              <ImageIcon className="w-4 h-4 text-sky-600" />
              <span className="hidden sm:inline">Gambar</span>
            </button>
          </div>
        </div>
      )}

      {/* Dedicated Word-style Table Tools Banner (Active when table cell is clicked) */}
      {!readOnly && activeTableState && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-3 py-1.5 flex flex-wrap items-center gap-2 text-xs select-none shadow-xs transition-all animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-indigo-900 pr-2 border-r border-indigo-200">
            <Grid className="w-4 h-4 text-indigo-600" />
            <span className="text-[12px]">Alat Tabel (Word)</span>
          </div>

          {/* Posisi & Geser Tabel */}
          <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium px-1.5 flex items-center gap-1">
              <Move className="w-3 h-3 text-indigo-500" />
              Geser:
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={indentTableLeft}
              className="px-2 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-1 text-[11px] font-medium transition"
              title="Geser posisi tabel ke kiri (Kurangi Margin)"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Kiri</span>
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={alignTableCenter}
              className="px-2 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded text-[11px] font-medium transition"
              title="Rata tengah tabel di kertas"
            >
              Tengah
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={alignTableLeft}
              className="px-2 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded text-[11px] font-medium transition"
              title="Rata kiri tabel di kertas"
            >
              Tepi Kiri
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={indentTableRight}
              className="px-2 py-1 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded flex items-center gap-1 text-[11px] font-medium transition"
              title="Geser posisi tabel ke kanan (Tambah Indentasi)"
            >
              <span>Kanan</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Lebar Kolom */}
          <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium px-1.5">
              Lebar:
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={distributeColumnsEvenly}
              className="px-2 py-1 text-indigo-700 hover:bg-indigo-50 rounded text-[11px] font-semibold transition"
              title="Bagi rata lebar semua kolom sama besar"
            >
              Rata Kolom
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={setTableFullWidth}
              className="px-2 py-1 text-slate-700 hover:bg-indigo-50 rounded text-[11px] font-medium transition"
              title="Atur lebar tabel 100% selebar halaman"
            >
              100% Penuh
            </button>
          </div>

          {/* Baris / Kolom */}
          <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded-lg p-0.5 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium px-1.5">
              Sisip:
            </span>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addRowAbove}
              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px] font-medium transition"
              title="Tambah 1 baris di atas baris ini"
            >
              + Baris Atas
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addRowBelow}
              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px] font-medium transition"
              title="Tambah 1 baris di bawah baris ini"
            >
              + Baris Bawah
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addColLeft}
              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px] font-medium transition"
              title="Tambah 1 kolom di sebelah kiri"
            >
              + Kolom Kiri
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={addColRight}
              className="px-2 py-1 text-slate-700 hover:bg-slate-100 rounded text-[11px] font-medium transition"
              title="Tambah 1 kolom di sebelah kanan"
            >
              + Kolom Kanan
            </button>
          </div>

          {/* Hapus */}
          <div className="flex items-center gap-1 bg-white border border-rose-200 rounded-lg p-0.5 shadow-2xs ml-auto">
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteCurrentRow}
              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium transition"
              title="Hapus baris saat ini"
            >
              Hapus Baris
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteCurrentCol}
              className="px-2 py-1 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium transition"
              title="Hapus kolom saat ini"
            >
              Hapus Kolom
            </button>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={deleteTable}
              className="px-2 py-1 text-rose-700 hover:bg-rose-100 rounded text-[11px] font-semibold flex items-center gap-1 transition"
              title="Hapus tabel ini seluruhnya"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Tabel</span>
            </button>
          </div>
        </div>
      )}

      {/* Visual Guide Line during column resize */}
      {resizeGuide && (
        <div
          style={{ left: `${resizeGuide.x}px` }}
          className="fixed top-0 bottom-0 w-0.5 bg-indigo-600 z-50 pointer-events-none shadow-md flex items-center justify-center"
        >
          <div className="bg-indigo-700 text-white text-[11px] font-medium px-2 py-1 rounded shadow-lg absolute top-1/3 -translate-y-1/2 flex items-center gap-1 select-none">
            <span>↔ Geser Lebar Kolom</span>
          </div>
        </div>
      )}

      {/* A4 Paper Workspace Background */}
      <div className="bg-slate-200/70 p-4 sm:p-8 flex justify-center min-h-[580px] overflow-x-auto relative">
        <div
          ref={paperRef}
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: "top center",
            transition: "transform 0.12s ease-out",
            marginBottom:
              zoomLevel > 100 ? `${(zoomLevel - 100) * 8}px` : "0px",
          }}
          className="bg-white w-full max-w-[850px] min-h-[650px] p-8 sm:p-14 shadow-md rounded-sm border border-slate-200 relative text-slate-800"
        >
          {/* Subtle Page Margin Indicator for Word look */}
          <div className="absolute top-4 right-4 text-[11px] text-slate-400 font-mono select-none">
            Standar Dokumen A4 &bull; [Drag garis tabel untuk atur kolom]
          </div>

          {/* Floating Table Move Handle (Word ✥ icon di luar tabel) */}
          {!readOnly && activeTableState && overlayPos && (
            <div
              style={{
                top: `${overlayPos.top}px`,
                left: `${overlayPos.left}px`,
              }}
              onMouseDown={handleMoveHandleMouseDown}
              className="absolute z-20 flex items-center justify-center w-6 h-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded shadow-md cursor-grab active:cursor-grabbing select-none border border-indigo-400 transition-colors"
              title="Tahan & geser untuk memindahkan posisi tabel di kertas (Atau gunakan tombol Geser di toolbar)"
            >
              <Move className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Scoped font style untuk editor */}
          <style>{`
            .rich-editor-sheet {
              font-family: Tahoma, Arial, sans-serif;
            }
            .rich-editor-sheet,
            .rich-editor-sheet p,
            .rich-editor-sheet td,
            .rich-editor-sheet th,
            .rich-editor-sheet li {
              font-size: 12px;
              line-height: ${lineSpacing};
            }
            ${
              paragraphSpacing === "tight"
                ? `
              .rich-editor-sheet p {
                margin-top: 0 !important;
                margin-bottom: 4px !important;
              }
            `
                : paragraphSpacing === "loose"
                  ? `
              .rich-editor-sheet p {
                margin-top: 0 !important;
                margin-bottom: 18px !important;
              }
            `
                  : `
              .rich-editor-sheet p {
                margin-top: 0 !important;
                margin-bottom: 10px !important;
              }
            `
            }
          `}</style>

          {/* Content Editable Area */}
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onBlur={handleInput}
            onMouseUp={updateActiveTable}
            onKeyUp={updateActiveTable}
            onMouseMove={handleEditorMouseMove}
            onMouseDown={handleEditorMouseDown}
            className={`rich-editor-sheet outline-none leading-relaxed prose prose-slate max-w-none min-h-[500px] text-[11px] focus:ring-0 ${
              readOnly ? "cursor-default select-text" : "cursor-text"
            }`}
            style={{
              fontFamily: "Tahoma, Arial, sans-serif",
              fontSize: "11px",
            }}
          />
        </div>

        {/* Word-like Floating Zoom Bar di Sudut Kanan Bawah */}
        <div className="fixed bottom-4 right-6 z-40 bg-slate-900/90 hover:bg-slate-950 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2.5 text-xs select-none transition-all">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition"
            title="Zoom Out (-10%)"
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="range"
            min="50"
            max="200"
            step="5"
            value={zoomLevel}
            onChange={(e) => setZoomLevel(Number(e.target.value))}
            className="w-24 sm:w-28 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
            title="Geser untuk atur zoom kertas"
          />

          <button
            type="button"
            onClick={handleZoomIn}
            className="p-1 hover:bg-slate-800 rounded-full text-slate-300 hover:text-white transition"
            title="Zoom In (+10%)"
          >
            <Plus className="w-3 h-3" />
          </button>

          <span className="text-slate-600">|</span>

          <button
            type="button"
            onClick={handleZoomReset}
            className="font-mono font-bold text-[11px] text-indigo-300 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 hover:bg-indigo-600 transition min-w-[44px] text-center"
            title="Klik untuk reset ke 100%"
          >
            {zoomLevel}%
          </button>
        </div>
      </div>
    </div>
  );
}
