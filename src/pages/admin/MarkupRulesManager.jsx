// src/pages/admin/MarkupRulesManager.jsx
// TP-OTA-FE-EXTRANET-003 — Admin Multi-Layer Markup Controller (Yield Management UI)
// Advanced micro-targeting form for platform management — NO "Select All" components

import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import toast, { Toaster } from "react-hot-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  TrendingUp,
  TrendingDown,
  Percent,
  DollarSign,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Shield,
  CalendarDays,
  Tag,
  Layers,
  AlertTriangle,
  CheckCircle2,
  X,
  Settings2,
  LayoutGrid,
} from "lucide-react";
import MultiSelectChips from "@/components/partners/MultiSelectChips";
import authStorage from "@/services/authStorage";
import {
  fetchMarkupRules,
  createMarkupRule,
  updateMarkupRule,
  deleteMarkupRule,
  fetchMetadata,
} from "./markupApi";
import {
  formatCurrency,
  calculateMarkupPreview,
  formatDateISO,
} from "@/utils/markupHelpers";

// ────────────────────────────────────────────────────────────
// Zod validation schema for markup rules
// ────────────────────────────────────────────────────────────
const markupRuleSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title must be under 100 characters"),
    properties: z
      .array(z.number().positive())
      .min(1, "Select at least one accommodation"),
    roomTypes: z
      .array(z.number().positive())
      .min(1, "Select at least one room type"),
    action: z.enum(["INCREASE", "DECREASE"]),
    mode: z.enum(["PERCENTAGE", "FIXED"]),
    value: z.coerce
      .number({ invalid_type_error: "Value must be a number" })
      .positive("Value must be greater than 0"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

// ────────────────────────────────────────────────────────────
// Default form state
// ────────────────────────────────────────────────────────────
const DEFAULT_FORM = {
  title: "",
  properties: [],
  roomTypes: [],
  action: "INCREASE",
  mode: "PERCENTAGE",
  value: "",
  startDate: "",
  endDate: "",
};

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────
export default function MarkupRulesManager() {
  const navigate = useNavigate();

  // Auth guard
  useEffect(() => {
    const token = authStorage.getAccessToken();
    if (!token) {
      navigate("/partners/login", { replace: true });
    }
  }, [navigate]);

  // ── State ──
  const [rules, setRules] = useState([]);
  const [rulesLoading, setRulesLoading] = useState(true);
  const [metadata, setMetadata] = useState({
    room_types: [],
    properties: [],
  });

  // Form
  const [formData, setFormData] = useState({ ...DEFAULT_FORM });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = create mode, number = edit mode
  const [formOpen, setFormOpen] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Data Fetching ──
  const loadRules = useCallback(async () => {
    setRulesLoading(true);
    try {
      const data = await fetchMarkupRules();
      setRules(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error(err?.message || "Failed to load markup rules");
    } finally {
      setRulesLoading(false);
    }
  }, []);

  const loadMetadata = useCallback(async () => {
    try {
      const data = await fetchMetadata();
      setMetadata({
        room_types: data?.room_types || [],
        properties: data?.properties || [],
      });
    } catch (err) {
      console.error("Failed to load metadata:", err);
    }
  }, []);

  useEffect(() => {
    loadRules();
    loadMetadata();
  }, [loadRules, loadMetadata]);

  // ── Options for multi-select ──
  const propertyOptions = useMemo(
    () =>
      metadata.properties.map((p) => ({
        id: p.id,
        label: p.name || p.title || `Property #${p.id}`,
      })),
    [metadata.properties]
  );

  const roomTypeOptions = useMemo(
    () =>
      metadata.room_types.map((rt) => ({
        id: rt.id,
        label: rt.name,
      })),
    [metadata.room_types]
  );

  // ── Form Handling ──
  function updateField(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setFormData({ ...DEFAULT_FORM });
    setFormErrors({});
    setFormOpen(true);
  }

  function openEditForm(rule) {
    setEditingId(rule.id);
    setFormData({
      title: rule.title || "",
      properties: rule.properties || [],
      roomTypes: rule.room_types || [],
      action: rule.action || "INCREASE",
      mode: rule.mode || "PERCENTAGE",
      value: rule.value != null ? String(rule.value) : "",
      startDate: rule.start_date || "",
      endDate: rule.end_date || "",
    });
    setFormErrors({});
    setFormOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormErrors({});

    // Validate
    const result = markupRuleSchema.safeParse(formData);
    if (!result.success) {
      const errors = {};
      result.error.issues.forEach((issue) => {
        const key = issue.path[0];
        if (!errors[key]) errors[key] = issue.message;
      });
      setFormErrors(errors);
      return;
    }

    const payload = {
      title: formData.title,
      properties: formData.properties,
      room_types: formData.roomTypes,
      action: formData.action,
      mode: formData.mode,
      value: Number(formData.value),
      start_date: formData.startDate,
      end_date: formData.endDate,
    };

    setSubmitting(true);
    try {
      if (editingId) {
        await updateMarkupRule(editingId, payload);
        toast.success("Markup rule updated successfully!", {
          icon: "✅",
          style: {
            background: "hsl(205 37% 10%)",
            color: "hsl(210 20% 92%)",
            border: "1px solid hsl(172 100% 42% / 0.3)",
          },
        });
      } else {
        await createMarkupRule(payload);
        toast.success("Markup rule created successfully!", {
          icon: "🎯",
          style: {
            background: "hsl(205 37% 10%)",
            color: "hsl(210 20% 92%)",
            border: "1px solid hsl(172 100% 42% / 0.3)",
          },
        });
      }
      setFormOpen(false);
      setFormData({ ...DEFAULT_FORM });
      setEditingId(null);
      loadRules();
    } catch (err) {
      toast.error(err?.message || "Operation failed", {
        style: {
          background: "hsl(205 37% 10%)",
          color: "hsl(210 20% 92%)",
          border: "1px solid hsl(351 100% 71% / 0.3)",
        },
      });
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete ──
  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteMarkupRule(deleteTarget.id);
      toast.success("Rule deleted", {
        icon: "🗑️",
        style: {
          background: "hsl(205 37% 10%)",
          color: "hsl(210 20% 92%)",
          border: "1px solid hsl(210 15% 18%)",
        },
      });
      setDeleteTarget(null);
      loadRules();
    } catch (err) {
      toast.error(err?.message || "Delete failed");
    } finally {
      setDeleting(false);
    }
  }

  // ── Markup preview ──
  const previewPrice = useMemo(() => {
    const base = 1000; // preview base price
    if (!formData.value || isNaN(Number(formData.value))) return null;
    return calculateMarkupPreview(
      base,
      formData.action,
      formData.mode,
      Number(formData.value)
    );
  }, [formData.action, formData.mode, formData.value]);

  // ────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────
  return (
    <TooltipProvider delayDuration={200}>
      <Toaster position="top-right" />
      <div className="mx-auto w-full max-w-7xl space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
              <Shield className="size-4" />
              Admin Panel
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Markup Rules Manager
            </h1>
            <p className="text-sm text-muted-foreground">
              Dynamic yield management — configure multi-layer pricing rules for
              the 4-Layer Pipeline
            </p>
          </div>
          <Button onClick={openCreateForm} className="gap-2">
            <Plus className="size-4" />
            New Rule
          </Button>
        </div>

        {/* ── Existing Rules Table ── */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="border-b border-border/30 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutGrid className="size-4 text-primary" />
              Active Rules
              <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                {rules.length}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Rules are applied in order. Multiple rules compound on the base
              price via the 4-Layer pricing pipeline.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {rulesLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : rules.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
                <Settings2 className="size-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">
                  No markup rules configured yet
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={openCreateForm}
                  className="gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Create First Rule
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border/30 text-left text-xs font-medium text-muted-foreground">
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Value</th>
                      <th className="px-4 py-3">Validity</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.map((rule) => {
                      const isActive =
                        rule.is_active !== false &&
                        new Date(rule.end_date) >= new Date();
                      const isIncrease = rule.action === "INCREASE";

                      return (
                        <tr
                          key={rule.id}
                          className="group border-b border-border/10 transition-colors hover:bg-muted/20"
                        >
                          {/* Title */}
                          <td className="px-4 py-3">
                            <div className="space-y-0.5">
                              <p className="text-sm font-medium text-foreground">
                                {rule.title}
                              </p>
                              <p className="text-[0.7rem] text-muted-foreground">
                                {(rule.properties || []).length} properties •{" "}
                                {(rule.room_types || []).length} room types
                              </p>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold",
                                isIncrease
                                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
                              )}
                            >
                              {isIncrease ? (
                                <TrendingUp className="size-3" />
                              ) : (
                                <TrendingDown className="size-3" />
                              )}
                              {rule.action}
                            </span>
                          </td>

                          {/* Value */}
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-foreground">
                              {rule.value}
                              {rule.mode === "PERCENTAGE" ? "%" : " EGP"}
                            </span>
                          </td>

                          {/* Validity */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <CalendarDays className="size-3.5" />
                              {rule.start_date} → {rule.end_date}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.7rem] font-semibold",
                                isActive
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : "bg-muted/40 text-muted-foreground"
                              )}
                            >
                              <div
                                className={cn(
                                  "size-1.5 rounded-full",
                                  isActive
                                    ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                                    : "bg-muted-foreground/40"
                                )}
                              />
                              {isActive ? "Active" : "Expired"}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => openEditForm(rule)}
                                  >
                                    <Pencil className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Edit</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={() => setDeleteTarget(rule)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Create/Edit Form Panel ── */}
        {formOpen && (
          <Card className="border-primary/20 bg-card/90 shadow-lg shadow-primary/5 backdrop-blur-sm">
            <CardHeader className="border-b border-border/30 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="size-4 text-primary" />
                    {editingId ? "Edit Markup Rule" : "Create New Markup Rule"}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Configure granular pricing adjustments — select specific targets
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingId(null);
                  }}
                >
                  <X className="size-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-5">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Rule Title
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    placeholder='e.g. "Dahab Sea-View Eid Peak 2026"'
                    className={cn(
                      "h-10",
                      formErrors.title &&
                        "border-destructive ring-destructive/20"
                    )}
                  />
                  {formErrors.title && (
                    <p className="text-xs text-destructive">
                      {formErrors.title}
                    </p>
                  )}
                </div>

                {/* Target Selectors — Grid */}
                <div className="grid gap-5 md:grid-cols-2">
                  {/* Target Accommodations */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Layers className="size-3.5" />
                      Target Accommodations
                    </label>
                    <MultiSelectChips
                      options={propertyOptions}
                      selected={formData.properties}
                      onChange={(ids) => updateField("properties", ids)}
                      placeholder="Select camps, hotels..."
                    />
                    {formErrors.properties && (
                      <p className="text-xs text-destructive">
                        {formErrors.properties}
                      </p>
                    )}
                  </div>

                  {/* Target Room Types */}
                  <div className="space-y-2">
                    <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Layers className="size-3.5" />
                      Target Room Types
                    </label>
                    <MultiSelectChips
                      options={roomTypeOptions}
                      selected={formData.roomTypes}
                      onChange={(ids) => updateField("roomTypes", ids)}
                      placeholder="Select Double, Triple..."
                    />
                    {formErrors.roomTypes && (
                      <p className="text-xs text-destructive">
                        {formErrors.roomTypes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action + Mode + Value — Horizontal strip */}
                <div className="grid gap-5 md:grid-cols-3">
                  {/* Action Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      Action
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateField("action", "INCREASE")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                          formData.action === "INCREASE"
                            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 shadow-sm shadow-emerald-500/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <TrendingUp className="size-3.5" />
                        INCREASE
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("action", "DECREASE")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                          formData.action === "DECREASE"
                            ? "border-amber-500/40 bg-amber-500/10 text-amber-400 shadow-sm shadow-amber-500/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <TrendingDown className="size-3.5" />
                        DECREASE
                      </button>
                    </div>
                  </div>

                  {/* Profit Value Mode Toggle */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      Value Mode
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => updateField("mode", "PERCENTAGE")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                          formData.mode === "PERCENTAGE"
                            ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Percent className="size-3.5" />
                        Percentage
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("mode", "FIXED")}
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-all",
                          formData.mode === "FIXED"
                            ? "border-primary/40 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <DollarSign className="size-3.5" />
                        Fixed (EGP)
                      </button>
                    </div>
                  </div>

                  {/* Value Input */}
                  <div className="space-y-3">
                    <label className="text-xs font-medium text-muted-foreground">
                      {formData.action === "INCREASE" ? "Markup" : "Discount"}{" "}
                      Value
                      <span className="ml-1 text-primary">
                        ({formData.mode === "PERCENTAGE" ? "%" : "EGP"})
                      </span>
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step={formData.mode === "PERCENTAGE" ? "0.1" : "1"}
                      value={formData.value}
                      onChange={(e) => updateField("value", e.target.value)}
                      placeholder={
                        formData.mode === "PERCENTAGE" ? "e.g. 15" : "e.g. 200"
                      }
                      className={cn(
                        "h-10",
                        formErrors.value &&
                          "border-destructive ring-destructive/20"
                      )}
                    />
                    {formErrors.value && (
                      <p className="text-xs text-destructive">
                        {formErrors.value}
                      </p>
                    )}
                  </div>
                </div>

                {/* Live Preview */}
                {previewPrice != null && (
                  <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-muted-foreground">
                        Preview on {formatCurrency(1000)} base:
                      </span>
                      <span className="font-bold text-primary">
                        → {formatCurrency(previewPrice)}
                      </span>
                      <span
                        className={cn(
                          "font-semibold",
                          formData.action === "INCREASE"
                            ? "text-emerald-400"
                            : "text-amber-400"
                        )}
                      >
                        ({formData.action === "INCREASE" ? "+" : "-"}
                        {formData.value}
                        {formData.mode === "PERCENTAGE" ? "%" : " EGP"})
                      </span>
                    </div>
                  </div>
                )}

                {/* Validity Date Range */}
                <div className="space-y-2">
                  <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Validity Period
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) =>
                          updateField("startDate", e.target.value)
                        }
                        className={cn(
                          "h-9",
                          formErrors.startDate &&
                            "border-destructive ring-destructive/20"
                        )}
                      />
                      {formErrors.startDate && (
                        <p className="text-[0.7rem] text-destructive">
                          {formErrors.startDate}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) =>
                          updateField("endDate", e.target.value)
                        }
                        min={formData.startDate}
                        className={cn(
                          "h-9",
                          formErrors.endDate &&
                            "border-destructive ring-destructive/20"
                        )}
                      />
                      {formErrors.endDate && (
                        <p className="text-[0.7rem] text-destructive">
                          {formErrors.endDate}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={submitting}
                    className="gap-2 px-6 font-semibold"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        {editingId ? "Updating..." : "Creating..."}
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="size-4" />
                        {editingId ? "Update Rule" : "Create Rule"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Delete Confirmation Dialog ── */}
        <Dialog
          open={deleteTarget != null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
        >
          <DialogContent className="border-border bg-card sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-destructive/10">
                <AlertTriangle className="size-6 text-destructive" />
              </div>
              <DialogTitle className="text-center text-foreground">
                Delete Markup Rule
              </DialogTitle>
              <DialogDescription className="text-center text-muted-foreground">
                Are you sure you want to delete &quot;{deleteTarget?.title}&quot;?
                This action cannot be undone and will immediately affect the
                pricing pipeline.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex-row justify-center gap-2 sm:justify-center">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Delete Rule
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
