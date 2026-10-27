/* eslint-disable @next/next/no-img-element -- vista previa local (blob:) */
"use client";

import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useTranslations } from "next-intl";
import { Camera, Check, ImagePlus, ZoomIn } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Recorta la imagen al área elegida y devuelve un JPEG cuadrado (máx. 1000 px; el servidor lo reduce a 600×600 WebP). */
async function cropToBlob(src: string, area: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = src;
  });
  const size = Math.min(1000, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, size, size);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), "image/jpeg", 0.9),
  );
}

type Props = {
  value: string | null;
  onChange: (blob: Blob, previewUrl: string) => void;
  error?: string;
  busy?: boolean;
};

/** Foto de perfil con recorte cuadrado y vista previa. */
export function PhotoPicker({ value, onChange, error, busy }: Props) {
  const t = useTranslations("fields");
  const inputRef = useRef<HTMLInputElement>(null);
  const [source, setSource] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);

  const onFile = (file?: File) => {
    if (!file) return;
    setSource(URL.createObjectURL(file));
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const onComplete = useCallback((_: Area, px: Area) => setArea(px), []);

  const apply = async () => {
    if (!source || !area) return;
    const blob = await cropToBlob(source, area);
    onChange(blob, URL.createObjectURL(blob));
    URL.revokeObjectURL(source);
    setSource(null);
  };

  return (
    <div>
      <span className="label">{t("photo")}</span>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          aria-label={value ? t("changePhoto") : t("addPhoto")}
          className={cn(
            "group relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-dashed transition duration-200 hover:-translate-y-0.5",
            error ? "border-terra/60" : "border-line/20",
            value && "border-solid border-sage",
          )}
        >
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                <Camera size={22} strokeWidth={1.5} className="text-white" aria-hidden />
              </span>
            </>
          ) : (
            <ImagePlus size={28} strokeWidth={1.5} className="text-muted" aria-hidden />
          )}
        </button>
        <div className="min-w-0">
          <Button variant="secondary" size="sm" icon={Camera} onClick={() => inputRef.current?.click()} loading={busy}>
            {value ? t("changePhoto") : t("addPhoto")}
          </Button>
          <p className={cn("mt-2 text-[13px]", error ? "text-terra" : "text-muted")} role={error ? "alert" : undefined}>
            {error ?? t("photoHint")}
          </p>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <Modal open={!!source} onClose={() => setSource(null)} title={t("cropTitle")}>
        {source && (
          <div className="space-y-4">
            <div className="relative h-72 overflow-hidden rounded-2xl bg-black/80">
              <Cropper
                image={source}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onComplete}
              />
            </div>
            <label className="flex items-center gap-3 text-sm text-muted">
              <ZoomIn size={18} strokeWidth={1.5} aria-hidden />
              <span className="sr-only">{t("zoom")}</span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full accent-[rgb(var(--sage))]"
                aria-label={t("zoom")}
              />
            </label>
            <Button block icon={Check} onClick={apply}>
              {t("applyCrop")}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
