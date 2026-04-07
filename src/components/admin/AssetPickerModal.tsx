import { X } from "@phosphor-icons/react";

type AssetItem = {
  name: string;
  path: string;
  publicUrl?: string;
};

export default function AssetPickerModal({
  open,
  title,
  assets,
  loading,
  error,
  onSelect,
  onClose,
}: {
  open: boolean;
  title: string;
  assets: AssetItem[];
  loading: boolean;
  error: string | null;
  onSelect: (asset: AssetItem) => void;
  onClose: () => void;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-neutral-950">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h3 className="font-serif text-h4 text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-neutral-400 transition-colors duration-300 hover:text-white"
            aria-label="Close asset picker"
          >
            <X size={18} />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-5">
          {loading && <p className="py-10 text-center text-neutral-400">Loading assets...</p>}
          {error && <p className="py-10 text-center text-red-300">{error}</p>}

          {!loading && !error && assets.length === 0 && (
            <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-neutral-500">
              No assets in this library yet.
            </div>
          )}

          {!loading && !error && assets.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <button
                  key={asset.path}
                  type="button"
                  onClick={() => onSelect(asset)}
                  className="overflow-hidden rounded-xl border border-border bg-secondary text-left transition-colors duration-300 hover:border-tertiary"
                >
                  {asset.publicUrl ? (
                    <div className="aspect-[4/3] overflow-hidden bg-neutral-900">
                      {/\.(mp4|webm|mov)$/i.test(asset.name) ? (
                        <video src={asset.publicUrl} className="h-full w-full object-cover" muted />
                      ) : (
                        <img src={asset.publicUrl} alt={asset.name} className="h-full w-full object-cover" />
                      )}
                    </div>
                  ) : (
                    <div className="flex aspect-[4/3] items-center justify-center bg-neutral-900 px-4 text-center font-mono text-xs uppercase tracking-[0.25em] text-neutral-500">
                      Private Asset
                    </div>
                  )}
                  <div className="p-4">
                    <p className="truncate font-sans text-sm text-neutral-200">{asset.name}</p>
                    <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.25em] text-neutral-500">
                      {asset.path}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
