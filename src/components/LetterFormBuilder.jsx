import React, { useState, useEffect } from "react";
import {
  FileText,
  ArrowRight,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  Calculator,
  Building,
  User,
  Sparkles,
  Paperclip,
  UserCheck,
  Users,
  Image as ImageIcon,
  Sliders,
  Layout,
  RotateCcw,
  Maximize2,
  Minimize2,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Search,
  Check,
} from "lucide-react";
import RichEditor from "./RichEditor";
import LetterDocumentView from "./LetterDocumentView";
import AttachmentUploader from "./AttachmentUploader";
import SearchableSelect from "./SearchableSelect";
import {
  getCurrentUser,
  getUsers,
  getBranches,
  compileTemplateContent,
  generateLetterNumber,
  saveLetter,
  formatRupiah,
  formatDateId,
  lockLetterNumberInHtml,
  syncPerihalInHtml,
  getGlobalDefaultViewers,
} from "../services/storage";
import { notify } from "../utils/alert";

export default function LetterFormBuilder({
  template,
  initialLetter = null,
  onSaved,
  onCancel,
}) {
  const currentUser = getCurrentUser();
  const users = getUsers();
  const branches = getBranches();
  const currentBranch =
    branches.find(
      (b) => b.id === currentUser?.branchId || b.code === currentUser?.branchId,
    ) || {};
  const isPST =
    currentUser?.branchId === "PST" ||
    (currentUser?.branchName &&
      currentUser.branchName.toLowerCase().includes("pusat"));
  const isMandiri =
    template?.id === "custom_blank" ||
    template?.code === "MANDIRI" ||
    template?.isManualNumber ||
    template?.isCustom;

  const [activeTab, setActiveTab] = useState(() =>
    initialLetter ? "preview" : "form",
  );
  const [showAttachmentManager, setShowAttachmentManager] = useState(false);
  const [fieldValues, setFieldValues] = useState(
    () => initialLetter?.fieldValues || {},
  );
  const [letterContent, setLetterContent] = useState(() => {
    if (initialLetter?.content) {
      if (
        isMandiri &&
        (initialLetter.content.includes("{{perihal}}") ||
          initialLetter.content.includes(
            "Sehubungan dengan kebutuhan operasional",
          ) ||
          initialLetter.content.includes("[Tulis uraian"))
      ) {
        return "<p><br></p>";
      }
      return initialLetter.content;
    }
    return isMandiri ? "<p><br></p>" : "";
  });
  const [letterNumber, setLetterNumber] = useState(() => {
    if (initialLetter?.letterNumber) return initialLetter.letterNumber;
    return generateLetterNumber(template, currentUser?.branchId) || "";
  });
  const [costItems, setCostItems] = useState(
    () =>
      initialLetter?.fieldValues?.rincian_biaya || [
        { item: "Uang Harian / Uang Makan", amount: 300000 },
        { item: "Transportasi PP", amount: 500000 },
      ],
  );
  const [attachments, setAttachments] = useState(
    () =>
      initialLetter?.attachments ||
      initialLetter?.fieldValues?.attachments ||
      [],
  );

  // State Tata Letak & Ukuran Gambar Lampiran (Diatur di Tab Editor)
  const [imageLayout, setImageLayout] = useState(() => {
    return (
      initialLetter?.imageLayout ||
      initialLetter?.fieldValues?.imageLayout || {
        columns: 2,
        maxHeight: 280,
      }
    );
  });

  // State Layar Penuh (Word Fullscreen Mode)
  const [isWordFullscreen, setIsWordFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isWordFullscreen) {
        setIsWordFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWordFullscreen]);

  // State kustomisasi Mengetahui (Fleksibel & opsional per surat)
  const [includeKnownBy, setIncludeKnownBy] = useState(() => {
    if (initialLetter?.includeKnownBy !== undefined)
      return Boolean(initialLetter.includeKnownBy);
    if (initialLetter?.fieldValues?.includeKnownBy !== undefined)
      return Boolean(initialLetter.fieldValues.includeKnownBy);
    return !isPST; // Default: Cabang wajib/aktif, Pusat (PST) opsional/default false
  });

  // Cari rekan manager di cabang yang sama dari database
  const defaultBranchManager = React.useMemo(() => {
    if (!currentUser || isPST) return null;
    const bId = currentUser.branchId;
    const cName = (currentUser.name || "").trim().toLowerCase();
    const branchUsers = users.filter((u) => {
      if (!u.name || u.name.trim().toLowerCase() === cName) return false;
      return u.branchId === bId;
    });

    const isUserOM =
      /operation\s*manager|\bOM\b/i.test(currentUser.position || "") ||
      currentUser.kodeJabatan === "J08";
    if (isUserOM) {
      // Jika pemohon OM, pihak mengetahui adalah SMM cabang tsb
      const smm = branchUsers.find(
        (u) =>
          u.kodeJabatan === "J07" ||
          /sales\s*marketing|\bSMM\b/i.test(u.position || ""),
      );
      if (smm) return smm;
    } else {
      // Jika pemohon SMM atau staff, pihak mengetahui adalah OM cabang tsb
      const om = branchUsers.find(
        (u) =>
          u.kodeJabatan === "J08" ||
          /operation\s*manager|\bOM\b/i.test(u.position || ""),
      );
      if (om) return om;
    }

    // Fallback: manager lain di cabang tersebut
    return (
      branchUsers.find(
        (u) =>
          (u.position || "").toLowerCase().includes("manager") ||
          ["J05", "J07", "J08"].includes(u.kodeJabatan),
      ) || null
    );
  }, [currentUser, users, isPST]);

  const [knownByName, setKnownByName] = useState(() => {
    if (initialLetter?.knownByName || initialLetter?.fieldValues?.knownByName) {
      return (
        initialLetter.knownByName || initialLetter.fieldValues?.knownByName
      );
    }
    return defaultBranchManager?.name || "";
  });

  const [knownByPosition, setKnownByPosition] = useState(() => {
    if (
      initialLetter?.knownByPosition ||
      initialLetter?.fieldValues?.knownByPosition
    ) {
      return (
        initialLetter.knownByPosition ||
        initialLetter.fieldValues?.knownByPosition
      );
    }
    return (
      defaultBranchManager?.position ||
      (isPST ? "Manajer Terkait" : "Manager Cabang")
    );
  });

  // Sinkronkan otomatis jika daftar user database baru saja termuat
  useEffect(() => {
    if (!initialLetter && defaultBranchManager && !knownByName) {
      setKnownByName(defaultBranchManager.name);
      setKnownByPosition(defaultBranchManager.position || "Manager Cabang");
    }
  }, [defaultBranchManager, initialLetter, knownByName]);

  // State Kustomisasi Jalur & Pejabat Persetujuan (Terutama Fleksibel untuk Pusat / User Tertentu)
  const [customApprovalSteps, setCustomApprovalSteps] = useState(() => {
    if (
      initialLetter?.approvalHistory &&
      initialLetter.approvalHistory.length > 0
    ) {
      return initialLetter.approvalHistory;
    }
    return (
      template?.approvalSteps || [{ step: 1, approverRole: "Kepala Cabang" }]
    ).map((s) => {
      const isRsmStep =
        s.kodeJabatan === "J03" ||
        (s.approverRole &&
          (s.approverRole.toLowerCase().includes("rsm") ||
            s.approverRole.toLowerCase().includes("regional sales manager")));

      // Jika step adalah RSM dan cabang punya mapping RSM, otomatis pasangkan RSM cabang tsb
      const assignedUserId =
        s.specificUserId ||
        (isRsmStep && currentBranch?.rsmId ? currentBranch.rsmId : null);
      const assignedUserName =
        s.specificUserName ||
        (isRsmStep && currentBranch?.rsmName ? currentBranch.rsmName : null);
      const approverName =
        s.approverName ||
        (isRsmStep && currentBranch?.rsmName ? currentBranch.rsmName : null);

      return {
        step: s.step,
        approverRole: s.approverRole || s.title,
        kodeJabatan: s.kodeJabatan || null,
        specificUserId: assignedUserId,
        specificUserName: assignedUserName,
        assignmentType: s.assignmentType || (assignedUserId ? "user" : "role"),
        approverName: approverName,
        status: s.status || "pending",
        notes: s.notes || "",
        date: s.date || null,
      };
    });
  });

  // State Siapa Saja yang Boleh Melihat Surat (Tembusan / Allowed Viewers)
  const [allowedViewers, setAllowedViewers] = useState(() => {
    if (
      initialLetter?.allowedViewers &&
      Array.isArray(initialLetter.allowedViewers)
    ) {
      return initialLetter.allowedViewers;
    }
    // Gabungkan default global (untuk SEMUA surat) + default khusus template (jika ada)
    const globals = getGlobalDefaultViewers() || [];
    const tplDefaults = template?.defaultViewers || [];
    const combined = [...globals];
    tplDefaults.forEach((tv) => {
      const tvId = String(tv.userId || tv.id || tv);
      if (!combined.some((g) => String(g.userId || g.id || g) === tvId)) {
        combined.push(tv);
      }
    });
    return combined;
  });

  // Set ID user yang masuk auto-checklist (global default atau template default)
  const autoCheckedUserIds = React.useMemo(() => {
    const globals = getGlobalDefaultViewers() || [];
    const tplDefaults = template?.defaultViewers || [];
    const ids = new Set();
    globals.forEach((g) => ids.add(String(g.userId || g.id || g)));
    tplDefaults.forEach((t) => ids.add(String(t.userId || t.id || t)));
    return ids;
  }, [template]);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerSearchQuery, setViewerSearchQuery] = useState("");
  const [viewerBranchFilter, setViewerBranchFilter] = useState("ALL");

  const templateId = template?.id;
  const initialLetterId = initialLetter?.id;
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (initialLetter) {
      setFieldValues(initialLetter.fieldValues || {});
      setAttachments(
        initialLetter.attachments ||
          initialLetter.fieldValues?.attachments ||
          [],
      );
      if (initialLetter.includeKnownBy !== undefined) {
        setIncludeKnownBy(Boolean(initialLetter.includeKnownBy));
      } else if (initialLetter.fieldValues?.includeKnownBy !== undefined) {
        setIncludeKnownBy(Boolean(initialLetter.fieldValues.includeKnownBy));
      }
      if (initialLetter.knownByName || initialLetter.fieldValues?.knownByName) {
        setKnownByName(
          initialLetter.knownByName || initialLetter.fieldValues?.knownByName,
        );
      }
      if (
        initialLetter.knownByPosition ||
        initialLetter.fieldValues?.knownByPosition
      ) {
        setKnownByPosition(
          initialLetter.knownByPosition ||
            initialLetter.fieldValues?.knownByPosition,
        );
      }

      let num = initialLetter.letterNumber || "";
      if (!num) {
        num = generateLetterNumber(template, currentUser?.branchId);
      } else if (!isMandiri) {
        // Jika draft lama menyimpan nomor surat panjang / rusak, reset ke pola baku baru
        if (
          num.includes("TGR/SP/VII") ||
          (typeof num === "string" && num.split("/").length > 5)
        ) {
          num = generateLetterNumber(template, currentUser?.branchId);
        }
      }
      let content = initialLetter.content || "";
      if (isMandiri) {
        content = content.replace(
          /<p[^>]*style="[^"]*text-align:\s*right[^"]*"[^>]*>[\s\S]*?<\/p>\s*(?=<table)/i,
          "",
        );
      }
      setLetterNumber(num);
      setLetterContent(lockLetterNumberInHtml(content, num));
      if (initialLetter.fieldValues?.rincian_biaya) {
        setCostItems(initialLetter.fieldValues.rincian_biaya);
      }
      if (initialLetter.imageLayout || initialLetter.fieldValues?.imageLayout) {
        setImageLayout(
          initialLetter.imageLayout || initialLetter.fieldValues?.imageLayout,
        );
      }
      if (
        initialLetter.allowedViewers ||
        initialLetter.fieldValues?.allowedViewers
      ) {
        setAllowedViewers(
          initialLetter.allowedViewers ||
            initialLetter.fieldValues?.allowedViewers ||
            [],
        );
      }
      setActiveTab("preview");
    } else {
      // Prefill defaults based on logged-in user
      const defaults = {
        nama_pemohon: currentUser?.name || "",
        jabatan: currentUser?.position || "",
        nama_cabang: currentUser?.branchName || "",
      };
      setFieldValues(defaults);
      const autoNum = generateLetterNumber(template, currentUser?.branchId);
      setLetterNumber(autoNum);
    }
  }, [templateId, initialLetterId, currentUserId]);

  const handleFieldChange = (name, value) => {
    setFieldValues((prev) => ({ ...prev, [name]: value }));
    if ((name === "perihal" || name === "f_perihal") && letterContent) {
      setLetterContent((prev) => (prev ? syncPerihalInHtml(prev, value) : ""));
    }
  };

  // Cost items handlers for PERDIN
  const addCostRow = () => {
    setCostItems([...costItems, { item: "", amount: 0 }]);
  };

  const updateCostRow = (index, field, value) => {
    const updated = [...costItems];
    updated[index][field] = field === "amount" ? Number(value) || 0 : value;
    setCostItems(updated);
  };

  const removeCostRow = (index) => {
    setCostItems(costItems.filter((_, i) => i !== index));
  };

  const totalCost = costItems.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0,
  );

  const decodeHtmlEntities = (str) => {
    if (!str) return "";
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
  };

  // Ambil teks Perihal aktual dari isi surat (agar header judul, preview, dan database selalu sama)
  const extractPerihal = (content) => {
    if (!content) return "";
    const match =
      content.match(
        /Perihal\s*<\/strong>\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      ) ||
      content.match(
        /Perihal\s*<\/td>\s*<td[^>]*>\s*:\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/i,
      ) ||
      content.match(/Perihal\s*:\s*([^<\n\r]+)/i);
    if (match && match[1]) {
      const clean = match[1].replace(/<[^>]*>/g, "").trim();
      if (clean && !clean.includes("{{") && clean !== "-")
        return decodeHtmlEntities(clean);
    }
    return "";
  };

  const perihalFromFields =
    fieldValues["perihal"] || fieldValues["f_perihal"] || "";
  const effectiveTitle = decodeHtmlEntities(
    (perihalFromFields && perihalFromFields.trim()) ||
      extractPerihal(letterContent) ||
      initialLetter?.title?.replace(/\s*-\s*[^-]+$/, "").trim() ||
      template.name,
  );

  // Validasi kolom wajib (termasuk Perihal Surat tidak boleh lanjut jika kosong)
  const validateRequiredFields = () => {
    const perihalVal = (
      fieldValues["perihal"] ||
      fieldValues["f_perihal"] ||
      extractPerihal(letterContent) ||
      ""
    ).trim();

    if (
      isMandiri ||
      template.fields?.some((f) => f.name === "perihal" || f.id === "f_perihal")
    ) {
      if (!perihalVal) {
        notify.warning(
          "Perihal Surat Wajib Diisi",
          "Silakan isi Perihal Surat terlebih dahulu sebelum melanjutkan ke pratinjau atau mengirim surat.",
        );
        const el =
          document.querySelector('input[name="perihal"]') ||
          document.querySelector('input[placeholder*="Permohonan"]');
        if (el) {
          el.focus();
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return false;
      }
    }

    const missing = (template.fields || []).filter((f) => {
      const n = (f.name || "").toLowerCase();
      const l = (f.label || "").toLowerCase();
      if (
        isMandiri &&
        (n === "tujuan" ||
          l.includes("tujuan") ||
          n === "ringkasan" ||
          l.includes("pokok isi"))
      ) {
        return false;
      }
      if (n === "keperluan" || l === "keperluan" || n === "nama_pemohon")
        return false;
      return f.required && !String(fieldValues[f.name] || "").trim();
    });

    if (missing.length > 0) {
      const cleanName = missing[0].label.replace(/\*+$/, "").trim();
      notify.warning(
        "Lengkapi Isian Wajib",
        `Kolom "${cleanName}" wajib diisi sebelum melanjutkan.`,
      );
      const el = document.querySelector(`[name="${missing[0].name}"]`);
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    // Validasi Jalur Persetujuan Pejabat: Setiap tingkat WAJIB memilih Pejabat Penyetuju
    if (!customApprovalSteps || customApprovalSteps.length === 0) {
      notify.warning(
        "Pejabat Penyetuju Wajib Diisi",
        "Surat harus memiliki minimal 1 pejabat penyetuju pada Jalur Persetujuan Pejabat.",
      );
      return false;
    }

    const unassignedIndex = customApprovalSteps.findIndex(
      (s) => !s.specificUserId && !s.approverName,
    );
    if (unassignedIndex >= 0) {
      notify.warning(
        "Pejabat Penyetuju Wajib Dipilih",
        `Silakan pilih Pejabat Penyetuju untuk Tingkat #${unassignedIndex + 1} pada Jalur Persetujuan Pejabat (Hal. 2) terlebih dahulu.`,
      );
      const approvalSection = document.getElementById("approval-steps-section");
      if (approvalSection) {
        approvalSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return false;
    }

    return true;
  };

  // Step transition: compile template into preview/editor content only if content is empty
  const handleProceedToPreview = () => {
    if (!validateRequiredFields()) return;

    const currentNumber = isMandiri
      ? letterNumber || generateLetterNumber(template, currentUser.branchId)
      : initialLetter?.letterNumber ||
        letterNumber ||
        generateLetterNumber(template, currentUser.branchId);
    if (!letterNumber) setLetterNumber(currentNumber);

    if (isMandiri) {
      const isBoilerplate =
        !letterContent ||
        letterContent.includes("{{perihal}}") ||
        letterContent.includes("Di Tempat") ||
        letterContent.includes("Sehubungan dengan kebutuhan operasional") ||
        letterContent.includes("[Tulis uraian");
      if (isBoilerplate) {
        setLetterContent("<p><br></p>");
      }
      setActiveTab("preview");
      return;
    }

    const perihal = (fieldValues.perihal || fieldValues.f_perihal || "").trim();

    if (!letterContent) {
      const valuesWithCosts = {
        ...fieldValues,
        rincian_biaya: costItems,
        total_biaya: totalCost,
      };

      const compiled = compileTemplateContent(template, valuesWithCosts, {
        nomor_surat: currentNumber || "",
        nama_cabang: currentUser.branchName,
        tanggal_surat: formatDateId(new Date()),
      });

      let finalHtml = lockLetterNumberInHtml(compiled, currentNumber);
      if (perihal) {
        finalHtml = syncPerihalInHtml(finalHtml, perihal);
      }
      setLetterContent(finalHtml);
    } else {
      setLetterContent((prev) => {
        let finalHtml = lockLetterNumberInHtml(prev, currentNumber);
        if (perihal) {
          finalHtml = syncPerihalInHtml(finalHtml, perihal);
        }
        return finalHtml;
      });
    }
    setActiveTab("preview");
  };

  const handleOpenWordEditor = () => {
    if (activeTab === "form" && !validateRequiredFields()) return;

    const currentNumber = isMandiri
      ? letterNumber || generateLetterNumber(template, currentUser.branchId)
      : initialLetter?.letterNumber ||
        letterNumber ||
        generateLetterNumber(template, currentUser.branchId);
    if (!letterNumber) setLetterNumber(currentNumber);

    if (isMandiri) {
      const isBoilerplate =
        !letterContent ||
        letterContent.includes("{{perihal}}") ||
        letterContent.includes("Di Tempat") ||
        letterContent.includes("Sehubungan dengan kebutuhan operasional") ||
        letterContent.includes("[Tulis uraian");
      if (isBoilerplate) {
        setLetterContent("<p><br></p>");
      }
      setIsWordFullscreen(true);
      return;
    }

    const perihal = (fieldValues.perihal || fieldValues.f_perihal || "").trim();

    if (!letterContent) {
      const valuesWithCosts = {
        ...fieldValues,
        rincian_biaya: costItems,
        total_biaya: totalCost,
      };

      const compiled = compileTemplateContent(template, valuesWithCosts, {
        nomor_surat: currentNumber || "",
        nama_cabang: currentUser.branchName,
        tanggal_surat: formatDateId(new Date()),
      });

      let finalHtml = lockLetterNumberInHtml(compiled, currentNumber);
      if (perihal) {
        finalHtml = syncPerihalInHtml(finalHtml, perihal);
      }
      setLetterContent(finalHtml);
    } else {
      setLetterContent((prev) => {
        let finalHtml = lockLetterNumberInHtml(prev, currentNumber);
        if (perihal) {
          finalHtml = syncPerihalInHtml(finalHtml, perihal);
        }
        return finalHtml;
      });
    }
    setIsWordFullscreen(true);
  };

  const handleSaveDraft = () => {
    const persistentAttachments = attachments.map((a) => {
      const url =
        a.url ||
        (typeof a.dataUrl === "string" &&
        (a.dataUrl.startsWith("/lampiran") || a.dataUrl.startsWith("http"))
          ? a.dataUrl
          : "");
      return {
        id: a.id,
        name: a.name,
        size: a.size,
        extension: a.extension,
        category: a.category,
        url,
        dataUrl: a.dataUrl || url || "",
        uploadedAt: a.uploadedAt,
      };
    });

    const payload = {
      id: initialLetter?.id,
      templateId: template.id,
      letterNumber: letterNumber || "",
      title: effectiveTitle,
      includeKnownBy,
      knownByName: includeKnownBy ? knownByName : "",
      knownByPosition: includeKnownBy ? knownByPosition : "",
      allowedViewers,
      imageLayout,
      approvalHistory: customApprovalSteps,
      fieldValues: {
        ...fieldValues,
        rincian_biaya: costItems,
        total_biaya: totalCost,
        attachments: persistentAttachments,
        includeKnownBy,
        knownByName: includeKnownBy ? knownByName : "",
        knownByPosition: includeKnownBy ? knownByPosition : "",
        allowedViewers,
        imageLayout,
      },
      attachments: persistentAttachments,
      content: isMandiri
        ? letterContent &&
          !letterContent.includes("Sehubungan dengan kebutuhan operasional")
          ? letterContent
          : "<p><br></p>"
        : lockLetterNumberInHtml(
            syncPerihalInHtml(
              letterContent ||
                compileTemplateContent(template, {
                  ...fieldValues,
                  rincian_biaya: costItems,
                }),
              fieldValues.perihal || fieldValues.f_perihal,
            ),
            letterNumber,
          ),
    };
    const saved = saveLetter(payload, false);
    const isEditMode = !!initialLetter;
    notify.success(
      isEditMode ? "Perubahan Disimpan" : "Draft Disimpan",
      isEditMode
        ? "Perubahan isi surat berhasil disimpan."
        : "Draft surat berhasil disimpan dan dapat dilanjutkan sewaktu-waktu.",
    );
    if (onSaved) onSaved(saved);
  };

  const handleSubmit = async () => {
    if (!validateRequiredFields()) return;

    const isPending = initialLetter?.status === "pending";
    const confirmed = await notify.confirm({
      title: isPending ? "Perbarui Surat Ajuan?" : "Kirim Surat Ajuan?",
      text: isPending
        ? "Perubahan surat akan disimpan dan tetap melanjutkan alur persetujuan."
        : "Surat akan dikirimkan ke alur persetujuan pejabat dan tidak dapat diedit setelah disetujui penuh.",
      confirmText: isPending ? "Ya, Perbarui Surat" : "Ya, Ajukan Surat",
      icon: "question",
      confirmColor: "#4f46e5",
    });

    if (!confirmed) return;

    const persistentAttachments = attachments.map((a) => {
      const url =
        a.url ||
        (typeof a.dataUrl === "string" &&
        (a.dataUrl.startsWith("/lampiran") || a.dataUrl.startsWith("http"))
          ? a.dataUrl
          : "");
      return {
        id: a.id,
        name: a.name,
        size: a.size,
        extension: a.extension,
        category: a.category,
        url,
        dataUrl: a.dataUrl || url || "",
        uploadedAt: a.uploadedAt,
      };
    });

    const payload = {
      id: initialLetter?.id,
      templateId: template.id,
      letterNumber: letterNumber || "",
      title: effectiveTitle,
      includeKnownBy,
      knownByName: includeKnownBy ? knownByName : "",
      knownByPosition: includeKnownBy ? knownByPosition : "",
      allowedViewers,
      imageLayout,
      approvalHistory: customApprovalSteps,
      fieldValues: {
        ...fieldValues,
        rincian_biaya: costItems,
        total_biaya: totalCost,
        attachments: persistentAttachments,
        includeKnownBy,
        knownByName: includeKnownBy ? knownByName : "",
        knownByPosition: includeKnownBy ? knownByPosition : "",
        allowedViewers,
        imageLayout,
      },
      attachments: persistentAttachments,
      content: isMandiri
        ? letterContent &&
          !letterContent.includes("Sehubungan dengan kebutuhan operasional")
          ? letterContent
          : "<p><br></p>"
        : lockLetterNumberInHtml(
            syncPerihalInHtml(
              letterContent ||
                compileTemplateContent(template, {
                  ...fieldValues,
                  rincian_biaya: costItems,
                }),
              fieldValues.perihal || fieldValues.f_perihal,
            ),
            letterNumber,
          ),
    };
    const saved = saveLetter(payload, true);
    notify.success(
      isPending ? "Surat Diperbarui!" : "Surat Diajukan!",
      `Surat berhasil disimpan dengan nomor: ${saved.letterNumber || "(Tanpa Nomor)"}`,
    );
    if (onSaved) onSaved(saved);
  };

  // Generate available variables for editor insertion
  const availableVariables = [
    { key: "nomor_surat", label: "Nomor Surat" },
    { key: "nama_cabang", label: "Nama Cabang" },
    { key: "tanggal_surat", label: "Tanggal Surat" },
    ...(template.fields || []).map((f) => ({ key: f.name, label: f.label })),
  ];

  const previewLetterObject = {
    ...(initialLetter || {}),
    id: initialLetter?.id || "ltr-draft",
    letterNumber:
      initialLetter?.letterNumber || letterNumber || "DRAFT/NO-NUMBER",
    templateName: template.name,
    title: effectiveTitle,
    userName: fieldValues.nama_pemohon || currentUser.name,
    userPosition: fieldValues.jabatan || currentUser.position || "Pemohon",
    branchName: currentUser.branchName,
    branchId: currentUser.branchId,
    status: initialLetter?.status || "draft",
    createdAt: initialLetter?.createdAt || new Date().toISOString(),
    attachments,
    imageLayout,
    includeKnownBy,
    knownByName: includeKnownBy ? knownByName : "",
    knownByPosition: includeKnownBy ? knownByPosition : "",
    allowedViewers,
    content: isMandiri
      ? letterContent &&
        !letterContent.includes("Sehubungan dengan kebutuhan operasional")
        ? letterContent
        : "<p><br></p>"
      : lockLetterNumberInHtml(
          syncPerihalInHtml(
            letterContent ||
              compileTemplateContent(template, {
                ...fieldValues,
                rincian_biaya: costItems,
              }),
            fieldValues.perihal || fieldValues.f_perihal,
          ),
          initialLetter?.letterNumber || letterNumber || "DRAFT/NO-NUMBER",
        ),
    approvalHistory: customApprovalSteps,
  };

  return (
    <div className="space-y-2">
      {/* Sticky Header Wrapper: Wizard Header & Review Action Bar */}
      <div className="sticky top-20 z-30 space-y-1.5 bg-[#dce3ec]/95 backdrop-blur-md pb-1 pt-0.5">
        {/* Top Wizard Steps Header - Gradient Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-xl px-3 py-2 sm:px-3.5 sm:py-2 text-white shadow-md border border-blue-900/40 flex flex-wrap items-center justify-between gap-2 transition-all">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-[10px] text-blue-200/90 font-medium">
                Penyusunan Surat Ajuan
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white leading-tight drop-shadow-xs">
              {effectiveTitle}
            </h2>
          </div>

          {/* Step Indicator Tabs (2 Langkah: Form Isian & Pratinjau Resmi) */}
          <div className="flex items-center gap-1 bg-black/25 backdrop-blur-md border border-white/15 p-0.5 rounded-lg text-xs font-semibold shadow-inner">
            {/* TAB 1: FORM ISIAN */}
            <button
              type="button"
              onClick={() => setActiveTab("form")}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                activeTab === "form"
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-950/40 ring-2 ring-emerald-300 font-bold"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition ${
                  activeTab === "form"
                    ? "bg-white text-emerald-700 shadow-xs"
                    : "bg-white/20 text-white"
                }`}
              >
                1
              </span>
              <span className="whitespace-nowrap">Form Isian</span>
            </button>

            {/* TAB 2: PRATINJAU & REVIEW RESMI */}
            <button
              type="button"
              onClick={handleProceedToPreview}
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                activeTab === "preview"
                  ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-md shadow-purple-950/40 ring-2 ring-purple-300 font-bold"
                  : "text-blue-100 hover:text-white hover:bg-white/10"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 transition ${
                  activeTab === "preview"
                    ? "bg-white text-purple-700 shadow-xs"
                    : "bg-white/20 text-white"
                }`}
              >
                2
              </span>
              <span className="whitespace-nowrap font-bold">
                Pratinjau &amp; Review Surat
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-500/90 hover:bg-rose-600 active:bg-rose-700 border border-rose-400/40 rounded-lg transition shadow-xs"
              >
                Batal
              </button>
            )}

            <button
              type="button"
              id="btn-save-draft"
              onClick={handleSaveDraft}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-white/15 hover:bg-white/25 active:bg-white/30 border border-white/20 rounded-lg transition flex items-center gap-1.5 shadow-xs backdrop-blur-xs"
              title="Simpan dokumen sebagai draf sementara"
            >
              <Save className="w-3.5 h-3.5 text-white" />
              <span>{initialLetter ? "Simpan Perubahan" : "Simpan Draft"}</span>
            </button>

            <button
              type="button"
              id="btn-submit-letter"
              onClick={handleSubmit}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 rounded-lg transition flex items-center gap-1.5 shadow-md shadow-emerald-950/30 border border-emerald-400/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {initialLetter?.status === "pending"
                  ? "Perbarui Surat"
                  : "Kirim Ajuan"}
              </span>
            </button>
          </div>
        </div>

        {/* Top Control Bar di Halaman Review (Sticky bersama header saat preview) */}
        {activeTab === "preview" && (
          <div className="bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3 shadow-md flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                <span className="p-1 rounded-md bg-purple-100 text-purple-700">
                  <Eye className="w-4 h-4" />
                </span>
                <span>Pratinjau Dokumen Resmi</span>
              </span>
              <span className="text-xs text-slate-300">&bull;</span>
              <span className="text-xs text-slate-600 hidden sm:inline font-medium">
                Periksa tampilan surat atau klik tombol edit di sebelah kanan
                untuk mengubah isi teks.
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Tombol Edit Isi Surat (Word) */}
              <button
                type="button"
                onClick={handleOpenWordEditor}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition shadow-xs"
                title="Buka Editor Word Layar Penuh untuk mengubah isi surat"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Edit Isi Surat (Word)</span>
              </button>

              {/* Tombol Kelola Lampiran & Foto */}
              <button
                type="button"
                id="btn-manage-attachments"
                onClick={() => setShowAttachmentManager(true)}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition border bg-white border-slate-300 hover:bg-slate-50 text-slate-800 shadow-2xs hover:border-indigo-400"
                title="Buka popup modal untuk mengunggah dan mengatur foto lampiran"
              >
                <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                <span>Kelola Lampiran &amp; Foto ({attachments.length})</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* STEP 1: FORM ISIAN */}
      {activeTab === "form" && (
        <div className="bg-white border border-slate-300/80 rounded-xl p-3 sm:p-4 shadow-lg shadow-slate-900/5 space-y-3">
          {/* Nomor Surat Khusus Surat Mandiri jika diperlukan */}
          {isMandiri && (
            <div className="bg-slate-50/90 p-2 rounded-lg border border-slate-300/80 flex items-center gap-2 text-xs">
              <span className="text-[11px] font-extrabold text-slate-800 shrink-0">
                No. Surat:
              </span>
              <input
                type="text"
                value={letterNumber}
                onChange={(e) => {
                  const val = e.target.value;
                  setLetterNumber(val);
                  if (letterContent) {
                    setLetterContent((prev) =>
                      lockLetterNumberInHtml(prev, val),
                    );
                  }
                }}
                placeholder="Nomor surat otomatis (dapat diubah)..."
                className="flex-1 font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-300 text-xs shadow-2xs"
              />
            </div>
          )}

          {/* Dynamic Form Fields */}
          {template.fields?.filter((f) => {
            const n = (f.name || "").toLowerCase();
            const l = (f.label || "").toLowerCase();
            if (
              isMandiri &&
              (n === "tujuan" ||
                l.includes("tujuan") ||
                n === "ringkasan" ||
                l.includes("pokok isi"))
            ) {
              return false;
            }
            return (
              n !== "keperluan" &&
              l !== "keperluan" &&
              n !== "nama_pemohon" &&
              !l.includes("nama pemohon")
            );
          }).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {template.fields
                ?.filter((f) => {
                  const n = (f.name || "").toLowerCase();
                  const l = (f.label || "").toLowerCase();
                  if (
                    isMandiri &&
                    (n === "tujuan" ||
                      l.includes("tujuan") ||
                      n === "ringkasan" ||
                      l.includes("pokok isi"))
                  ) {
                    return false;
                  }
                  return (
                    n !== "keperluan" &&
                    l !== "keperluan" &&
                    n !== "nama_pemohon" &&
                    !l.includes("nama pemohon")
                  );
                })
                .map((field) => {
                  const cleanLabel = (field.label || "")
                    .replace(/\*+$/, "")
                    .trim();
                  if (field.type === "table_costs") {
                    return (
                      <div
                        key={field.id}
                        className="md:col-span-2 space-y-1.5 pt-0.5"
                      >
                        <div className="flex justify-between items-center">
                          <label className="block text-xs font-extrabold text-slate-900">
                            {cleanLabel}{" "}
                            {field.required && (
                              <span className="text-rose-600 font-bold">*</span>
                            )}
                          </label>
                          <button
                            type="button"
                            onClick={addCostRow}
                            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 transition shadow-2xs"
                          >
                            <Plus className="w-3 h-3" />
                            Tambah Baris
                          </button>
                        </div>

                        <div className="border border-slate-300 rounded-lg overflow-hidden shadow-2xs bg-white">
                          <table className="w-full text-xs">
                            <thead className="bg-slate-100 border-b border-slate-300 text-slate-800">
                              <tr>
                                <th className="py-1.5 px-2.5 text-left w-10 font-bold text-xs">
                                  No
                                </th>
                                <th className="py-1.5 px-2.5 text-left font-bold text-xs">
                                  Uraian Kebutuhan
                                </th>
                                <th className="py-1.5 px-2.5 text-right w-40 font-bold text-xs">
                                  Estimasi (Rp)
                                </th>
                                <th className="py-1.5 px-2.5 text-center w-10 font-bold text-xs">
                                  Aksi
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {costItems.map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80">
                                  <td className="py-1.5 px-2.5 text-center text-slate-500 font-mono text-xs">
                                    {idx + 1}
                                  </td>
                                  <td className="py-1 px-2.5">
                                    <input
                                      type="text"
                                      value={item.item}
                                      onChange={(e) =>
                                        updateCostRow(
                                          idx,
                                          "item",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="Uraian pengeluaran"
                                      className="w-full bg-transparent border-0 border-b border-slate-200 focus:border-emerald-600 focus:ring-0 p-0.5 text-slate-900 font-medium text-xs"
                                    />
                                  </td>
                                  <td className="py-1 px-2.5">
                                    <input
                                      type="number"
                                      value={item.amount || ""}
                                      onChange={(e) =>
                                        updateCostRow(
                                          idx,
                                          "amount",
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0"
                                      className="w-full text-right bg-transparent border-0 border-b border-slate-200 focus:border-emerald-600 focus:ring-0 p-0.5 text-slate-900 font-mono font-bold text-xs"
                                    />
                                  </td>
                                  <td className="py-1 px-2.5 text-center">
                                    <button
                                      type="button"
                                      onClick={() => removeCostRow(idx)}
                                      className="text-slate-400 hover:text-rose-600 p-0.5 rounded-md hover:bg-rose-50 transition"
                                      title="Hapus baris"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot className="bg-slate-50 font-bold border-t border-slate-300">
                              <tr>
                                <td
                                  colSpan="2"
                                  className="py-1.5 px-2.5 text-right text-slate-800 text-xs uppercase tracking-wider"
                                >
                                  TOTAL BIAYA:
                                </td>
                                <td className="py-1.5 px-2.5 text-right text-emerald-700 font-mono text-xs font-extrabold">
                                  Rp {formatRupiah(totalCost)}
                                </td>
                                <td></td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    );
                  }

                  const isFullWidth =
                    field.type === "textarea" ||
                    (isMandiri &&
                      (field.name === "perihal" || field.id === "f_perihal"));

                  return (
                    <div
                      key={field.id}
                      className={isFullWidth ? "md:col-span-2" : ""}
                    >
                      <label className="block text-[11px] font-extrabold text-slate-900 mb-1">
                        {cleanLabel}{" "}
                        {field.required && (
                          <span className="text-rose-600 font-bold">*</span>
                        )}
                      </label>

                      {field.type === "textarea" ? (
                        <textarea
                          name={field.name}
                          rows={2}
                          value={fieldValues[field.name] || ""}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          placeholder={field.placeholder || ""}
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition leading-relaxed"
                        />
                      ) : field.type === "select" ? (
                        <SearchableSelect
                          size="sm"
                          value={fieldValues[field.name] || ""}
                          onChange={(val) => handleFieldChange(field.name, val)}
                          placeholder={`-- Pilih ${cleanLabel} --`}
                          options={(field.options || []).map((opt) => ({
                            value: opt,
                            label: opt,
                          }))}
                          isClearable
                        />
                      ) : (
                        <input
                          id={
                            field.name === "perihal" || field.id === "f_perihal"
                              ? "field-perihal-input"
                              : undefined
                          }
                          name={field.name}
                          type={
                            field.type === "number"
                              ? "number"
                              : field.type === "date"
                                ? "date"
                                : "text"
                          }
                          value={fieldValues[field.name] || ""}
                          onChange={(e) =>
                            handleFieldChange(field.name, e.target.value)
                          }
                          placeholder={field.placeholder || ""}
                          className="w-full text-xs py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 font-medium shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                        />
                      )}
                    </div>
                  );
                })}
            </div>
          )}

          {/* Kolom Berdampingan: Tanda Tangan Mengetahui (Kiri) & Jalur Persetujuan (Kanan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
            {/* SISI KIRI: Konfigurasi Tanda Tangan Pihak Mengetahui */}
            <div className="space-y-2 p-2.5 sm:p-3 bg-slate-50/90 border border-slate-300 rounded-lg shadow-2xs h-full">
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="p-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    <UserCheck className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    Tanda Tangan "Mengetahui"
                  </span>
                </div>

                {/* Toggle Switch */}
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={includeKnownBy}
                    onChange={(e) => setIncludeKnownBy(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 shadow-inner"></div>
                  <span className="ml-2 text-xs font-bold text-slate-800">
                    {includeKnownBy ? "Sertakan" : "Tanpa Mengetahui"}
                  </span>
                </label>
              </div>

              {/* Jika Toggle Aktif: Pilih User Yang Mengetahui */}
              {includeKnownBy ? (
                <div className="pt-1 animate-fadeIn">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 mb-1">
                      Pilih Pejabat Mengetahui
                      <span className="text-rose-600">*</span>:
                    </label>
                    <SearchableSelect
                      size="sm"
                      value={
                        users.find(
                          (u) =>
                            u.name === knownByName &&
                            u.branchId === currentUser?.branchId,
                        )?.id
                          ? String(
                              users.find(
                                (u) =>
                                  u.name === knownByName &&
                                  u.branchId === currentUser?.branchId,
                              ).id,
                            )
                          : ""
                      }
                      placeholder={`-- Pilih Manager ${currentUser?.branchName || "Cabang"} --`}
                      options={users
                        .filter((u) => {
                          if (u.branchId !== currentUser?.branchId)
                            return false;
                          // Jangan tampilkan akun pemohon sendiri sebagai pilihan pejabat mengetahui
                          if (
                            String(u.id) === String(currentUser?.id) ||
                            u.name?.toLowerCase() ===
                              currentUser?.name?.toLowerCase()
                          ) {
                            return false;
                          }
                          const pos = (
                            u.position ||
                            u.roleLabel ||
                            ""
                          ).toUpperCase();
                          const isManager =
                            pos.includes("MANAGER") ||
                            pos.includes("MANAJER") ||
                            ["J05", "J07", "J08"].includes(u.kodeJabatan);
                          return isManager;
                        })
                        .map((u) => ({
                          value: String(u.id),
                          label: u.name,
                          sublabel: `${u.position || u.roleLabel || "Manager"} • ${u.branchName || currentUser?.branchName}`,
                          group: `Manager (${currentUser?.branchName || "Cabang Aktif"})`,
                        }))}
                      onChange={(val) => {
                        if (!val) {
                          setKnownByName("");
                          setKnownByPosition("");
                          return;
                        }
                        const foundU = users.find(
                          (u) => String(u.id) === String(val),
                        );
                        if (foundU) {
                          setKnownByName(foundU.name);
                          setKnownByPosition(
                            foundU.position || foundU.roleLabel || "Manager",
                          );
                        }
                      }}
                      isClearable
                    />
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic pt-1">
                  Surat tidak mencantumkan tanda tangan pihak "Mengetahui".
                </p>
              )}
            </div>

            {/* SISI KANAN: Jalur Pejabat Penyetuju */}
            <div
              id="approval-steps-section"
              className="space-y-2 p-2.5 sm:p-3 bg-slate-50/90 border border-slate-300 rounded-lg shadow-2xs h-full"
            >
              <div className="flex items-center justify-between gap-1.5 pb-1 border-b border-slate-200">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className="p-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <span className="text-xs font-extrabold text-slate-900 truncate">
                    Jalur Persetujuan
                    <span className="text-rose-600 font-bold">*</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const defaultSteps = (
                        template?.approvalSteps || [
                          { step: 1, approverRole: "Kepala Cabang" },
                        ]
                      ).map((s) => ({
                        step: s.step,
                        approverRole: s.approverRole || s.title,
                        kodeJabatan: s.kodeJabatan || null,
                        specificUserId: s.specificUserId || null,
                        specificUserName: s.specificUserName || null,
                        assignmentType:
                          s.assignmentType ||
                          (s.specificUserId ? "user" : "role"),
                        approverName: s.approverName || null,
                        status: "pending",
                        notes: "",
                        date: null,
                      }));
                      setCustomApprovalSteps(defaultSteps);
                    }}
                    className="px-2 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition shadow-2xs"
                    title="Kembalikan ke settingan default template"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextStepNum = customApprovalSteps.length + 1;
                      setCustomApprovalSteps([
                        ...customApprovalSteps,
                        {
                          step: nextStepNum,
                          approverRole: "Pimpinan Terkait",
                          kodeJabatan: null,
                          specificUserId: null,
                          specificUserName: null,
                          assignmentType: "role",
                          approverName: null,
                          status: "pending",
                          notes: "",
                          date: null,
                        },
                      ]);
                    }}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg border border-indigo-300 transition flex items-center gap-1 shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah</span>
                  </button>
                </div>
              </div>

              {/* List Tingkat Persetujuan yang bisa diedit */}
              <div className="space-y-2.5">
                {customApprovalSteps.map((step, idx) => {
                  const handleUserSelect = (userId) => {
                    const updated = [...customApprovalSteps];
                    if (!userId) {
                      updated[idx].specificUserId = null;
                      updated[idx].specificUserName = null;
                      updated[idx].assignmentType = "role";
                    } else {
                      const u = users.find(
                        (usr) => String(usr.id) === String(userId),
                      );
                      if (u) {
                        updated[idx].specificUserId = String(u.id);
                        updated[idx].specificUserName = u.name;
                        updated[idx].assignmentType = "user";
                        updated[idx].approverRole =
                          u.position || u.roleLabel || "Pejabat";
                      }
                    }
                    setCustomApprovalSteps(updated);
                  };

                  const removeStep = () => {
                    if (customApprovalSteps.length <= 1) {
                      notify.warning(
                        "Peringatan",
                        "Surat harus memiliki minimal 1 pejabat penyetuju.",
                      );
                      return;
                    }
                    const filtered = customApprovalSteps
                      .filter((_, i) => i !== idx)
                      .map((s, i) => ({
                        ...s,
                        step: i + 1,
                      }));
                    setCustomApprovalSteps(filtered);
                  };

                  const isUnselected =
                    !step.specificUserId && !step.approverName;

                  return (
                    <div
                      key={idx}
                      className={`p-1.5 bg-white border rounded-lg transition shadow-2xs ${
                        isUnselected
                          ? "border-amber-400 bg-amber-50/20 ring-1 ring-amber-300/60"
                          : "border-slate-300 hover:border-indigo-400"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-md bg-indigo-600 text-white font-extrabold text-[10px] flex items-center justify-center shrink-0"
                          title={`Tingkat #${idx + 1}`}
                        >
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <SearchableSelect
                            size="sm"
                            value={step.specificUserId || ""}
                            onChange={(val) => handleUserSelect(val)}
                            placeholder="-- Pilih Pejabat Penyetuju (Wajib) --"
                            options={users
                              .filter((u) => {
                                if (u.branchId !== "PST") return false;
                                const pos = (
                                  u.position ||
                                  u.roleLabel ||
                                  ""
                                ).toUpperCase();
                                const isMgrOrDir =
                                  pos.includes("MANAGER") ||
                                  pos.includes("MANAJER") ||
                                  pos.includes("DIREKTUR") ||
                                  pos.includes("DIRECTOR") ||
                                  [
                                    "J01",
                                    "J02",
                                    "J03",
                                    "J05",
                                    "J07",
                                    "J08",
                                  ].includes(u.kodeJabatan);
                                return isMgrOrDir;
                              })
                              .map((u) => ({
                                value: String(u.id),
                                label: u.name,
                                sublabel:
                                  u.position || u.roleLabel || "Pejabat",
                                group: "Pejabat Direksi & Manajemen Pusat",
                              }))}
                            isClearable
                          />
                        </div>
                        {customApprovalSteps.length > 1 && (
                          <button
                            type="button"
                            onClick={removeStep}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition shrink-0"
                            title="Hapus tingkat persetujuan ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Hak Akses Tambahan / Tembusan */}
          <div className="p-2.5 sm:p-3 bg-slate-50/90 border border-slate-300 rounded-lg space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="p-0.5 rounded-md bg-indigo-100 text-indigo-700">
                  <Eye className="w-3.5 h-3.5 shrink-0" />
                </div>
                <span className="text-xs font-extrabold text-slate-900 truncate">
                  Hak Akses / Tembusan (
                  {
                    allowedViewers.filter(
                      (v) =>
                        !autoCheckedUserIds.has(String(v.userId || v.id || v)),
                    ).length
                  }{" "}
                  User Tambahan)
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline font-medium">
                  (Pilih user tambahan yang berhak membaca surat ini)
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowViewerModal(true)}
                className="px-2 py-0.5 text-[11px] font-bold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 rounded-md transition flex items-center gap-1 shadow-2xs shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Tambah / Pilih Pembaca</span>
              </button>
            </div>

            {/* Hanya tampilkan user tambahan manual di luar, user auto-checklist disembunyikan sesuai preferensi */}
            {(() => {
              const manualViewers = allowedViewers.filter(
                (v) => !autoCheckedUserIds.has(String(v.userId || v.id || v)),
              );

              if (manualViewers.length > 0) {
                return (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {manualViewers.map((viewer, vIdx) => {
                      const uId =
                        viewer.userId ||
                        (typeof viewer === "object" ? viewer.id : viewer);
                      const uName = viewer.userName || viewer.name || "User";
                      const uPos = viewer.position || viewer.roleLabel || "";
                      return (
                        <span
                          key={vIdx}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-300 text-slate-900 rounded-full text-xs shadow-2xs group"
                        >
                          <User className="w-3.5 h-3.5 text-indigo-600" />
                          <span className="font-bold text-slate-900">
                            {uName}
                          </span>
                          {uPos && (
                            <span className="text-[10px] text-slate-500">
                              ({uPos})
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setAllowedViewers(
                                allowedViewers.filter(
                                  (item) =>
                                    String(item.userId || item.id || item) !==
                                    String(uId),
                                ),
                              );
                            }}
                            className="hover:text-rose-600 ml-1 p-0.5 text-slate-400 rounded-full hover:bg-rose-50 transition"
                            title="Hapus dari tembusan"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                );
              }

              return (
                <p className="text-xs text-slate-500 italic">
                  Belum ada pembaca tambahan yang dipilih secara manual. Klik
                  tombol di atas jika ingin menambahkan tembusan khusus.
                </p>
              );
            })()}
          </div>

          {/* Action Buttons Step 1 */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
            <div className="text-xs font-medium text-slate-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>
                Isian form akan otomatis disusun ke lembar pratinjau surat
                resmi.
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:from-emerald-800 active:to-teal-800 text-white font-bold rounded-xl text-xs sm:text-sm flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 ring-1 ring-white/20"
              >
                <span>Lanjut ke Review Surat</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: PRATINJAU & REVIEW RESMI DOKUMEN */}
      {activeTab === "preview" && (
        <div className="space-y-4">
          {/* Modal Kelola Lampiran & Foto (Popup Dialog) */}
          {showAttachmentManager && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden">
                {/* Header Modal Lampiran */}
                <div className="p-3.5 sm:p-4 bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <Paperclip className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold leading-tight">
                        Kelola Berkas Lampiran &amp; Foto Surat
                      </h3>
                      <p className="text-[11px] text-blue-200">
                        Unggah gambar, nota, excel, pdf, dan atur tata letak
                        gambar pada halaman lampiran
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAttachmentManager(false)}
                    className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
                    title="Tutup Modal"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Modal Lampiran (Scrollable) */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1">
                  <AttachmentUploader
                    attachments={attachments}
                    onChange={setAttachments}
                  />
                </div>

                {/* Footer Modal Lampiran */}
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
                  <span className="text-xs text-slate-600">
                    Total Berkas Lampiran:{" "}
                    <strong className="text-indigo-600">
                      {attachments.length}
                    </strong>{" "}
                    file
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAttachmentManager(false)}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Selesai &amp; Simpan Pengaturan</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lembar Dokumen Surat (Halaman 1, 2, 3) */}
          <LetterDocumentView
            letter={previewLetterObject}
            isBuilderPreview={true}
            onUpdateImageLayout={(newLayout) => setImageLayout(newLayout)}
          />
        </div>
      )}

      {/* FULLSCREEN MICROSOFT WORD MODE */}
      {isWordFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#eef2f6] flex flex-col h-screen w-screen overflow-hidden animate-fadeIn select-none">
          {/* WORD TOP TITLE BAR */}
          <div className="bg-[#185abd] text-white px-4 py-2.5 flex items-center justify-between shadow-md shrink-0">
            {/* Sisi Kiri: Identitas Dokumen Word */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#0e4b9e] flex items-center justify-center font-bold text-white shadow-xs border border-blue-400/30">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold leading-tight">
                    {effectiveTitle || "Surat Ajuan"}
                  </h3>
                  <span className="text-[10px] font-mono bg-blue-900/70 text-blue-100 px-1.5 py-0.5 rounded border border-blue-400/30">
                    {letterNumber || "DRAFT"}
                  </span>
                </div>
                <p className="text-[11px] text-blue-100/80">
                  Microsoft Word Mode &bull; Pengeditan Surat Resmi Layar Penuh
                </p>
              </div>
            </div>

            {/* Sisi Tengah: Tombol Simpan Draft */}
            <div className="hidden md:flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
                title="Simpan Perubahan ke Draft"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Draft</span>
              </button>
            </div>

            {/* Sisi Kanan: Kontrol Window Word (Minimize & Tutup/Review) */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsWordFullscreen(false)}
                className="px-3 py-1.5 bg-white/15 hover:bg-white/25 active:bg-white/35 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition border border-white/20"
                title="Kecilkan ke halaman review (Esc)"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsWordFullscreen(false);
                  setActiveTab("preview");
                }}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
                title="Tutup editor Word dan kembali ke lembar review pratinjau surat"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Tutup &amp; Lihat Review Surat</span>
              </button>
            </div>
          </div>

          {/* AREA WORKSPACE EDITOR WORD (SCROLLABLE) */}
          <div className="flex-1 overflow-y-auto select-text p-4 sm:p-6 bg-slate-300/80">
            <div className="max-w-6xl mx-auto space-y-6">
              <RichEditor
                value={letterContent}
                onChange={setLetterContent}
                availableVariables={availableVariables}
                letterNumber={letterNumber}
                perihal={
                  effectiveTitle ||
                  fieldValues.perihal ||
                  fieldValues.f_perihal ||
                  ""
                }
                submitterName={
                  currentUser?.name || fieldValues.nama_pemohon || ""
                }
                submitterPosition={
                  currentUser?.position || fieldValues.jabatan || ""
                }
              />
            </div>
          </div>

          {/* WORD STATUS BAR (BOTTOM) */}
          <div className="bg-[#185abd] text-white/90 px-4 py-1.5 text-xs flex items-center justify-between shadow-inner shrink-0 select-none">
            <div className="flex items-center gap-2.5 text-[11px]">
              <span className="font-semibold">Halaman 1 dari 1</span>
              <span>&bull;</span>
              <span>Bahasa Indonesia (Standar Surat Resmi)</span>
              <span>&bull;</span>
              <span className="text-blue-200 hidden md:inline">
                Tekan tombol Esc atau Tutup untuk kembali ke lembar review
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsWordFullscreen(false);
                setActiveTab("preview");
              }}
              className="bg-white text-[#185abd] hover:bg-blue-50 font-bold px-3 py-1 rounded text-[11px] flex items-center gap-1.5 transition shadow-xs"
            >
              <span>Selesai &amp; Lanjut ke Review Surat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL PILIH PEMBACA / TEMBUSAN (CHECKLIST URUT CABANG & JABATAN) */}
      {showViewerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold leading-tight">
                    Pilih Pembaca &amp; Tembusan Surat
                  </h3>
                  <p className="text-[11px] text-indigo-200">
                    Beri centang pada user yang berhak melihat dan membaca surat
                    ini
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowViewerModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Toolbar: Search */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={viewerSearchQuery}
                  onChange={(e) => setViewerSearchQuery(e.target.value)}
                  placeholder="Cari nama atau jabatan di Kantor Pusat..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800"
                />
              </div>
              <div className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] font-semibold text-indigo-700">
                <span>🏢 Khusus Kantor Pusat</span>
              </div>
            </div>

            {/* Modal Body: List Users Grouped by Branch & Sorted by Jabatan */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 divide-y divide-slate-100">
              {(() => {
                // Filter users: HANYA KANTOR PUSAT & yang memiliki jabatan valid
                const q = viewerSearchQuery.toLowerCase().trim();
                const filtered = users.filter((u) => {
                  // Khusus Kantor Pusat saja
                  const isPusat =
                    u.branchId === "PST" ||
                    (u.branchName &&
                      u.branchName.toLowerCase().includes("pusat"));
                  if (!isPusat) return false;

                  // Hilangkan user yang tidak memiliki jabatan atau vacant
                  const pos = (u.position || "").trim();
                  if (
                    !pos ||
                    pos === "-" ||
                    pos.toLowerCase().includes("vacant") ||
                    pos.toLowerCase().includes("nonsales")
                  ) {
                    return false;
                  }

                  if (!q) return true;
                  const matchName = (u.name || "").toLowerCase().includes(q);
                  const matchPos = (u.position || u.roleLabel || "")
                    .toLowerCase()
                    .includes(q);
                  return matchName || matchPos;
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-10 text-slate-400 text-xs">
                      Tidak ditemukan akun user yang sesuai kriteria pencarian.
                    </div>
                  );
                }

                // Group by Branch
                const branchOrder = [
                  "PST",
                  "BDG",
                  "TSM",
                  "CRB",
                  "BGR",
                  "SKB",
                  "PWK",
                  "BTN",
                  "TGR",
                  "BKI",
                  "PWT",
                  "SMR",
                  "KLT",
                  "SBY",
                  "MLG",
                ];
                const grouped = {};
                filtered.forEach((u) => {
                  const bKey = u.branchId || "LAINNYA";
                  if (!grouped[bKey]) grouped[bKey] = [];
                  grouped[bKey].push(u);
                });

                // Role hierarchy sorting
                const getJabatanRank = (u) => {
                  const kode = (u.kodeJabatan || "").toUpperCase();
                  const pos = (u.position || u.roleLabel || "").toUpperCase();
                  if (kode === "J01" || pos.includes("DIREKTUR")) return 1;
                  if (
                    kode === "J02" ||
                    pos.includes("GENERAL MANAGER") ||
                    pos.includes("GM")
                  )
                    return 2;
                  if (kode === "J03" || pos.includes("REGIONAL")) return 3;
                  if (
                    kode === "J05" ||
                    kode === "J07" ||
                    kode === "J08" ||
                    pos.includes("MANAGER") ||
                    pos.includes("MANAJER")
                  )
                    return 4;
                  if (
                    kode === "J12" ||
                    pos.includes("SUPERVISOR") ||
                    pos.includes("SPV")
                  )
                    return 5;
                  if (
                    kode === "J27" ||
                    pos.includes("IT") ||
                    pos.includes("ADMIN SISTEM")
                  )
                    return 6;
                  if (kode === "J26" || pos.includes("CRM")) return 7;
                  if (kode === "J14" || pos.includes("ADMIN")) return 8;
                  if (kode === "J13" || pos.includes("STAFF")) return 9;
                  return 10;
                };

                const sortedBranchKeys = Object.keys(grouped).sort((a, b) => {
                  const idxA = branchOrder.indexOf(a);
                  const idxB = branchOrder.indexOf(b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.localeCompare(b);
                });

                return sortedBranchKeys.map((bKey) => {
                  const branchUsers = grouped[bKey].sort((a, b) => {
                    const rankDiff = getJabatanRank(a) - getJabatanRank(b);
                    if (rankDiff !== 0) return rankDiff;
                    return (a.name || "").localeCompare(b.name || "");
                  });
                  const bName =
                    branchUsers[0]?.branchName ||
                    (bKey === "PST" ? "Kantor Pusat" : `Cabang ${bKey}`);

                  // Check if all in this branch are selected
                  const allSelectedInBranch = branchUsers.every((bu) =>
                    allowedViewers.some(
                      (v) => String(v.userId || v.id || v) === String(bu.id),
                    ),
                  );

                  const toggleAllBranch = () => {
                    setAllowedViewers((prev) => {
                      const cur = prev || [];
                      if (allSelectedInBranch) {
                        const branchUserIds = new Set(
                          branchUsers
                            .filter(
                              (bu) => !autoCheckedUserIds.has(String(bu.id)),
                            )
                            .map((bu) => String(bu.id)),
                        );
                        return cur.filter(
                          (v) =>
                            !branchUserIds.has(String(v.userId || v.id || v)),
                        );
                      } else {
                        const existingIds = new Set(
                          cur.map((v) => String(v.userId || v.id || v)),
                        );
                        const additions = branchUsers
                          .filter((bu) => !existingIds.has(String(bu.id)))
                          .map((bu) => ({
                            userId: String(bu.id),
                            userName: bu.name,
                            position: bu.position || bu.roleLabel || "Pejabat",
                            branchId: bu.branchId,
                          }));
                        return [...cur, ...additions];
                      }
                    });
                  };

                  return (
                    <div key={bKey} className="pt-2 first:pt-0">
                      {/* Branch Header with Select All button */}
                      <div className="flex items-center justify-between pb-1 px-1">
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-indigo-600" />
                          <span>{bName}</span>
                          <span className="text-[10px] font-normal text-slate-500">
                            ({branchUsers.length} Akun)
                          </span>
                        </span>
                        <button
                          type="button"
                          onClick={toggleAllBranch}
                          className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                        >
                          {allSelectedInBranch
                            ? "Batal Pilih Semua"
                            : "Pilih Semua Cabang Ini"}
                        </button>
                      </div>

                      {/* User Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                        {branchUsers.map((u) => {
                          const isAutoChecked = autoCheckedUserIds.has(
                            String(u.id),
                          );
                          const isChecked = allowedViewers.some(
                            (v) =>
                              String(v.userId || v.id || v) === String(u.id),
                          );

                          const handleToggleUser = () => {
                            if (isAutoChecked) return; // Disabled / terkunci otomatis
                            setAllowedViewers((prev) => {
                              const cur = prev || [];
                              const alreadyChecked = cur.some(
                                (v) =>
                                  String(v.userId || v.id || v) ===
                                  String(u.id),
                              );
                              if (alreadyChecked) {
                                return cur.filter(
                                  (v) =>
                                    String(v.userId || v.id || v) !==
                                    String(u.id),
                                );
                              } else {
                                return [
                                  ...cur,
                                  {
                                    userId: String(u.id),
                                    userName: u.name,
                                    position:
                                      u.position || u.roleLabel || "Pejabat",
                                    branchId: u.branchId,
                                  },
                                ];
                              }
                            });
                          };

                          return (
                            <label
                              key={u.id}
                              className={`flex items-start gap-2 p-2 rounded-lg border transition select-none ${
                                isAutoChecked
                                  ? "bg-slate-100/90 border-slate-300 opacity-75 cursor-not-allowed"
                                  : isChecked
                                    ? "bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-200 cursor-pointer"
                                    : "bg-white border-slate-200 hover:bg-slate-50 cursor-pointer"
                              }`}
                              title={
                                isAutoChecked
                                  ? "Akun ini otomatis terchecklist oleh sistem (Terkunci)"
                                  : ""
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                disabled={isAutoChecked}
                                onChange={handleToggleUser}
                                className={`mt-0.5 w-3.5 h-3.5 rounded border-slate-300 ${
                                  isAutoChecked
                                    ? "text-slate-400 bg-slate-200 cursor-not-allowed opacity-80"
                                    : "text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                }`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-bold text-slate-800 truncate flex items-center gap-1.5">
                                  <span>{u.name}</span>
                                  {isAutoChecked && (
                                    <span className="text-[9px] font-semibold px-1 py-0.2 bg-slate-200 text-slate-600 rounded">
                                      Default
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                                  <span className="font-semibold text-indigo-600">
                                    {u.position || u.roleLabel || "Pejabat"}
                                  </span>
                                  <span>&bull;</span>
                                  <span>{u.kodeJabatan || "-"}</span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-600">
                Terpilih:{" "}
                <strong className="text-indigo-600">
                  {allowedViewers.length}
                </strong>{" "}
                pembaca
              </span>
              <button
                type="button"
                onClick={() => setShowViewerModal(false)}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-xs rounded-lg transition flex items-center gap-1.5 shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Selesai Memilih</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
