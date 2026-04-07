import { useEffect, useRef, useState } from "react";
import { ImageSquare, LinkSimple, UploadSimple } from "@phosphor-icons/react";
import {
  listLessonAssets,
  uploadLessonAsset,
  type LessonAssetType,
  type LessonAssetVisibility,
} from "../../lib/lessons/media";
import AssetPickerModal from "./AssetPickerModal";

export type MediaPickerValue = {
  storagePath?: string | null;
  publicUrl?: string | null;
  embedUrl?: string | null;
  fileKind?: string | null;
};

export default function MediaPicker({
  label,
  assetType,
  visibility,
  value,
  onChange,
  accept,
  folder,
  helperText,
  externalLabel,
  onExternalUrlChange,
}: {
  label: string;
  assetType: LessonAssetType;
  visibility: LessonAssetVisibility;
  value: MediaPickerValue;
  onChange: (value: MediaPickerValue) => void;
  accept?: string;
  folder?: string;
  helperText?: string;
  externalLabel?: string;
  onExternalUrlChange?: (value: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [assetError, setAssetError] = useState<string | null>(null);
  const [assets, setAssets] = useState<{ name: string; path: string; publicUrl?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    let active = true;
    setLoadingAssets(true);
    setAssetError(null);

    listLessonAssets({ assetType, visibility, folder }).then(({ files, error }) => {
      if (!active) {
        return;
      }

      setAssets(files);
      setAssetError(error);
      setLoadingAssets(false);
    });

    return () => {
      active = false;
    };
  }, [assetType, folder, open, visibility]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const result = await uploadLessonAsset(file, { assetType, visibility, folder });
    setUploading(false);

    if (!result.success) {
      setAssetError(result.error);
      return;
    }

    onChange({
      storagePath: result.path,
      publicUrl: visibility === "public" ? result.url : null,
      embedUrl: null,
      fileKind: file.type || null,
    });
  };

  const previewUrl = value.publicUrl || value.embedUrl || null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-amber-300">{label}</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1 rounded border border-border bg-neutral-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
          >
            <UploadSimple size={12} />
            {uploading ? "Uploading..." : "Upload"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded border border-border bg-neutral-900 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-300 transition-colors duration-300 hover:border-tertiary hover:text-tertiary"
          >
            <ImageSquare size={12} />
            Existing
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-neutral-900/70 p-4">
        {previewUrl ? (
          /\.(mp4|webm|mov)$/i.test(previewUrl) ? (
            <video src={previewUrl} className="max-h-52 w-full rounded-lg object-cover" muted controls />
          ) : (
            <img src={previewUrl} alt={label} className="max-h-52 w-full rounded-lg object-cover" />
          )
        ) : value.storagePath ? (
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
            Stored at {value.storagePath}
          </p>
        ) : (
          <p className="text-sm text-neutral-500">No asset selected yet.</p>
        )}
      </div>

      {onExternalUrlChange && (
        <div className="space-y-2">
          <label className="font-mono text-xs uppercase tracking-[0.3em] text-neutral-400">
            {externalLabel || "Embed URL"}
          </label>
          <div className="relative">
            <LinkSimple size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="url"
              value={value.embedUrl ?? ""}
              onChange={(event) => onExternalUrlChange(event.target.value)}
              className="w-full rounded-md border border-border bg-neutral-900 py-3 pl-10 pr-4 text-white focus:border-tertiary focus:outline-none"
              placeholder="https://..."
            />
          </div>
        </div>
      )}

      {helperText && <p className="text-xs text-neutral-500">{helperText}</p>}
      {assetError && <p className="text-xs text-red-300">{assetError}</p>}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            void handleUpload(file);
          }
          event.target.value = "";
        }}
      />

      <AssetPickerModal
        open={open}
        title={`Choose ${label}`}
        assets={assets}
        loading={loadingAssets}
        error={assetError}
        onClose={() => setOpen(false)}
        onSelect={(asset) => {
          onChange({
            storagePath: asset.path,
            publicUrl: asset.publicUrl ?? null,
            embedUrl: null,
            fileKind: null,
          });
          setOpen(false);
        }}
      />
    </div>
  );
}
