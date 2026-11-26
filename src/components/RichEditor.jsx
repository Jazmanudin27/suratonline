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
  Layout,
  Columns,
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
  FileText,
  Copy,
  Scissors,
  Clipboard,
  Highlighter,
  ChevronDown,
  Check,
  Split,
  Sparkles,
  HelpCircle,
  Eye,
  Save,
  CheckCircle2,
  X,
  Minimize2,
  FileSpreadsheet,
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
  isFullscreen = false,
  onSave = null,
  onClose = null,
}) {
  const editorRef = useRef(null);
  const paperRef = useRef(null);
  const dragStartCellRef = useRef(null);
  const isDraggingColumnRef = useRef(false);

  // Tab ribbon Word: 'home' | 'insert' | 'layout' | 'table'
  const [activeTab, setActiveTab] = useState("home");

  // Excel / Spreadsheet import modal states
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelPasteText, setExcelPasteText] = useState("");
  const [excelHeaderFirstRow, setExcelHeaderFirstRow] = useState(true);
  const [excelAutoAlign, setExcelAutoAlign] = useState(true);
  const savedRangeRef = useRef(null);

  // Table manipulation states
  const [activeTableState, setActiveTableState] = useState(null);
  const [resizeGuide, setResizeGuide] = useState(null);
  const [overlayPos, setOverlayPos] = useState(null);
  const [lineSpacing, setLineSpacing] = useState("1.3");
  const [paragraphSpacing, setParagraphSpacing] = useState("tight");
  const [zoomLevel, setZoomLevel] = useState(105);
  const [fontFamily, setFontFamily] = useState("Calibri");
  const [fontSize, setFontSize] = useState("11pt");
  const [wordCount, setWordCount] = useState(0);

  // Formatting states for active Word toolbar buttons & selection sync
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrike, setIsStrike] = useState(false);
  const [textAlign, setTextAlign] = useState("left");

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(200, prev + 10));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(50, prev - 10));
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Dedicated Undo / Redo History Stack (Mencegah tabel terhapus saat Ctrl+Z)
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const isUndoRedoRef = useRef(false);
  const typingTimerRef = useRef(null);

  const calculateWordCount = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean);
    setWordCount(words.length);
  };

  const saveHistorySnapshot = useCallback(() => {
    if (!editorRef.current || isUndoRedoRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const history = historyRef.current;
    const index = historyIndexRef.current;

    // Jangan simpan snapshot yang sama berulang kali
    if (index >= 0 && history[index] === currentHtml) return;

    const newHistory = history.slice(0, index + 1);
    newHistory.push(currentHtml);
    if (newHistory.length > 50) newHistory.shift();

    historyRef.current = newHistory;
    historyIndexRef.current = newHistory.length - 1;
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML);
      calculateWordCount();
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      saveHistorySnapshot();
    }, 350);
  }, [onChange, saveHistorySnapshot]);

  // Detect active table when selection or click changes
  const updateActiveTable = useCallback(() => {
    if (isDraggingColumnRef.current) return;

    // Prioritaskan sel yang sedang di-blok / dipilih dengan drag (.table-cell-selected)
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      const firstCell = selectedCells[0];
      const table = firstCell.closest("table");
      if (table && editorRef.current?.contains(table)) {
        setActiveTableState({
          table,
          cell: firstCell,
          colIndex: firstCell.cellIndex,
          rowIndex: firstCell.parentElement?.rowIndex ?? 0,
        });
        return;
      }
    }

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
        rowIndex: cell.parentElement?.rowIndex ?? 0,
      });
    } else {
      setActiveTableState(null);
    }
  }, []);

  // Track formatting at current caret / selection (Word-like dynamic toolbar sync)
  const updateSelectionFormat = useCallback(() => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.anchorNode) return;

    let node = selection.anchorNode;
    if (node.nodeType === 3) node = node.parentNode;
    if (!node || !editorRef.current.contains(node)) return;

    // 1. Detect Font Size at caret / selection
    try {
      // Prioritaskan inline style jika ada pada node atau parent-nya
      let curr = node;
      let explicitPt = null;
      while (curr && curr !== editorRef.current && curr.nodeType === 1) {
        if (curr.style && curr.style.fontSize) {
          const raw = curr.style.fontSize.trim();
          if (raw.endsWith("pt")) {
            explicitPt = parseFloat(raw);
            break;
          } else if (raw.endsWith("px")) {
            explicitPt = parseFloat(raw) * 0.75;
            break;
          }
        }
        if (curr.tagName && curr.tagName.toLowerCase() === "font" && curr.getAttribute("size")) {
          const sizeMap = { "1": 7.5, "2": 10, "3": 12, "4": 13.5, "5": 18, "6": 24, "7": 36 };
          explicitPt = sizeMap[curr.getAttribute("size")] || 12;
          break;
        }
        curr = curr.parentElement;
      }

      let ptVal = explicitPt;
      if (!ptVal) {
        const computedStyle = window.getComputedStyle(node.nodeType === 1 ? node : node.parentElement || node);
        const computedPx = parseFloat(computedStyle.fontSize);
        if (computedPx && !isNaN(computedPx)) {
          ptVal = computedPx * 0.75;
        }
      }

      if (ptVal && !isNaN(ptVal)) {
        const standardSizes = [
          { label: "9pt", val: 9 },
          { label: "10pt", val: 10 },
          { label: "10.5pt", val: 10.5 },
          { label: "11pt", val: 11 },
          { label: "12pt", val: 12 },
          { label: "14pt", val: 14 },
          { label: "16pt", val: 16 },
          { label: "18pt", val: 18 },
          { label: "20pt", val: 20 },
          { label: "24pt", val: 24 },
        ];
        let closest = "11pt";
        let minDiff = Infinity;
        for (const item of standardSizes) {
          const diff = Math.abs(ptVal - item.val);
          if (diff < minDiff) {
            minDiff = diff;
            closest = item.label;
          }
        }
        setFontSize(closest);
      }
    } catch (e) {}

    // 2. Detect Font Family at caret (HANYA sinkronkan jika ada font-family eksplisit pada elemen teks)
    try {
      let curr = node;
      let explicitFont = null;
      while (curr && curr !== editorRef.current && curr.nodeType === 1) {
        if (curr.style && curr.style.fontFamily) {
          explicitFont = curr.style.fontFamily;
          break;
        }
        if (
          curr.tagName &&
          curr.tagName.toLowerCase() === "font" &&
          curr.getAttribute("face")
        ) {
          explicitFont = curr.getAttribute("face");
          break;
        }
        curr = curr.parentElement;
      }

      if (explicitFont) {
        const fam = explicitFont.toLowerCase();
        const standardFonts = [
          "Calibri",
          "Arial",
          "Tahoma",
          "Times New Roman",
          "Plus Jakarta Sans",
          "Georgia",
          "Courier New",
        ];
        for (const f of standardFonts) {
          if (fam.includes(f.toLowerCase())) {
            setFontFamily(f);
            break;
          }
        }
      }
    } catch (e) {}

    // 3. Detect Bold, Italic, Underline, Strike, Alignment
    try {
      setIsBold(Boolean(document.queryCommandState("bold")));
      setIsItalic(Boolean(document.queryCommandState("italic")));
      setIsUnderline(Boolean(document.queryCommandState("underline")));
      setIsStrike(Boolean(document.queryCommandState("strikeThrough")));

      if (document.queryCommandState("justifyCenter")) {
        setTextAlign("center");
      } else if (document.queryCommandState("justifyRight")) {
        setTextAlign("right");
      } else if (document.queryCommandState("justifyFull")) {
        setTextAlign("justify");
      } else {
        setTextAlign("left");
      }
    } catch (e) {}
  }, []);

  // Listen to selectionchange on document to sync Word toolbar formatting with caret
  useEffect(() => {
    let rafId = null;
    const handleSelectionChange = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || !sel.anchorNode || !editorRef.current) return;
        if (editorRef.current.contains(sel.anchorNode)) {
          updateSelectionFormat();
          updateActiveTable();
        }
      });
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, [updateSelectionFormat, updateActiveTable]);

  const customUndo = useCallback(() => {
    if (readOnly) return;
    const history = historyRef.current;
    const index = historyIndexRef.current;

    if (index > 0) {
      isUndoRedoRef.current = true;
      const targetIndex = index - 1;
      const prevHtml = history[targetIndex];
      historyIndexRef.current = targetIndex;
      if (editorRef.current) {
        editorRef.current.innerHTML = prevHtml;
        if (onChange) onChange(prevHtml);
        calculateWordCount();
        updateActiveTable();
      }
      isUndoRedoRef.current = false;
    } else {
      document.execCommand("undo");
      handleInput();
    }
  }, [readOnly, onChange, updateActiveTable]);

  const customRedo = useCallback(() => {
    if (readOnly) return;
    const history = historyRef.current;
    const index = historyIndexRef.current;

    if (index < history.length - 1) {
      isUndoRedoRef.current = true;
      const targetIndex = index + 1;
      const nextHtml = history[targetIndex];
      historyIndexRef.current = targetIndex;
      if (editorRef.current) {
        editorRef.current.innerHTML = nextHtml;
        if (onChange) onChange(nextHtml);
        calculateWordCount();
        updateActiveTable();
      }
      isUndoRedoRef.current = false;
    } else {
      document.execCommand("redo");
      handleInput();
    }
  }, [readOnly, onChange, updateActiveTable]);

  // Sync initial content & history snapshot
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
      calculateWordCount();
    }
    if (historyRef.current.length === 0 && editorRef.current) {
      historyRef.current = [editorRef.current.innerHTML];
      historyIndexRef.current = 0;
    }
  }, [value]);

  // Shortcut Keyboard Global: Ctrl+S (Simpan), Ctrl+P (Print), Ctrl+Z (Undo), Ctrl+Y (Redo)
  useEffect(() => {
    const handleGlobalShortcuts = (e) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (!isCtrlOrCmd) return;

      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
      } else if (key === "p") {
        e.preventDefault();
        window.print();
      } else if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        customUndo();
      } else if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        customRedo();
      }
    };

    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [onSave, customUndo, customRedo]);

  // Focus helper for cells
  const focusCell = (cell, atStart = true) => {
    if (!cell) return;
    const sel = window.getSelection();
    if (!sel) return;
    const range = document.createRange();
    range.selectNodeContents(cell);
    range.collapse(atStart);
    sel.removeAllRanges();
    sel.addRange(range);
    cell.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  // Update floating handle position relative to paper
  const updateOverlayPosition = useCallback(() => {
    if (!activeTableState?.table || !paperRef.current) {
      setOverlayPos(null);
      return;
    }
    try {
      const table = activeTableState.table;
      const paper = paperRef.current;

      let top = 0;
      let left = 0;
      let curr = table;
      while (curr && curr !== paper) {
        top += curr.offsetTop || 0;
        left += curr.offsetLeft || 0;
        curr = curr.offsetParent;
      }

      setOverlayPos({
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

  const format = (command, val = null) => {
    if (readOnly) return;

    // 1. Cek apakah ada sel tabel yang sedang di-blok / dipilih dengan drag (.table-cell-selected)
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      saveHistorySnapshot();

      // Perataan Teks Sel (Left, Center, Right, Justify)
      if (
        command === "justifyCenter" ||
        command === "justifyLeft" ||
        command === "justifyRight" ||
        command === "justifyFull"
      ) {
        const alignMap = {
          justifyCenter: "center",
          justifyLeft: "left",
          justifyRight: "right",
          justifyFull: "justify",
        };
        const align = alignMap[command] || "left";
        selectedCells.forEach((cell) => {
          cell.style.textAlign = align;
          Array.from(
            cell.querySelectorAll("p, span, div, font, b, strong, i, u, a"),
          ).forEach((el) => {
            el.style.textAlign = align;
          });
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Bold
      if (command === "bold") {
        const anyNormal = Array.from(selectedCells).some(
          (c) =>
            c.style.fontWeight !== "bold" &&
            c.style.fontWeight !== "700" &&
            c.tagName.toLowerCase() !== "th",
        );
        selectedCells.forEach((cell) => {
          cell.style.fontWeight = anyNormal ? "bold" : "normal";
          Array.from(cell.querySelectorAll("p, span, div, font")).forEach(
            (el) => {
              el.style.fontWeight = anyNormal ? "bold" : "normal";
            },
          );
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Italic
      if (command === "italic") {
        const anyNonItalic = Array.from(selectedCells).some(
          (c) => c.style.fontStyle !== "italic",
        );
        selectedCells.forEach((cell) => {
          cell.style.fontStyle = anyNonItalic ? "italic" : "normal";
          Array.from(cell.querySelectorAll("p, span, div, font")).forEach(
            (el) => {
              el.style.fontStyle = anyNonItalic ? "italic" : "normal";
            },
          );
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Underline
      if (command === "underline") {
        const anyNonUnderline = Array.from(selectedCells).some(
          (c) => !c.style.textDecoration?.includes("underline"),
        );
        selectedCells.forEach((cell) => {
          cell.style.textDecoration = anyNonUnderline ? "underline" : "none";
          Array.from(cell.querySelectorAll("p, span, div, font")).forEach(
            (el) => {
              el.style.textDecoration = anyNonUnderline ? "underline" : "none";
            },
          );
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Coret (StrikeThrough)
      if (command === "strikeThrough") {
        const anyNonStrike = Array.from(selectedCells).some(
          (c) => !c.style.textDecoration?.includes("line-through"),
        );
        selectedCells.forEach((cell) => {
          cell.style.textDecoration = anyNonStrike ? "line-through" : "none";
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Warna Huruf
      if (command === "foreColor" && val) {
        selectedCells.forEach((cell) => {
          cell.style.color = val;
          Array.from(cell.querySelectorAll("*")).forEach(
            (el) => (el.style.color = val),
          );
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }

      // Format Huruf: Highlight
      if (command === "hiliteColor" && val) {
        selectedCells.forEach((cell) => {
          cell.style.backgroundColor = val;
        });
        handleInput();
        saveHistorySnapshot();
        return;
      }
    }

    // 2. Cek apakah kursor aktif berada di dalam cell tabel tunggal
    if (
      activeTableState?.cell &&
      (command === "justifyCenter" ||
        command === "justifyLeft" ||
        command === "justifyRight" ||
        command === "justifyFull")
    ) {
      const alignMap = {
        justifyCenter: "center",
        justifyLeft: "left",
        justifyRight: "right",
        justifyFull: "justify",
      };
      const align = alignMap[command] || "left";
      saveHistorySnapshot();
      activeTableState.cell.style.textAlign = align;
      Array.from(
        activeTableState.cell.querySelectorAll(
          "p, span, div, font, b, strong, i, u, a",
        ),
      ).forEach((el) => {
        el.style.textAlign = align;
      });
      handleInput();
      saveHistorySnapshot();
      updateSelectionFormat();
      return;
    }

    // 3. Fallback ke perintah native browser untuk paragraf/teks bebas biasa
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
      updateSelectionFormat();
    }
  };

  const applyFontFamily = (fontName) => {
    if (readOnly) return;
    setFontFamily(fontName);

    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      saveHistorySnapshot();
      selectedCells.forEach((c) => {
        c.style.fontFamily = fontName;
        c.querySelectorAll("*").forEach((el) => {
          el.style.fontFamily = fontName;
        });
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    if (activeTableState?.cell) {
      saveHistorySnapshot();
      activeTableState.cell.style.fontFamily = fontName;
      activeTableState.cell.querySelectorAll("*").forEach((el) => {
        el.style.fontFamily = fontName;
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      document.execCommand("fontName", false, fontName);
      if (editorRef.current) {
        const fontElements = editorRef.current.querySelectorAll(
          `font[face="${fontName}"]`,
        );
        fontElements.forEach((el) => {
          el.style.fontFamily = fontName;
        });
      }
      handleInput();
    } else if (editorRef.current) {
      editorRef.current.style.fontFamily = fontName;
      handleInput();
    }
    updateSelectionFormat();
  };

  const applyFontColor = (colorHex) => {
    if (readOnly || !colorHex) return;

    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      saveHistorySnapshot();
      selectedCells.forEach((c) => {
        c.style.color = colorHex;
        c.querySelectorAll("*").forEach((el) => {
          el.style.color = colorHex;
        });
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    if (activeTableState?.cell) {
      saveHistorySnapshot();
      activeTableState.cell.style.color = colorHex;
      activeTableState.cell.querySelectorAll("*").forEach((el) => {
        el.style.color = colorHex;
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    document.execCommand("foreColor", false, colorHex);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyHighlightColor = (colorHex) => {
    if (readOnly || !colorHex) return;

    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      saveHistorySnapshot();
      selectedCells.forEach((c) => {
        c.style.backgroundColor = colorHex;
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    if (activeTableState?.cell) {
      saveHistorySnapshot();
      activeTableState.cell.style.backgroundColor = colorHex;
      handleInput();
      saveHistorySnapshot();
      return;
    }

    document.execCommand("hiliteColor", false, colorHex);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const applyFontSize = (val) => {
    if (readOnly) return;
    setFontSize(val);

    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      saveHistorySnapshot();
      selectedCells.forEach((c) => {
        c.style.fontSize = val;
        c.querySelectorAll("*").forEach((el) => {
          el.style.fontSize = val;
        });
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

    if (activeTableState?.cell) {
      saveHistorySnapshot();
      activeTableState.cell.style.fontSize = val;
      activeTableState.cell.querySelectorAll("*").forEach((el) => {
        el.style.fontSize = val;
      });
      handleInput();
      saveHistorySnapshot();
      return;
    }

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
      saveHistorySnapshot();
    } else if (editorRef.current) {
      let node = selection?.anchorNode;
      if (node && node.nodeType === 3) node = node.parentNode;
      const block = node?.closest ? node.closest("p, div, td, th, li") : null;
      if (block && editorRef.current.contains(block)) {
        block.style.fontSize = val;
      } else {
        editorRef.current.style.fontSize = val;
      }
      handleInput();
      saveHistorySnapshot();
    }
    updateSelectionFormat();
  };

  const changeFontSizeStep = (delta) => {
    const sizes = [
      "9pt",
      "10pt",
      "10.5pt",
      "11pt",
      "12pt",
      "14pt",
      "16pt",
      "18pt",
      "20pt",
      "24pt",
    ];
    const currIdx = sizes.indexOf(fontSize);
    if (delta > 0 && currIdx < sizes.length - 1) {
      applyFontSize(sizes[currIdx + 1]);
    } else if (delta < 0 && currIdx > 0) {
      applyFontSize(sizes[currIdx - 1]);
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

  // =========================================================================
  // KEYDOWN HANDLER: PROTECT TABLES, CELLS & SHORTCUTS (Word-grade robustness)
  // =========================================================================
  const handleKeyDown = (e) => {
    if (readOnly) return;

    const isCtrlOrCmd = e.ctrlKey || e.metaKey;

    // KEYBOARD SHORTCUTS (Ctrl+S, Ctrl+P, Ctrl+Z, Ctrl+Y, Ctrl+B, Ctrl+I, Ctrl+U, etc.)
    if (isCtrlOrCmd) {
      const key = e.key.toLowerCase();

      // Ctrl + S: Simpan Draft
      if (key === "s") {
        e.preventDefault();
        if (onSave) {
          onSave();
        }
        return;
      }

      // Ctrl + P: Print Dokumen
      if (key === "p") {
        e.preventDefault();
        window.print();
        return;
      }

      // Ctrl + Z: Undo
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        customUndo();
        return;
      }

      // Ctrl + Y / Ctrl + Shift + Z: Redo
      if (key === "y" || (key === "z" && e.shiftKey)) {
        e.preventDefault();
        customRedo();
        return;
      }

      // Ctrl + B: Bold
      if (key === "b") {
        e.preventDefault();
        format("bold");
        return;
      }

      // Ctrl + I: Italic
      if (key === "i") {
        e.preventDefault();
        format("italic");
        return;
      }

      // Ctrl + U: Underline
      if (key === "u") {
        e.preventDefault();
        format("underline");
        return;
      }

      // Ctrl + E: Center Alignment
      if (key === "e") {
        e.preventDefault();
        format("justifyCenter");
        return;
      }

      // Ctrl + L: Left Alignment
      if (key === "l") {
        e.preventDefault();
        format("justifyLeft");
        return;
      }

      // Ctrl + R: Right Alignment
      if (key === "r") {
        e.preventDefault();
        format("justifyRight");
        return;
      }

      // Ctrl + J: Justify Alignment
      if (key === "j") {
        e.preventDefault();
        format("justifyFull");
        return;
      }
    }

    // Hapus isi sel kolom yang sedang dipilih jika tombol Backspace / Delete ditekan
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (
      selectedCells &&
      selectedCells.length > 0 &&
      (e.key === "Backspace" || e.key === "Delete")
    ) {
      e.preventDefault();
      saveHistorySnapshot(); // Catat riwayat SEBELUM sel dikosongkan
      selectedCells.forEach((c) => {
        c.innerHTML = "<br>";
      });
      handleInput();
      saveHistorySnapshot(); // Catat riwayat SETELAH sel dikosongkan
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);

    // 1. Protect locked letter number badge
    const node = sel.anchorNode;
    const element =
      node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;

    if (element?.closest(".locked-letter-number")) {
      e.preventDefault();
      return;
    }

    if (e.key === "Backspace" || e.key === "Delete") {
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
          range.startContainer?.nextSibling || element?.nextElementSibling;
        if (
          next?.classList?.contains("locked-letter-number") ||
          next?.querySelector?.(".locked-letter-number")
        ) {
          e.preventDefault();
          return;
        }
      }
    }

    // 2. ROBUST TABLE CELL PROTECTION (Prevent accidental column deletion / jumping)
    const startCell =
      range.startContainer.nodeType === 1
        ? range.startContainer.closest("td, th")
        : range.startContainer.parentElement?.closest("td, th");
    const endCell =
      range.endContainer.nodeType === 1
        ? range.endContainer.closest("td, th")
        : range.endContainer.parentElement?.closest("td, th");

    if (startCell || endCell) {
      // Kasus A: Seleksi melintasi lebih dari 1 cell (Multi-cell selection)
      // JANGAN biarkan browser menghapus elemen <td> itu sendiri!
      if (
        (e.key === "Backspace" || e.key === "Delete") &&
        startCell &&
        endCell &&
        startCell !== endCell
      ) {
        e.preventDefault();
        const table = startCell.closest("table");
        if (table) {
          const allCells = Array.from(table.querySelectorAll("td, th"));
          const startIdx = allCells.indexOf(startCell);
          const endIdx = allCells.indexOf(endCell);
          const minIdx = Math.min(startIdx, endIdx);
          const maxIdx = Math.max(startIdx, endIdx);
          for (let i = minIdx; i <= maxIdx; i++) {
            if (allCells[i]) allCells[i].innerHTML = "<br>";
          }
          focusCell(startCell, true);
          handleInput();
        }
        return;
      }

      // Kasus B: Kursor di dalam 1 cell tunggal
      if (startCell) {
        if (e.key === "Backspace") {
          const isCellEmpty =
            !startCell.textContent || startCell.textContent.trim() === "";

          let atStart = false;
          if (range.collapsed) {
            if (isCellEmpty) {
              atStart = true;
            } else {
              const testRange = document.createRange();
              testRange.selectNodeContents(startCell);
              testRange.setEnd(range.startContainer, range.startOffset);
              if (testRange.toString() === "") {
                atStart = true;
              }
            }
          }

          if (atStart) {
            // STOP browser dari menghapus <td> atau menggabungkan kolom ke kolom sebelah!
            e.preventDefault();
            if (startCell.innerHTML !== "<br>") {
              startCell.innerHTML = "<br>";
              focusCell(startCell, true);
              handleInput();
            }
            return;
          }
        } else if (e.key === "Delete") {
          let atEnd = false;
          if (range.collapsed) {
            const testRange = document.createRange();
            testRange.selectNodeContents(startCell);
            testRange.setStart(range.endContainer, range.endOffset);
            if (testRange.toString() === "") {
              atEnd = true;
            }
          }

          if (atEnd) {
            // STOP browser dari menghapus kolom berikutnya!
            e.preventDefault();
            return;
          }
        }
      }
    }

    // 3. WORD TAB NAVIGATION IN TABLES (Tab: next cell, Shift+Tab: prev cell, Tab on last cell: add row)
    if (e.key === "Tab") {
      e.preventDefault();
      const currentCell =
        range.startContainer.nodeType === 1
          ? range.startContainer.closest("td, th")
          : range.startContainer.parentElement?.closest("td, th");

      if (currentCell) {
        const table = currentCell.closest("table");
        const allCells = Array.from(table.querySelectorAll("td, th"));
        const currIdx = allCells.indexOf(currentCell);

        if (e.shiftKey) {
          // Mundur ke cell sebelumnya
          if (currIdx > 0) {
            focusCell(allCells[currIdx - 1], false);
          }
        } else {
          // Maju ke cell berikutnya
          if (currIdx < allCells.length - 1) {
            focusCell(allCells[currIdx + 1], true);
          } else {
            // Di cell terakhir dari tabel: buat baris baru persis seperti di Word!
            const lastRow = currentCell.closest("tr");
            const colCount = lastRow.children.length;
            const newRow = document.createElement("tr");
            for (let i = 0; i < colCount; i++) {
              const newCell = document.createElement("td");
              newCell.style.cssText = lastRow.children[i].style.cssText;
              newCell.innerHTML = "<br>";
              newRow.appendChild(newCell);
            }
            lastRow.after(newRow);
            handleInput();
            updateOverlayPosition();
            focusCell(newRow.children[0], true);
          }
        }
        return;
      }

      // Tab di luar tabel: sisipkan 4 spasi standar Word tab stop
      document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
      handleInput();
    }
  };

  // =========================================================================
  // MOUSE SELECTION HANDLING: Constrain selection to cell when dragging
  // =========================================================================
  const getCellBorderNearMouse = (e) => {
    if (readOnly || !editorRef.current) return null;
    const cell = e.target.closest ? e.target.closest("td, th") : null;
    if (!cell || !editorRef.current.contains(cell)) return null;
    const table = cell.closest("table");
    if (!table || !editorRef.current.contains(table)) return null;

    const rect = cell.getBoundingClientRect();
    const mouseX = e.clientX;

    if (Math.abs(mouseX - rect.right) <= 6) {
      return { cell, table, colIndex: cell.cellIndex };
    }
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

    // Check if dragging across cell boundary inside table
    if (e.buttons === 1 && dragStartCellRef.current) {
      const currentCell = e.target.closest ? e.target.closest("td, th") : null;
      const startCell = dragStartCellRef.current;
      const table = startCell.closest("table");

      if (currentCell && table && table.contains(currentCell)) {
        const startCol = startCell.cellIndex;
        const currentCol = currentCell.cellIndex;
        const startRow = startCell.parentElement.rowIndex;
        const currentRow = currentCell.parentElement.rowIndex;

        // Seleksi sel Word: Mendukung drag ke bawah (kolom), drag ke samping (baris), dan kotak (diagonal)
        if (startRow !== currentRow || startCol !== currentCol) {
          window.getSelection()?.removeAllRanges();

          const minRow = Math.min(startRow, currentRow);
          const maxRow = Math.max(startRow, currentRow);
          const minCol = Math.min(startCol, currentCol);
          const maxCol = Math.max(startCol, currentCol);

          table.querySelectorAll(".table-cell-selected").forEach((el) => {
            el.classList.remove("table-cell-selected");
          });

          const rows = Array.from(table.rows);
          for (let r = minRow; r <= maxRow; r++) {
            for (let c = minCol; c <= maxCol; c++) {
              const targetCell = rows[r]?.cells[c];
              if (targetCell) {
                targetCell.classList.add("table-cell-selected");
              }
            }
          }
          return;
        }
      }
    }

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
    const cell = e.target.closest ? e.target.closest("td, th") : null;
    if (cell && editorRef.current?.contains(cell)) {
      dragStartCellRef.current = cell;
      if (!e.shiftKey && editorRef.current) {
        editorRef.current
          .querySelectorAll(".table-cell-selected")
          .forEach((el) => {
            el.classList.remove("table-cell-selected");
          });
      }
    } else {
      dragStartCellRef.current = null;
      if (editorRef.current) {
        editorRef.current
          .querySelectorAll(".table-cell-selected")
          .forEach((el) => {
            el.classList.remove("table-cell-selected");
          });
      }
    }

    const border = getCellBorderNearMouse(e);
    if (!border) return;

    e.preventDefault();
    e.stopPropagation();

    const { cell: targetCell, table, colIndex } = border;
    isDraggingColumnRef.current = true;

    table.style.tableLayout = "fixed";

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

    const nextCell = targetCell.nextElementSibling;
    const startX = e.clientX;
    const startCellWidth = initialWidths[colIndex] || 80;
    const nextColIndex = nextCell ? colIndex + 1 : null;
    const startNextWidth = nextCell ? initialWidths[nextColIndex] || 80 : null;
    const startTableWidth = table.offsetWidth;

    setResizeGuide({ x: e.clientX });

    const onWindowMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;

      if (nextCell && !moveEvent.shiftKey) {
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

  const handleEditorMouseUp = () => {
    dragStartCellRef.current = null;
    updateActiveTable();
    updateSelectionFormat();
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

  // =========================================================================
  // TABLE MANIPULATION ACTIONS
  // =========================================================================
  const addRowAbove = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { table, cell } = activeTableState;
    const row = cell.parentElement;
    const colCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const isHeader = row.children[i].tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      newCell.style.cssText = row.children[i].style.cssText;
      newCell.innerHTML = "<br>";
      newRow.appendChild(newCell);
    }
    const tbody = table.querySelector("tbody");
    if (tbody) {
      tbody.insertBefore(newRow, row);
    } else {
      table.insertBefore(newRow, row);
    }
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
    focusCell(newRow.children[0]);
  };

  const addRowBelow = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { cell } = activeTableState;
    const row = cell.parentElement;
    const colCount = row.children.length;
    const newRow = document.createElement("tr");
    for (let i = 0; i < colCount; i++) {
      const newCell = document.createElement("td");
      newCell.style.cssText = row.children[i].style.cssText;
      newCell.innerHTML = "<br>";
      newRow.appendChild(newCell);
    }
    row.after(newRow);
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
    focusCell(newRow.children[0]);
  };

  const addColLeft = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { table, colIndex } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((r, idx) => {
      const refCell = r.children[colIndex];
      const isHeader = idx === 0 && refCell?.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      if (refCell) newCell.style.cssText = refCell.style.cssText;
      newCell.style.width = "100px";
      newCell.innerHTML = isHeader ? `Kolom Baru` : `<br>`;
      r.insertBefore(newCell, refCell);
    });
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
  };

  const addColRight = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { table, colIndex } = activeTableState;
    const rows = Array.from(table.querySelectorAll("tr"));
    rows.forEach((r, idx) => {
      const refCell = r.children[colIndex];
      const isHeader = idx === 0 && refCell?.tagName.toLowerCase() === "th";
      const newCell = document.createElement(isHeader ? "th" : "td");
      if (refCell) newCell.style.cssText = refCell.style.cssText;
      newCell.style.width = "100px";
      newCell.innerHTML = isHeader ? `Kolom Baru` : `<br>`;
      if (refCell && refCell.nextSibling) {
        r.insertBefore(newCell, refCell.nextSibling);
      } else {
        r.appendChild(newCell);
      }
    });
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
  };

  // Pilih seluruh sel hanya di kolom aktif saat ini (tanpa menyentuh kolom lain)
  const selectCurrentColumn = () => {
    if (!activeTableState) return;
    const { table, colIndex } = activeTableState;
    window.getSelection()?.removeAllRanges();
    if (editorRef.current) {
      editorRef.current
        .querySelectorAll(".table-cell-selected")
        .forEach((el) => {
          el.classList.remove("table-cell-selected");
        });
    }
    Array.from(table.rows).forEach((row) => {
      const cell = row.cells[colIndex];
      if (cell) cell.classList.add("table-cell-selected");
    });
  };

  // Pilih seluruh sel hanya di baris aktif saat ini
  const selectCurrentRow = () => {
    if (!activeTableState) return;
    const { table, rowIndex } = activeTableState;
    window.getSelection()?.removeAllRanges();
    if (editorRef.current) {
      editorRef.current
        .querySelectorAll(".table-cell-selected")
        .forEach((el) => {
          el.classList.remove("table-cell-selected");
        });
    }
    const row = table.rows[rowIndex];
    if (row) {
      Array.from(row.cells).forEach((cell) =>
        cell.classList.add("table-cell-selected"),
      );
    }
  };

  // Geser isi sel di kolom aktif saja ke baris bawahnya (kolom lain tidak bergeser)
  const shiftColumnCellsDown = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { table, cell, colIndex, rowIndex } = activeTableState;
    const rows = Array.from(table.rows);
    for (let r = rows.length - 1; r > rowIndex; r--) {
      const targetCell = rows[r]?.cells[colIndex];
      const prevCell = rows[r - 1]?.cells[colIndex];
      if (targetCell && prevCell) {
        targetCell.innerHTML = prevCell.innerHTML;
      }
    }
    cell.innerHTML = "<br>";
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
  };

  const deleteCurrentRow = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    const { table, cell } = activeTableState;
    const row = cell.parentElement;
    if (table.querySelectorAll("tr").length <= 1) {
      table.remove();
      setActiveTableState(null);
    } else {
      row.remove();
    }
    handleInput();
    saveHistorySnapshot();
    updateOverlayPosition();
  };

  const deleteCurrentCol = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
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
    saveHistorySnapshot();
    updateOverlayPosition();
  };

  const deleteTable = () => {
    if (!activeTableState) return;
    saveHistorySnapshot();
    activeTableState.table.remove();
    setActiveTableState(null);
    handleInput();
    saveHistorySnapshot();
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
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      format("justifyCenter");
      return;
    }
    const { table } = activeTableState;
    table.style.marginLeft = "auto";
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const alignTableLeft = () => {
    if (!activeTableState) return;
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      format("justifyLeft");
      return;
    }
    const { table } = activeTableState;
    table.style.marginLeft = "0";
    table.style.marginRight = "auto";
    handleInput();
    updateOverlayPosition();
  };

  const alignTableRight = () => {
    if (!activeTableState) return;
    const selectedCells = editorRef.current?.querySelectorAll(
      ".table-cell-selected",
    );
    if (selectedCells && selectedCells.length > 0) {
      format("justifyRight");
      return;
    }
    const { table } = activeTableState;
    table.style.marginLeft = "auto";
    table.style.marginRight = "0";
    handleInput();
    updateOverlayPosition();
  };

  // =========================================================================
  // INSERT TEMPLATES & VARIABLES
  // =========================================================================
  const insertOfficialHeader = () => {
    if (readOnly) return;
    const numDisplay = letterNumber || "{{nomor_surat}}";
    const perihalDisplay =
      perihal && perihal.trim() ? perihal.trim() : "Permohonan";
    const dariDisplay = submitterName || "[Nama Pemohon]";

    const html = `
<table style="width: 100%; border: none; border-collapse: collapse; margin-bottom: 14px; font-family: inherit; font-size: inherit; table-layout: fixed;">
  <tr>
    <td style="width: 15%; vertical-align: top; padding: 2px 0;"><strong>Nomor</strong></td>
    <td style="width: 3%; vertical-align: top; padding: 2px 0;">:</td>
    <td style="vertical-align: top; padding: 2px 0;"><span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #000000; background-color: #f8fafc; padding: 1px 5px; border-radius: 3px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi otomatis dari sistem (Terkunci)">${numDisplay}</span></td>
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
</table>
<p><br></p>`;
    saveHistorySnapshot();
    document.execCommand("insertHTML", false, html);
    handleInput();
    saveHistorySnapshot();
  };

  const insertFieldRowLayout = () => {
    if (readOnly) return;
    saveHistorySnapshot();
    const html = `
<table style="width: 100%; border: none; border-collapse: collapse; margin: 12px 0; font-family: inherit; font-size: 11pt; line-height: 1.6; table-layout: fixed;">
  <tr>
    <td style="width: 25%; padding: 3px 0;">Nama Lengkap</td>
    <td style="width: 3%; text-align: center; padding: 3px 0;">:</td>
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
    saveHistorySnapshot();
  };

  const insertTable = (customRows = 3, customCols = 3) => {
    if (readOnly) return;
    saveHistorySnapshot();
    const rowNum = customRows || 3;
    const colNum = customCols || 3;
    const widthPct = (100 / colNum).toFixed(1);

    let tableHtml =
      '<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1; font-family: inherit; font-size: 11pt; table-layout: fixed;">';
    for (let r = 0; r < rowNum; r++) {
      tableHtml += "<tr>";
      for (let c = 0; c < colNum; c++) {
        if (r === 0) {
          tableHtml += `<th style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 6px 10px; background-color: #f1f5f9; text-align: left; font-weight: bold; font-size: 11pt;">Kolom ${c + 1}</th>`;
        } else {
          tableHtml += `<td style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11pt;"><br></td>`;
        }
      }
      tableHtml += "</tr>";
    }
    tableHtml += "</table><p><br></p>";
    document.execCommand("insertHTML", false, tableHtml);
    handleInput();
    saveHistorySnapshot();
  };

  const insertVariable = (varKey) => {
    if (readOnly) return;
    if (varKey === "nomor_surat") {
      const numDisplay = letterNumber || "{{nomor_surat}}";
      const badge = `<span class="locked-letter-number" contenteditable="false" style="user-select: none; font-weight: bold; color: #000000; background-color: #f1f5f9; padding: 1px 6px; border-radius: 4px; border: 1px solid #cbd5e1; cursor: not-allowed; display: inline-block;" title="Nomor surat resmi (Terkunci)">${numDisplay}</span>`;
      document.execCommand("insertHTML", false, badge);
    } else {
      const tag = `{{${varKey}}}`;
      document.execCommand("insertText", false, tag);
    }
    handleInput();
  };

  const insertImage = () => {
    if (readOnly) return;
    const url = prompt(
      "Masukkan URL Gambar (atau paste link gambar):",
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop&q=80",
    );
    if (url) {
      const imgHtml = `<p style="text-align: center;"><img src="${url}" alt="Lampiran Foto" style="max-width: 80%; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); margin: 12px auto; display: inline-block;" /></p><p><br></p>`;
      document.execCommand("insertHTML", false, imgHtml);
      handleInput();
    }
  };

  // =========================================================================
  // EXCEL / SPREADSHEET TABLE IMPORT & PASTE LOGIC
  // =========================================================================
  const openExcelModal = () => {
    if (readOnly) return;
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedRangeRef.current = sel.getRangeAt(0).cloneRange();
    } else {
      savedRangeRef.current = null;
    }
    setShowExcelModal(true);
  };

  const isTsvData = (text) => {
    if (!text) return false;
    const lines = text.trim().split(/\r\n|\r|\n/);
    const tabLines = lines.filter((l) => l.includes("\t"));
    return (
      tabLines.length >= 1 &&
      (lines.length > 1 || lines[0].split("\t").length >= 2)
    );
  };

  const formatTsvToTable = (
    tsvText,
    firstRowIsHeader = true,
    autoAlign = true,
  ) => {
    if (!tsvText) return "";
    const lines = tsvText.trim().split(/\r\n|\r|\n/);
    if (lines.length === 0) return "";

    const matrix = lines.map((line) => line.split("\t"));
    const maxCols = Math.max(...matrix.map((r) => r.length));
    if (maxCols <= 1 && matrix.length <= 1) return "";

    const widthPct = (100 / maxCols).toFixed(1);
    let html = `<table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1; font-family: inherit; font-size: 11pt; table-layout: auto;">`;

    matrix.forEach((row, rowIdx) => {
      html += `<tr>`;
      for (let c = 0; c < maxCols; c++) {
        const rawVal = row[c] !== undefined ? row[c].trim() : "";
        const cellContent = rawVal
          ? rawVal.replace(/</g, "&lt;").replace(/>/g, "&gt;")
          : "<br>";

        let align = "text-align: left;";
        if (autoAlign && rawVal) {
          const cleanNum = rawVal.replace(/[.,%Rp\s]/g, "");
          if (cleanNum && !isNaN(cleanNum) && !/[a-zA-Z]/.test(rawVal)) {
            align = "text-align: right;";
          }
        }

        if (rowIdx === 0 && firstRowIsHeader) {
          html += `<th style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 6px 10px; background-color: #f1f5f9; font-weight: bold; font-size: 11pt; ${align} vertical-align: middle;">${cellContent}</th>`;
        } else {
          html += `<td style="width: ${widthPct}%; border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11pt; ${align} vertical-align: middle;">${cellContent}</td>`;
        }
      }
      html += `</tr>`;
    });
    html += `</table><p><br></p>`;
    return html;
  };

  const formatExcelHtmlTable = (htmlText) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, "text/html");
      const tables = doc.querySelectorAll("table");
      if (!tables || tables.length === 0) return null;

      tables.forEach((table) => {
        table.removeAttribute("width");
        table.removeAttribute("height");
        table.removeAttribute("border");
        table.removeAttribute("cellspacing");
        table.removeAttribute("cellpadding");
        table.className = "w-full my-3";
        table.setAttribute(
          "style",
          "width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1; font-family: inherit; font-size: 11pt; table-layout: auto;",
        );

        // Remove colgroup/col
        table.querySelectorAll("colgroup, col").forEach((el) => el.remove());

        const rows = table.querySelectorAll("tr");
        rows.forEach((tr, rIdx) => {
          tr.removeAttribute("height");
          tr.removeAttribute("style");

          const cells = tr.querySelectorAll("td, th");
          cells.forEach((cell) => {
            let textAlign = "left";
            const styleAlign = cell.style.textAlign;
            const alignAttr = cell.getAttribute("align");
            if (styleAlign) textAlign = styleAlign;
            else if (alignAttr) textAlign = alignAttr;
            else {
              const text = cell.innerText.trim();
              if (
                text &&
                !isNaN(text.replace(/[.,%Rp\s]/g, "")) &&
                !/[a-zA-Z]/.test(text)
              ) {
                textAlign = "right";
              }
            }

            const isHeader = rIdx === 0;
            const bg = isHeader
              ? "background-color: #f1f5f9; font-weight: bold;"
              : "";

            cell.removeAttribute("class");
            cell.removeAttribute("width");
            cell.removeAttribute("height");
            cell.setAttribute(
              "style",
              `border: 1px solid #cbd5e1; padding: 6px 10px; font-size: 11pt; text-align: ${textAlign}; vertical-align: middle; ${bg}`,
            );

            if (!cell.innerHTML.trim()) {
              cell.innerHTML = "<br>";
            }
          });
        });
      });

      return (
        Array.from(tables)
          .map((t) => t.outerHTML)
          .join("<p><br></p>") + "<p><br></p>"
      );
    } catch (err) {
      console.error("Failed to parse Excel HTML:", err);
      return null;
    }
  };

  const handlePaste = (e) => {
    if (readOnly) return;
    const clipboardData = e.clipboardData || window.clipboardData;
    if (!clipboardData) return;

    const htmlData = clipboardData.getData("text/html");
    const textData = clipboardData.getData("text/plain");

    // Case 1: Copied from Excel / Word / web as HTML table
    if (htmlData && htmlData.includes("<table")) {
      const cleanTable = formatExcelHtmlTable(htmlData);
      if (cleanTable) {
        e.preventDefault();
        document.execCommand("insertHTML", false, cleanTable);
        handleInput();
        return;
      }
    }

    // Case 2: Copied as TSV (tab separated rows/columns from Excel)
    if (textData && isTsvData(textData)) {
      const cleanTable = formatTsvToTable(textData, true, true);
      if (cleanTable) {
        e.preventDefault();
        document.execCommand("insertHTML", false, cleanTable);
        handleInput();
        return;
      }
    }

    // Case 3: Copied plain text (Ctrl+V teks bersih tanpa style luar yang merusak tata letak)
    if (textData && (!htmlData || !htmlData.includes("<table"))) {
      e.preventDefault();
      document.execCommand(
        "insertText",
        false,
        textData.replace(/\r\n/g, "\n"),
      );
      handleInput();
      return;
    }

    // Fallback sync input
    setTimeout(() => {
      handleInput();
    }, 20);
  };

  const handleRibbonPaste = async () => {
    if (readOnly) return;
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          if (isTsvData(text)) {
            const cleanTable = formatTsvToTable(text, true, true);
            if (cleanTable) {
              document.execCommand("insertHTML", false, cleanTable);
              handleInput();
              return;
            }
          }
          document.execCommand(
            "insertText",
            false,
            text.replace(/\r\n/g, "\n"),
          );
          handleInput();
          return;
        }
      }
    } catch (err) {
      console.warn("Clipboard access warning:", err);
    }
    document.execCommand("paste");
    handleInput();
  };

  const insertExcelTableFromModal = () => {
    if (!excelPasteText.trim() || !editorRef.current) return;
    let tableHtml = "";

    if (excelPasteText.includes("<table")) {
      tableHtml = formatExcelHtmlTable(excelPasteText);
    } else {
      tableHtml = formatTsvToTable(
        excelPasteText,
        excelHeaderFirstRow,
        excelAutoAlign,
      );
    }

    if (!tableHtml) {
      alert(
        "Format data tidak terbaca sebagai tabel. Pastikan Anda meng-copy sel dari Excel atau spreadsheet.",
      );
      return;
    }

    editorRef.current.focus();
    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      try {
        sel.removeAllRanges();
        sel.addRange(savedRangeRef.current);
      } catch (e) {
        // Range expired
      }
    }

    saveHistorySnapshot();
    const inserted = document.execCommand("insertHTML", false, tableHtml);
    if (!inserted) {
      editorRef.current.innerHTML += tableHtml;
    }

    handleInput();
    saveHistorySnapshot();
    setShowExcelModal(false);
    setExcelPasteText("");
  };

  const readClipboardDirectly = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setExcelPasteText(text);
        }
      }
    } catch (err) {
      alert(
        "Akses clipboard langsung dibatasi browser. Silakan tekan Ctrl+V pada kotak teks di bawah.",
      );
    }
  };

  const containerClasses = isFullscreen
    ? "fixed inset-0 z-50 bg-[#e9ecef] flex flex-col h-screen w-screen overflow-hidden animate-fadeIn select-none font-sans"
    : "bg-[#f3f4f6] border border-slate-300 rounded-lg overflow-hidden shadow-xl flex flex-col font-sans select-none";

  return (
    <div className={containerClasses}>
      {/* ========================================================================= */}
      {/* 1. MICROSOFT WORD CLASSIC TITLE BAR (#2b579a)                             */}
      {/* ========================================================================= */}
      <div className="bg-[#2b579a] text-white px-3 py-1.5 flex items-center justify-between text-xs shadow-xs shrink-0 select-none">
        {/* Sisi Kiri: Word Icon & Quick Access Toolbar */}
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 bg-[#185abd] text-white rounded flex items-center justify-center font-bold text-[11px] shadow-2xs border border-white/20">
            W
          </div>
          <div className="flex items-center gap-1 border-r border-white/20 pr-2">
            <button
              type="button"
              onClick={customUndo}
              className="p-1 hover:bg-white/15 rounded text-white/90 hover:text-white transition"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={customRedo}
              className="p-1 hover:bg-white/15 rounded text-white/90 hover:text-white transition"
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
            {letterNumber || perihal || "Dokumen1"} - Microsoft Word
          </span>
        </div>

        {/* Sisi Kanan: Action Controls (Simpan, Tutup/Minimize) */}
        <div className="flex items-center gap-2 text-xs">
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 active:bg-white/30 text-white rounded text-[11px] font-semibold flex items-center gap-1 transition border border-white/20 shadow-xs"
              title="Simpan draft"
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
              title="Tutup & kembali ke review surat"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selesai &amp; Review</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. UNIFIED WORD TOOLBAR (Papan Klip, Huruf, Paragraf, Sisipkan Format)    */}
      {/* ========================================================================= */}
      {!readOnly && (
        <div className="bg-[#f3f4f6] border-b border-slate-300 p-2 select-none shadow-2xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* GROUP: CLIPBOARD */}
            <div className="flex flex-col items-center border-r border-slate-300 pr-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleRibbonPaste}
                  className="p-1 text-slate-700 hover:bg-slate-200 rounded flex flex-col items-center gap-0.5 text-[10px]"
                  title="Tempel Teks (Ctrl+V)"
                >
                  <Clipboard className="w-4 h-4 text-amber-600" />
                  <span>Paste</span>
                </button>
                <button
                  type="button"
                  onClick={openExcelModal}
                  className="p-1 text-emerald-800 hover:bg-emerald-100 rounded flex flex-col items-center gap-0.5 text-[10px] font-semibold border border-emerald-300 bg-emerald-50"
                  title="Paste Tabel dari Microsoft Excel / Spreadsheet"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Excel</span>
                </button>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => format("cut")}
                    className="p-1 text-slate-700 hover:bg-slate-200 rounded"
                    title="Potong (Cut)"
                  >
                    <Scissors className="w-3 h-3 text-slate-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => format("copy")}
                    className="p-1 text-slate-700 hover:bg-slate-200 rounded"
                    title="Salin (Copy)"
                  >
                    <Copy className="w-3 h-3 text-slate-600" />
                  </button>
                </div>
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1">
                Papan Klip
              </span>
            </div>

            {/* GROUP: FONT */}
            <div className="flex flex-col items-center border-r border-slate-300 pr-2">
              {/* Baris 1: Font Family, Size, Grow/Shrink */}
              <div className="flex items-center gap-1">
                <select
                  value={fontFamily}
                  onChange={(e) => applyFontFamily(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-800 font-medium w-28 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="Calibri">Calibri</option>
                  <option value="Arial">Arial</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Courier New">Courier New</option>
                </select>

                <select
                  value={fontSize}
                  onChange={(e) => applyFontSize(e.target.value)}
                  className="text-xs bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-800 font-medium w-16 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="9pt">9</option>
                  <option value="10pt">10</option>
                  <option value="10.5pt">10.5</option>
                  <option value="11pt">11</option>
                  <option value="12pt">12</option>
                  <option value="14pt">14</option>
                  <option value="16pt">16</option>
                  <option value="18pt">18</option>
                  <option value="20pt">20</option>
                  <option value="24pt">24</option>
                </select>

                <button
                  type="button"
                  onClick={() => changeFontSizeStep(1)}
                  className="px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded border border-slate-200 bg-white"
                  title="Perbesar Huruf (Grow Font)"
                >
                  A<span className="text-[9px]">▲</span>
                </button>
                <button
                  type="button"
                  onClick={() => changeFontSizeStep(-1)}
                  className="px-1.5 py-0.5 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded border border-slate-200 bg-white"
                  title="Perkecil Huruf (Shrink Font)"
                >
                  A<span className="text-[9px]">▼</span>
                </button>
              </div>

              {/* Baris 2: B, I, U, Strike, Highlight, Color */}
              <div className="flex items-center gap-0.5 mt-1">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("bold")}
                  className={`px-2 py-0.5 font-black text-xs rounded transition ${
                    isBold
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 font-black shadow-inner"
                      : "text-slate-800 hover:bg-slate-200"
                  }`}
                  title="Tebal (Ctrl+B)"
                >
                  B
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("italic")}
                  className={`px-2 py-0.5 italic font-serif text-xs rounded transition ${
                    isItalic
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 font-bold shadow-inner"
                      : "text-slate-800 hover:bg-slate-200"
                  }`}
                  title="Miring (Ctrl+I)"
                >
                  I
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("underline")}
                  className={`px-2 py-0.5 underline text-xs rounded transition ${
                    isUnderline
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 font-bold shadow-inner"
                      : "text-slate-800 hover:bg-slate-200"
                  }`}
                  title="Garis Bawah (Ctrl+U)"
                >
                  U
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("strikeThrough")}
                  className={`px-1.5 py-0.5 line-through text-xs rounded transition ${
                    isStrike
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 font-bold shadow-inner"
                      : "text-slate-800 hover:bg-slate-200"
                  }`}
                  title="Coret (Strikethrough)"
                >
                  ab
                </button>

                <span className="text-slate-300 mx-0.5">|</span>

                {/* Highlight Color */}
                <label
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-0.5"
                  title="Warna Sorotan Teks (Highlight)"
                >
                  <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                  <input
                    type="color"
                    defaultValue="#fef08a"
                    onChange={(e) => applyHighlightColor(e.target.value)}
                    className="w-3 h-3 p-0 border-0 rounded cursor-pointer bg-transparent"
                  />
                </label>

                {/* Font Color */}
                <label
                  className="p-1 hover:bg-slate-200 rounded cursor-pointer flex items-center gap-0.5"
                  title="Warna Huruf (Font Color)"
                >
                  <span className="text-xs font-bold text-red-600 underline">
                    A
                  </span>
                  <input
                    type="color"
                    defaultValue="#0f172a"
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
              {/* Baris 1: Alignment & Lists */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyLeft")}
                  className={`p-1 rounded transition ${
                    textAlign === "left"
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 shadow-inner"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Rata Kiri"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyCenter")}
                  className={`p-1 rounded transition ${
                    textAlign === "center"
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 shadow-inner"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Rata Tengah"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyRight")}
                  className={`p-1 rounded transition ${
                    textAlign === "right"
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 shadow-inner"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Rata Kanan"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyFull")}
                  className={`p-1 rounded transition ${
                    textAlign === "justify"
                      ? "bg-blue-200 text-blue-800 ring-1 ring-blue-400 shadow-inner"
                      : "text-slate-700 hover:bg-slate-200"
                  }`}
                  title="Rata Kanan-Kiri (Justify)"
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>

                <span className="text-slate-300 mx-0.5">|</span>

                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("insertUnorderedList")}
                  className="p-1 text-slate-700 hover:bg-slate-200 rounded"
                  title="Daftar Bullet"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("insertOrderedList")}
                  className="p-1 text-slate-700 hover:bg-slate-200 rounded"
                  title="Daftar Nomor"
                >
                  <ListOrdered className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Baris 2: Line Spacing & Paragraph Spacing */}
              <div className="flex items-center gap-1.5 mt-1 text-[11px]">
                <span className="text-slate-500 font-medium">Spasi:</span>
                <select
                  value={lineSpacing}
                  onChange={(e) => applyLineSpacing(e.target.value)}
                  className="text-[11px] bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-800"
                >
                  <option value="1.0">1.0</option>
                  <option value="1.15">1.15</option>
                  <option value="1.3">1.3 (Surat)</option>
                  <option value="1.5">1.5</option>
                  <option value="2.0">2.0</option>
                </select>

                <select
                  value={paragraphSpacing}
                  onChange={(e) => applyParagraphSpacing(e.target.value)}
                  className="text-[11px] bg-white border border-slate-300 rounded px-1 py-0.5 text-slate-800"
                >
                  <option value="tight">Rapat (4px)</option>
                  <option value="normal">Normal (10px)</option>
                  <option value="loose">Renggang (18px)</option>
                </select>
              </div>
              <span className="text-[9px] text-slate-400 font-medium mt-1">
                Paragraf
              </span>
            </div>

            {/* GROUP: SISIPKAN & FORMAT DOKUMEN */}
            <div className="flex flex-col items-center">
              {/* Baris 1: Header Surat, Kolom Rapi, Gambar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={insertOfficialHeader}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                  title="Sisipkan Header Lengkap: No, Lamp, Perihal, Dari, Kepada"
                >
                  <Layout className="w-3.5 h-3.5 text-blue-600" />
                  <span>Header Surat</span>
                </button>

                <button
                  type="button"
                  onClick={insertFieldRowLayout}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-blue-500 hover:bg-blue-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                  title="Sisipkan Kolom Biodata Rapi (Titik dua sejajar otomatis)"
                >
                  <Columns className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Kolom Rapi (Tab)</span>
                </button>

                <button
                  type="button"
                  onClick={insertImage}
                  className="px-2.5 py-1 bg-white border border-slate-300 hover:border-sky-500 hover:bg-sky-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                  title="Sisipkan Gambar dari URL"
                >
                  <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                  <span>Gambar</span>
                </button>
              </div>

              {/* Baris 2: Tabel 3x3, Kustom Tabel, Paste Excel, Variabel */}
              <div className="flex items-center gap-1 mt-1">
                <button
                  type="button"
                  onClick={() => insertTable(3, 3)}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 rounded text-xs font-semibold text-slate-800 flex items-center gap-1 shadow-2xs transition"
                  title="Sisipkan Tabel 3x3 Standar"
                >
                  <TableIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Tabel (3x3)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const r = prompt("Jumlah Baris:", "3");
                    const c = prompt("Jumlah Kolom:", "3");
                    if (r && c) insertTable(parseInt(r, 10), parseInt(c, 10));
                  }}
                  className="px-2 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 rounded text-xs text-slate-700 shadow-2xs"
                  title="Kustom Baris & Kolom Tabel"
                >
                  <span>Kustom...</span>
                </button>

                {availableVariables.length > 0 && (
                  <div className="flex items-center gap-1 pl-1 border-l border-slate-300">
                    <span className="text-[10px] text-slate-400 font-medium">Var:</span>
                    {availableVariables.slice(0, 3).map((v) => (
                      <button
                        key={v.key}
                        type="button"
                        onClick={() => insertVariable(v.key)}
                        className="px-1.5 py-0.5 bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-700 rounded text-[10px] font-medium shadow-2xs"
                        title={`Sisipkan variabel ${v.label}`}
                      >
                        +{v.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[9px] text-slate-400 font-medium mt-1">
                Sisipkan &amp; Format Dokumen
              </span>
            </div>
          </div>

          {/* TAB KONTEKSTUAL: ALAT TABEL (TABLE TOOLS) */}
          {activeTableState && (
            <div className="bg-indigo-50/80 -m-2 mt-1.5 p-2 border-t border-indigo-200 flex flex-wrap items-center gap-2 text-xs animate-fadeIn">
              <div className="flex items-center gap-1 font-bold text-indigo-900 pr-2 border-r border-indigo-200">
                <Grid className="w-4 h-4 text-indigo-600" />
                <span>Alat Tabel:</span>
              </div>

              {/* Sisip Baris / Kolom */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addRowAbove}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah baris di atas kursor"
                >
                  + Baris Atas
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addRowBelow}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah baris di bawah kursor"
                >
                  + Baris Bawah
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addColLeft}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah kolom di sebelah kiri"
                >
                  + Kolom Kiri
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={addColRight}
                  className="px-2 py-0.5 hover:bg-indigo-50 text-slate-700 rounded text-[11px] font-medium"
                  title="Tambah kolom di sebelah kanan"
                >
                  + Kolom Kanan
                </button>
              </div>

              {/* Opsi Kolom & Baris Khusus (Pilih Kolom, Pilih Baris, Geser Sel) */}
              <div className="flex items-center gap-1 bg-white border border-blue-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={selectCurrentColumn}
                  className="px-2.5 py-0.5 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold bg-blue-50 border border-blue-200"
                  title="Pilih seluruh sel hanya pada kolom ini saja (tanpa menyentuh kolom lain)"
                >
                  Pilih Kolom Ini
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={selectCurrentRow}
                  className="px-2.5 py-0.5 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold bg-blue-50 border border-blue-200"
                  title="Pilih seluruh sel hanya pada baris ini saja (ke samping)"
                >
                  Pilih Baris Ini
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={shiftColumnCellsDown}
                  className="px-2 py-0.5 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-medium"
                  title="Sisipkan sel kosong & geser isi kolom ini ke bawah (kolom lain tidak bergeser)"
                >
                  ↓ Geser Kolom ke Bawah
                </button>
              </div>

              {/* Pengaturan Lebar */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={distributeColumnsEvenly}
                  className="px-2 py-0.5 text-indigo-700 hover:bg-indigo-50 rounded text-[11px] font-semibold"
                  title="Bagi rata lebar semua kolom"
                >
                  Bagi Rata Kolom
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={setTableFullWidth}
                  className="px-2 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px] font-medium"
                  title="Set lebar 100% selebar halaman"
                >
                  100% Penuh
                </button>
              </div>

              {/* Perataan Teks Sel (Rata Kiri, Rata Tengah, Rata Kanan) */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <span className="text-[10px] text-indigo-900 font-semibold px-1">
                  Teks Sel:
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyLeft")}
                  className="p-1 text-slate-700 hover:bg-indigo-50 rounded"
                  title="Rata Kiri Teks Sel (Ctrl+L)"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyCenter")}
                  className="p-1 text-slate-700 hover:bg-indigo-50 rounded bg-indigo-50/50"
                  title="Rata Tengah Teks Sel (Ctrl+E)"
                >
                  <AlignCenter className="w-3.5 h-3.5 text-blue-700 font-bold" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => format("justifyRight")}
                  className="p-1 text-slate-700 hover:bg-indigo-50 rounded"
                  title="Rata Kanan Teks Sel (Ctrl+R)"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Posisi Tabel di Kertas */}
              <div className="flex items-center gap-1 bg-white border border-indigo-200 rounded p-0.5 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-medium px-1">
                  Posisi Tabel:
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={indentTableLeft}
                  className="px-1.5 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px]"
                  title="Geser Tabel Sedikit ke Kiri"
                >
                  <ArrowLeft className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={alignTableLeft}
                  className="px-2 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px]"
                  title="Posisikan Tabel di Rata Kiri Kertas"
                >
                  Kiri
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={alignTableCenter}
                  className="px-2 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px]"
                  title="Posisikan Tabel di Tengah Kertas"
                >
                  Tengah
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={alignTableRight}
                  className="px-2 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px]"
                  title="Posisikan Tabel di Rata Kanan Kertas"
                >
                  Kanan
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={indentTableRight}
                  className="px-1.5 py-0.5 text-slate-700 hover:bg-indigo-50 rounded text-[11px]"
                  title="Geser Tabel Sedikit ke Kanan"
                >
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Hapus Baris, Kolom, Tabel */}
              <div className="flex items-center gap-1 bg-white border border-rose-200 rounded p-0.5 shadow-2xs ml-auto">
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={deleteCurrentRow}
                  className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium"
                  title="Hapus baris ini"
                >
                  Hapus Baris
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={deleteCurrentCol}
                  className="px-2 py-0.5 text-rose-600 hover:bg-rose-50 rounded text-[11px] font-medium"
                  title="Hapus kolom ini"
                >
                  Hapus Kolom
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
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

      {/* Visual Guide Line during column resize */}
      {resizeGuide && (
        <div
          style={{ left: `${resizeGuide.x}px` }}
          className="fixed top-0 bottom-0 w-0.5 bg-blue-600 z-50 pointer-events-none shadow-md flex items-center justify-center"
        >
          <div className="bg-blue-700 text-white text-[11px] font-medium px-2 py-1 rounded shadow-lg absolute top-1/3 -translate-y-1/2 flex items-center gap-1 select-none">
            <span>↔ Atur Lebar Kolom</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MICROSOFT WORD HORIZONTAL RULER (PENGGARIS WORD)                       */}
      {/* ========================================================================= */}
      <div className="bg-[#e9ecef] border-b border-slate-300 flex justify-center overflow-x-hidden select-none py-0.5 shrink-0">
        <div
          style={{
            width: `${Math.round(820 * (zoomLevel / 100))}px`,
            maxWidth: "100%",
          }}
          className="h-5 bg-white border-x border-slate-300 relative flex items-center justify-between text-[9px] font-mono text-slate-500 shadow-2xs"
        >
          {/* Left margin shaded area */}
          <div className="w-12 h-full bg-slate-200 border-r border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
            2.5 cm
          </div>

          {/* Centimeter ticks */}
          <div className="flex-1 flex justify-between px-3 text-slate-400 font-sans tracking-widest text-[9px]">
            <span>·</span>
            <span>1</span>
            <span>·</span>
            <span>2</span>
            <span>·</span>
            <span>3</span>
            <span>·</span>
            <span>4</span>
            <span>·</span>
            <span>5</span>
            <span>·</span>
            <span>6</span>
            <span>·</span>
            <span>7</span>
            <span>·</span>
            <span>8</span>
            <span>·</span>
            <span>9</span>
            <span>·</span>
            <span>10</span>
            <span>·</span>
            <span>11</span>
            <span>·</span>
            <span>12</span>
            <span>·</span>
            <span>13</span>
            <span>·</span>
            <span>14</span>
            <span>·</span>
            <span>15</span>
            <span>·</span>
            <span>16</span>
            <span>·</span>
            <span>17</span>
            <span>·</span>
            <span>18</span>
            <span>·</span>
          </div>

          {/* Right margin shaded area */}
          <div className="w-12 h-full bg-slate-200 border-l border-slate-300 flex items-center justify-center text-[8px] text-slate-400">
            2.5 cm
          </div>

          {/* Draggable Indent Markers (Visual Word Look) */}
          <div
            className="absolute left-12 top-0 bottom-0 flex flex-col justify-between -translate-x-1/2 pointer-events-none"
            title="Indentasi Kiri"
          >
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-t-[5px] border-t-slate-700" />
            <div className="w-2 h-1 bg-slate-700" />
          </div>
          <div
            className="absolute right-12 bottom-0 flex flex-col justify-end translate-x-1/2 pointer-events-none"
            title="Indentasi Kanan"
          >
            <div className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-slate-700" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. A4 PAPER WORKSPACE (REALISTIC WORD DESK BACKGROUND)                    */}
      {/* ========================================================================= */}
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
          {/* Subtle Page Margin Indicator for Word look */}
          <div className="absolute top-3 right-4 text-[10px] text-slate-400 font-mono select-none">
            Lembar Surat Resmi &bull; Tab untuk pindah cell &bull; Drag garis
            untuk atur lebar kolom
          </div>

          {/* Floating Table Move Handle (Word ✥ icon di luar tabel) */}
          {!readOnly && activeTableState && overlayPos && (
            <div
              style={{
                top: `${overlayPos.top}px`,
                left: `${overlayPos.left}px`,
              }}
              onMouseDown={handleMoveHandleMouseDown}
              className="absolute z-20 flex items-center justify-center w-6 h-6 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-md cursor-grab active:cursor-grabbing select-none border border-blue-400 transition-colors"
              title="Tahan & geser untuk memindahkan posisi tabel di kertas (Atau gunakan tombol Geser di toolbar)"
            >
              <Move className="w-3.5 h-3.5" />
            </div>
          )}

          {/* Scoped CSS for Word-like table formatting and smooth selection */}
          <style>{`
            .rich-editor-sheet {
              font-family: ${fontFamily}, Calibri, Tahoma, Arial, sans-serif !important;
              color: #000000 !important;
            }
            .rich-editor-sheet *:not([style*="font-family"]):not([face]) {
              font-family: inherit !important;
            }
            .rich-editor-sheet b,
            .rich-editor-sheet strong {
              font-weight: 700 !important;
              font-family: inherit !important;
            }
            .rich-editor-sheet i,
            .rich-editor-sheet em {
              font-style: italic !important;
              font-family: inherit !important;
            }
            .rich-editor-sheet u {
              text-decoration: underline !important;
              font-family: inherit !important;
            }
            .rich-editor-sheet s,
            .rich-editor-sheet strike {
              text-decoration: line-through !important;
              font-family: inherit !important;
            }
            .rich-editor-sheet,
            .rich-editor-sheet p,
            .rich-editor-sheet span,
            .rich-editor-sheet td,
            .rich-editor-sheet th,
            .rich-editor-sheet li,
            .rich-editor-sheet div,
            .rich-editor-sheet table {
              line-height: ${lineSpacing};
              color: #000000;
            }
            .rich-editor-sheet table {
              font-family: inherit !important;
            }
            .rich-editor-sheet table td,
            .rich-editor-sheet table th,
            .rich-editor-sheet table td strong,
            .rich-editor-sheet table td b,
            .rich-editor-sheet table td i,
            .rich-editor-sheet table td span {
              font-family: inherit !important;
            }
            .rich-editor-sheet .locked-letter-number {
              color: #000000 !important;
              font-family: inherit !important;
            }
            /* Pastikan seluruh teks & sel tanpa inline font-size memiliki ukuran seragam */
            .rich-editor-sheet p:not([style*="font-size"]),
            .rich-editor-sheet td:not([style*="font-size"]),
            .rich-editor-sheet th:not([style*="font-size"]),
            .rich-editor-sheet li:not([style*="font-size"]),
            .rich-editor-sheet div:not([style*="font-size"]) {
              font-size: ${fontSize || "11pt"};
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

            /* Smooth Word Table Styling */
            .rich-editor-sheet table {
              border-collapse: collapse;
              margin: 10px 0;
            }
            .rich-editor-sheet td,
            .rich-editor-sheet th {
              min-width: 24px;
              min-height: 24px;
              word-break: break-word;
              position: relative;
            }
            /* Visual feedback when editing cell without distorting text */
            .rich-editor-sheet td:focus,
            .rich-editor-sheet th:focus {
              outline: 1.5px solid #3b82f6 !important;
              outline-offset: -1px;
              background-color: rgba(239, 246, 255, 0.35);
            }
            /* Highlight khusus sel kolom yang dipilih (tanpa merembet ke kolom lain) */
            .rich-editor-sheet .table-cell-selected {
              background-color: #bfdbfe !important;
              color: #1e3a8a !important;
              outline: 2px solid #2563eb !important;
              outline-offset: -1px;
            }
          `}</style>

          {/* Content Editable Area */}
          <div
            ref={editorRef}
            contentEditable={!readOnly}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            onBlur={handleInput}
            onPaste={handlePaste}
            onMouseUp={handleEditorMouseUp}
            onKeyUp={() => {
              updateActiveTable();
              updateSelectionFormat();
            }}
            onMouseMove={handleEditorMouseMove}
            onMouseDown={handleEditorMouseDown}
            className={`rich-editor-sheet outline-none leading-relaxed max-w-none min-h-[900px] text-[11pt] focus:ring-0 ${
              readOnly
                ? "cursor-default select-text"
                : "cursor-text select-text"
            }`}
            style={{
              fontFamily: `${fontFamily}, Calibri, Tahoma, Arial, sans-serif`,
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MICROSOFT WORD STATUS BAR (#2b579a)                                    */}
      {/* ========================================================================= */}
      <div className="bg-[#2b579a] text-white px-4 py-1 text-xs flex items-center justify-between shadow-inner shrink-0 select-none">
        {/* Left: Page count, word count, language */}
        <div className="flex items-center gap-3 text-[11px] text-white/90">
          <span>Halaman 1 dari 1</span>
          <span>&bull;</span>
          <span>{wordCount} kata</span>
          <span>&bull;</span>
          <span>A4 Potret (2.5 cm)</span>
          <span>&bull;</span>
          <span>Indonesia</span>
        </div>

        {/* Right: View mode & Zoom Slider */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleZoomOut}
            className="p-1 hover:bg-white/15 rounded text-white transition"
            title="Zoom Out (-10%)"
          >
            <Minus className="w-3 h-3" />
          </button>

          <input
            type="range"
            min="50"
            max="180"
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

      {/* ========================================================================= */}
      {/* MODAL: PASTE TABEL EXCEL / SPREADSHEET                                    */}
      {/* ========================================================================= */}
      {showExcelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn select-text">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-600 rounded-lg text-white">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
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

            {/* Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Petunjuk Cepat */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-emerald-900 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-emerald-950">
                    Cara Penggunaan:
                  </p>
                  <ol className="list-decimal list-inside space-y-0.5 text-emerald-800">
                    <li>Buka file Microsoft Excel atau Google Sheets Anda.</li>
                    <li>
                      Blok sel tabel yang diinginkan, lalu tekan <b>Ctrl + C</b>{" "}
                      (Copy).
                    </li>
                    <li>
                      Klik tombol <b>"Ambil dari Clipboard"</b> di bawah atau
                      tekan <b>Ctrl + V</b> di dalam kotak teks.
                    </li>
                  </ol>
                  <p className="text-[11px] text-emerald-700 italic pt-1">
                    *Tip: Anda juga bisa langsung menekan <b>Ctrl + V</b>{" "}
                    langsung di lembar kerja Word tanpa membuka menu ini!
                  </p>
                </div>
              </div>

              {/* Action Toolbar for Paste Box */}
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700 flex items-center gap-1.5">
                  <span>Data Tabel Excel / TSV:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={readClipboardDirectly}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-medium flex items-center gap-1 transition shadow-xs"
                    title="Baca teks dari clipboard"
                  >
                    <Clipboard className="w-3.5 h-3.5" />
                    <span>Ambil dari Clipboard</span>
                  </button>
                  {excelPasteText && (
                    <button
                      type="button"
                      onClick={() => setExcelPasteText("")}
                      className="px-2 py-1 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded"
                    >
                      Bersihkan
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className="relative">
                <textarea
                  value={excelPasteText}
                  onChange={(e) => setExcelPasteText(e.target.value)}
                  placeholder="Paste (Ctrl+V) sel Excel Anda di sini..."
                  rows={5}
                  className="w-full font-mono text-[11px] p-3 border border-slate-300 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  autoFocus
                />
              </div>

              {/* Opsi Tabel */}
              <div className="flex flex-wrap items-center gap-5 pt-1 border-t border-slate-200">
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

                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={excelAutoAlign}
                    onChange={(e) => setExcelAutoAlign(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700">
                    Rata kanan otomatis untuk kolom angka/nilai
                  </span>
                </label>
              </div>

              {/* Live Preview */}
              {excelPasteText.trim() && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">
                      Pratinjau Tampilan Tabel:
                    </span>
                    <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                      {excelPasteText.trim().split(/\r\n|\r|\n/).length} baris
                      terdeteksi
                    </span>
                  </div>
                  <div
                    className="max-h-48 overflow-auto border border-slate-200 rounded-lg p-2.5 bg-white shadow-inner"
                    dangerouslySetInnerHTML={{
                      __html: excelPasteText.includes("<table")
                        ? formatExcelHtmlTable(excelPasteText)
                        : formatTsvToTable(
                            excelPasteText,
                            excelHeaderFirstRow,
                            excelAutoAlign,
                          ),
                    }}
                  />
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="px-5 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowExcelModal(false);
                  setExcelPasteText("");
                }}
                className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={insertExcelTableFromModal}
                disabled={!excelPasteText.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold flex items-center gap-2 shadow-sm transition"
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
