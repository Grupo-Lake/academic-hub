import sanitize from "sanitize-filename";
import imageCompression from "browser-image-compression";
import type { CSSProperties } from "react";

export const IMAGE_COMPRESSION_THRESHOLD_BYTES = 300 * 1024;

export async function prepareFileForUpload(file: File): Promise<File> {
  const cleanName = sanitize(file.name) || "arquivo";

  if (file.type.startsWith("image/") && file.size > IMAGE_COMPRESSION_THRESHOLD_BYTES) {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    return new File([compressed], cleanName, { type: compressed.type || file.type });
  }

  return cleanName === file.name ? file : new File([file], cleanName, { type: file.type });
}

export function extKind(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "PDF";
    case "pptx":
    case "ppt":
      return "Slides";
    case "docx":
    case "doc":
      return "Doc";
    case "xlsx":
    case "xls":
      return "Planilha";
    case "png":
    case "jpg":
    case "jpeg":
      return "Imagem";
    default:
      return "Arquivo";
  }
}

export const inputStyle: CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-xs)",
  padding: "7px 10px",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  width: "100%",
};

export function updateAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}
