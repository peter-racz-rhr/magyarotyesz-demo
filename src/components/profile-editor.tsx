"use client";

import { Camera, X } from "lucide-react";
import Cropper, { type Area } from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { useT } from "@/lib/i18n";
import { checkFields } from "@/lib/moderation";
import { AVATAR_HUES, NAME_MAX, saveProfile, tidyName } from "@/lib/profile";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const OUT = 360; // the saved picture's size, in px
const WORK = 1600; // pictures are shrunk to this before cropping, so a 12 MP photo can't choke a phone

/**
 * Turns whatever the phone handed over into a plain, upright, reasonably small JPEG
 * (as a data address). Throws when the file can't be read as a picture at all.
 */
async function prepare(file: File): Promise<string> {
  let source: ImageBitmap | HTMLImageElement;
  try {
    // "from-image" turns a sideways phone photo upright.
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      source = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error("unreadable"));
        image.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (!w || !h) throw new Error("empty");
  const k = Math.min(1, WORK / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * k);
  canvas.height = Math.round(h * k);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("unreadable"));
    image.src = src;
  });
}

/** Choose which part of a picture to keep: drag to move, pinch / scroll / slide to zoom (react-easy-crop). */
function PhotoCrop({ file, onDone, onCancel }: { file: File; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const { t } = useT();
  const [src, setSrc] = useState<string | null>(null);
  const [bad, setBad] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const area = useRef<Area | null>(null);

  useEffect(() => {
    let live = true;
    prepare(file).then(
      (url) => live && setSrc(url),
      () => live && setBad(true),
    );
    return () => {
      live = false;
    };
  }, [file]);

  const save = async () => {
    if (!src || !area.current) return;
    const image = await loadImage(src);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return onCancel();
    const { x, y, width, height } = area.current;
    ctx.drawImage(image, x, y, width, height, 0, 0, OUT, OUT);
    onDone(canvas.toDataURL("image/jpeg", 0.86));
  };

  if (bad) {
    return (
      <div className="flex flex-col items-center gap-6 pt-16 text-center">
        <p role="alert" className="max-w-[28ch] text-[0.9375rem] text-stale">
          {t.profile.photoBad}
        </p>
        <button type="button" onClick={onCancel} className={cn(btn.secondary, btn.md, "px-8")}>
          {t.card.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <p className="text-center text-sm text-haze">{t.profile.photoTitle}</p>
      <div className="relative mx-auto aspect-square w-full max-w-[22rem] overflow-hidden rounded-[22px] bg-black">
        {src ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            minZoom={1}
            maxZoom={4}
            aspect={1}
            cropShape="round"
            showGrid={false}
            objectFit="cover"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, pixels) => {
              area.current = pixels;
            }}
          />
        ) : (
          <div className="absolute inset-0 grid place-items-center text-sm text-haze">…</div>
        )}
      </div>
      <label className="mx-auto flex w-full max-w-[22rem] items-center gap-3 text-sm text-haze">
        <span className="shrink-0">{t.profile.photoZoom}</span>
        <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="h-8 w-full accent-[var(--brand)]" />
      </label>
      <div className="mx-auto flex w-full max-w-[22rem] gap-2">
        <button type="button" onClick={onCancel} className={cn(btn.quiet, btn.md, "flex-1")}>
          {t.card.cancel}
        </button>
        <button type="button" onClick={save} disabled={!src} className={cn(btn.primary, btn.md, "flex-1")}>
          {t.profile.photoUse}
        </button>
      </div>
    </div>
  );
}

/** Edit profile: photo, name and colour, on a screen of its own. */
export function ProfileEditor({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  const settings = useSettings();
  const [name, setName] = useState(settings.name);
  const [hue, setHue] = useState(settings.avatar);
  const [photo, setPhoto] = useState(settings.photo);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  // The page behind doesn't scroll while this is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pick = (f: File | undefined) => {
    if (!f) return;
    if (f.size > 40 * 1024 * 1024) return setError(t.profile.photoBad);
    setError("");
    setFile(f);
  };

  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const clean = tidyName(name);
    if (!checkFields({ name: clean }).ok) return setError(t.add.errBad);
    saveProfile(clean, hue, photo);
    onClose();
  };

  return (
    <div role="dialog" aria-modal="true" aria-label={t.profile.profileTitle} className="fixed inset-0 z-[80] overflow-y-auto bg-night pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-5 pt-3 pb-8">
        <div className="flex h-11 items-center">
          <button type="button" onClick={onClose} aria-label={t.card.cancel} className="-ml-2.5 grid size-11 place-items-center rounded-full text-ink/80 active:bg-fg/10">
            <X className="size-[1.375rem]" strokeWidth={1.75} aria-hidden />
          </button>
          <h2 className="flex-1 text-center text-[1.0625rem] font-semibold">{t.profile.profileTitle}</h2>
          <span className="size-11" />
        </div>

        {file ? (
          <div className="mt-8">
            <PhotoCrop
              file={file}
              onCancel={() => setFile(null)}
              onDone={(url) => {
                setPhoto(url);
                setFile(null);
              }}
            />
          </div>
        ) : (
          <form onSubmit={save} className="mt-6 flex flex-1 flex-col items-center">
            <button type="button" onClick={() => input.current?.click()} aria-label={photo ? t.profile.changePhoto : t.profile.addPhoto} className="group relative rounded-full">
              <Avatar name={name} hue={hue} photo={photo} size={132} />
              <span className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full bg-ink text-night shadow-[0_2px_10px_rgb(0_0_0/0.5)] ring-4 ring-night">
                <Camera className="size-[1.125rem]" strokeWidth={2} aria-hidden />
              </span>
            </button>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            <div className="mt-4 flex items-center gap-5 text-[0.9375rem]">
              <button type="button" onClick={() => input.current?.click()} className="font-semibold text-brand">
                {photo ? t.profile.changePhoto : t.profile.addPhoto}
              </button>
              {photo && (
                <button type="button" onClick={() => setPhoto("")} className="text-haze">
                  {t.profile.removePhoto}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-haze">{t.profile.photoHint}</p>

            <label className="mt-8 block w-full">
              <span className="mb-2 block px-5 text-[0.9375rem] font-semibold text-haze">{t.profile.nameLabel}</span>
              <input
                value={name}
                onChange={(e) => {
                  setName(e.target.value.slice(0, NAME_MAX));
                  setError("");
                }}
                maxLength={NAME_MAX}
                placeholder={t.profile.namePlaceholder}
                autoComplete="nickname"
                enterKeyHint="done"
                className="h-[3.25rem] w-full rounded-[22px] bg-fg/[0.055] px-4 text-[1.0625rem] outline-none placeholder:text-haze/60 focus:bg-fg/[0.08]"
              />
            </label>

            {!photo && (
              <div className="mt-6 w-full">
                <span className="mb-2 block px-5 text-[0.9375rem] font-semibold text-haze">{t.profile.colourLabel}</span>
                <div role="radiogroup" aria-label={t.profile.colourLabel} className="flex justify-between px-3">
                  {AVATAR_HUES.map((h, i) => (
                    <button
                      key={h}
                      type="button"
                      role="radio"
                      aria-checked={hue === i}
                      aria-label={`${t.profile.colourLabel} ${i + 1}`}
                      onClick={() => setHue(i)}
                      className={cn("size-8 rounded-full transition-transform", hue === i ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-night" : "opacity-85")}
                      style={{ background: `hsl(${h} 65% 58%)` }}
                    />
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p role="alert" className="mt-4 text-sm text-stale">
                {error}
              </p>
            )}
            <div className="flex-1" />
            <button type="submit" className={cn(btn.primary, "mt-10 h-12 w-full text-base")}>
              {t.card.save}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
