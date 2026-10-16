"use client";

import { Camera, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/settings-ui";
import { btn } from "@/components/ui/buttons";
import { useT } from "@/lib/i18n";
import { checkFields } from "@/lib/moderation";
import { AVATAR_HUES, NAME_MAX, saveProfile, tidyName } from "@/lib/profile";
import { useSettings } from "@/lib/settings";
import { cn } from "@/lib/utils";

const VIEW = 272; // the round window you move the picture inside, in px
const OUT = 360; // the saved picture's size, in px

/** Choose which part of a picture to keep: drag to move, pinch or slide to zoom. */
function Cropper({ file, onDone, onCancel }: { file: File; onDone: (dataUrl: string) => void; onCancel: () => void }) {
  const { t } = useT();
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [bad, setBad] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ zoom: 1, dist: 0, pos: { x: 0, y: 0 } });

  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => setBad(true);
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // The picture always covers the window: no empty edge inside the circle.
  const base = img ? VIEW / Math.min(img.naturalWidth, img.naturalHeight) : 1;
  const scale = base * zoom;
  const limit = (v: { x: number; y: number }, z = zoom) => {
    if (!img) return v;
    const mx = Math.max(0, (img.naturalWidth * base * z - VIEW) / 2);
    const my = Math.max(0, (img.naturalHeight * base * z - VIEW) / 2);
    return { x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
  };
  const zoomTo = (z: number) => {
    const next = Math.min(4, Math.max(1, z));
    setZoom(next);
    setPos((p) => limit(p, next));
  };

  const down = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    gesture.current = { zoom, dist: 0, pos };
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current.dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
    }
  };
  const move = (e: React.PointerEvent) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    if (pointers.current.size === 2) {
      pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a!.x - b!.x, a!.y - b!.y);
      if (gesture.current.dist) zoomTo(gesture.current.zoom * (dist / gesture.current.dist));
      return;
    }
    setPos((p) => limit({ x: p.x + e.clientX - prev.x, y: p.y + e.clientY - prev.y }));
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  };
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    gesture.current = { zoom, dist: 0, pos };
  };

  const save = () => {
    if (!img) return;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = OUT;
    const ctx = canvas.getContext("2d");
    if (!ctx) return onCancel();
    const k = OUT / VIEW;
    const w = img.naturalWidth * scale * k;
    const h = img.naturalHeight * scale * k;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, OUT, OUT);
    ctx.drawImage(img, OUT / 2 + pos.x * k - w / 2, OUT / 2 + pos.y * k - h / 2, w, h);
    onDone(canvas.toDataURL("image/jpeg", 0.86));
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-sm text-haze">{t.profile.photoTitle}</p>
      {bad ? (
        <p role="alert" className="text-sm text-stale">
          {t.profile.photoBad}
        </p>
      ) : (
        <div
          className="relative touch-none overflow-hidden rounded-full bg-black ring-1 ring-white/15"
          style={{ width: VIEW, height: VIEW }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onWheel={(e) => zoomTo(zoom - e.deltaY / 400)}
        >
          {img && (
            // eslint-disable-next-line @next/next/no-img-element -- the picture being cropped, from this phone
            <img
              src={img.src}
              alt=""
              draggable={false}
              className="absolute top-1/2 left-1/2 max-w-none select-none"
              style={{ width: img.naturalWidth, height: img.naturalHeight, transform: `translate(-50%, -50%) translate(${pos.x}px, ${pos.y}px) scale(${scale})` }}
            />
          )}
        </div>
      )}
      <label className="flex w-full max-w-[272px] items-center gap-3 text-sm text-haze">
        <span className="shrink-0">{t.profile.photoZoom}</span>
        <input type="range" min={1} max={4} step={0.01} value={zoom} onChange={(e) => zoomTo(Number(e.target.value))} className="h-8 w-full accent-[var(--good)]" />
      </label>
      <div className="flex w-full max-w-[272px] gap-2">
        <button type="button" onClick={onCancel} className={cn(btn.quiet, btn.md, "flex-1")}>
          {t.card.cancel}
        </button>
        <button type="button" onClick={save} disabled={!img} className={cn(btn.primary, btn.md, "flex-1")}>
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
    if (!f.type.startsWith("image/") || f.size > 25 * 1024 * 1024) return setError(t.profile.photoBad);
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
          <button type="button" onClick={onClose} aria-label={t.card.cancel} className="-ml-2.5 grid size-11 place-items-center rounded-full text-ink/80 active:bg-white/10">
            <X className="size-[1.375rem]" strokeWidth={1.75} aria-hidden />
          </button>
          <h2 className="flex-1 text-center text-[1.0625rem] font-semibold">{t.profile.profileTitle}</h2>
          <span className="size-11" />
        </div>

        {file ? (
          <div className="mt-8">
            <Cropper
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
              <span className="absolute right-0 bottom-0 grid size-10 place-items-center rounded-full bg-ink text-night shadow-[0_2px_10px_rgb(0_0_0/0.5)] ring-4 ring-black">
                <Camera className="size-[1.125rem]" strokeWidth={2} aria-hidden />
              </span>
            </button>
            <input ref={input} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ""; }} />
            <div className="mt-4 flex items-center gap-5 text-[0.9375rem]">
              <button type="button" onClick={() => input.current?.click()} className="font-semibold text-good">
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
              <span className="mb-1.5 block px-4 text-[0.75rem] font-semibold tracking-[0.06em] text-haze uppercase">{t.profile.nameLabel}</span>
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
                className="h-12 w-full rounded-[14px] bg-white/[0.05] px-4 text-[1.0625rem] outline-none placeholder:text-haze/60 focus:bg-white/[0.08]"
              />
            </label>

            {!photo && (
              <div className="mt-6 w-full">
                <span className="mb-2 block px-4 text-[0.75rem] font-semibold tracking-[0.06em] text-haze uppercase">{t.profile.colourLabel}</span>
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
