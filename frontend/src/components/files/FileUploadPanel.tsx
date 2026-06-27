import { useEffect, useRef, useState } from "react";
import { FileUp, Paperclip, Trash2, X } from "lucide-react";

import { resolveBackendAssetUrl } from "@/config/backend";
import { formatBytes } from "@/lib/format";
import type { Attachment } from "@/types/api";

type Props = {
  pendingFiles: File[];
  onAddFiles: (files: File[]) => void;
  onRemovePending: (index: number) => void;
  attachments?: Attachment[];
  onRemoveAttachment?: (id: number) => void;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  label?: string;
  hint?: string;
  compact?: boolean;
  showPicker?: boolean;
};

export function FileUploadPanel({
  pendingFiles,
  onAddFiles,
  onRemovePending,
  attachments = [],
  onRemoveAttachment,
  disabled,
  multiple = true,
  accept = "*/*",
  label = "Click to upload",
  hint = "Images, PDF, PSD, AI, ZIP, DOCX and more — up to 50 MB each",
  compact,
  showPicker = true,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const onInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list?.length) return;
    onAddFiles(Array.from(list));
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      {showPicker ? (
        <>
          <button
            type="button"
            disabled={disabled}
            onClick={pick}
            className={`w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-2/40 transition hover:bg-surface-2/70 disabled:opacity-50 ${
              compact ? "px-3 py-4" : "px-4 py-8"
            }`}
          >
            <FileUp className={`text-text-3 ${compact ? "size-5" : "size-6"}`} />
            <div className="text-[13px] font-medium">{label}</div>
            {!compact ? <div className="text-[11px] text-text-3 text-center max-w-sm">{hint}</div> : null}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple={multiple}
            accept={accept}
            className="hidden"
            disabled={disabled}
            onChange={onInput}
          />
        </>
      ) : null}

      {pendingFiles.length > 0 ? (
        <ul className="space-y-1.5">
          {pendingFiles.map((f, i) => (
            <PendingFileRow key={`${f.name}-${i}`} file={f} onRemove={() => onRemovePending(i)} />
          ))}
        </ul>
      ) : null}

      {attachments.length > 0 ? (
        <ul className="space-y-1.5">
          {attachments.map((a) => (
            <AttachmentRow
              key={a.id}
              attachment={a}
              onRemove={onRemoveAttachment ? () => onRemoveAttachment(a.id) : undefined}
            />
          ))}
        </ul>
      ) : null}
    </div>
  );
}

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|bmp|svg|avif|heic|heif|tiff?)$/i;

function isImageFile(file: File) {
  return file.type.startsWith("image/") || IMAGE_EXT.test(file.name);
}

function isImageAttachment(attachment: Attachment) {
  return attachment.mime_type.startsWith("image/") || IMAGE_EXT.test(attachment.original_name);
}

function PendingFileRow({ file, onRemove }: { file: File; onRemove: () => void }) {
  const isImage = isImageFile(file);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isImage) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, isImage]);

  if (isImage && previewUrl) {
    return (
      <li className="overflow-hidden rounded-lg border border-border">
        <div className="relative bg-surface-2/40">
          <img src={previewUrl} alt={file.name} className="w-full max-h-44 object-contain" />
          <button
            type="button"
            className="absolute top-2 right-2 rounded-md bg-surface/90 p-1 text-text-3 shadow-sm hover:text-danger"
            onClick={onRemove}
          >
            <X className="size-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 border-t border-border/70 px-3 py-2 text-[12.5px]">
          <span className="min-w-0 flex-1 truncate">{file.name}</span>
          <span className="text-text-3 shrink-0 tabular-nums">{formatBytes(file.size)}</span>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-[12.5px]">
      <Paperclip className="size-4 shrink-0 text-text-3" />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      <span className="text-text-3 shrink-0 tabular-nums">{formatBytes(file.size)}</span>
      <button type="button" className="text-text-3 hover:text-danger" onClick={onRemove}>
        <X className="size-3.5" />
      </button>
    </li>
  );
}

function AttachmentRow({
  attachment,
  onRemove,
}: {
  attachment: Attachment;
  onRemove?: () => void;
}) {
  const isImage = isImageAttachment(attachment);
  const assetUrl = resolveBackendAssetUrl(attachment.url);

  if (isImage) {
    return (
      <li className="overflow-hidden rounded-lg border border-border/80">
        <div className="relative bg-surface-2/40">
          <a href={assetUrl} target="_blank" rel="noreferrer">
            <img
              src={assetUrl}
              alt={attachment.original_name}
              className="w-full max-h-44 object-contain hover:opacity-95 transition"
            />
          </a>
          {onRemove ? (
            <button
              type="button"
              className="absolute top-2 right-2 rounded-md bg-surface/90 p-1 text-text-3 shadow-sm hover:text-danger"
              onClick={onRemove}
            >
              <Trash2 className="size-3.5" />
            </button>
          ) : null}
        </div>
        <div className="flex items-center gap-2 border-t border-border/70 px-3 py-2 text-[12.5px]">
          <a href={assetUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-brand">
            {attachment.original_name}
          </a>
          <span className="text-text-3 shrink-0 tabular-nums">{formatBytes(attachment.size_bytes)}</span>
        </div>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-2 rounded-lg border border-border/80 px-3 py-2 text-[12.5px]">
      <Paperclip className="size-4 shrink-0 text-text-3" />
      <a href={assetUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate hover:text-brand">
        {attachment.original_name}
      </a>
      <span className="text-text-3 shrink-0 tabular-nums">{formatBytes(attachment.size_bytes)}</span>
      {onRemove ? (
        <button type="button" className="text-text-3 hover:text-danger" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </button>
      ) : null}
    </li>
  );
}

export async function uploadFiles(
  entityType: string,
  entityId: number,
  files: File[],
  uploadFn: (entity_type: string, entity_id: number, file: File) => Promise<unknown>,
) {
  const results = [];
  for (const file of files) {
    results.push(await uploadFn(entityType, entityId, file));
  }
  return results;
}
