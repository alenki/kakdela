"use client";

import { useSyncExternalStore } from "react";
import { sound } from "@/lib/sound";
import { t } from "@/i18n";

/**
 * The bell in the header («С наступающим!», docs/CONVENTIONS.md): it shows what is heard, pressed while the
 * season's music plays («Jingle Bells» on repeat, on by default from the guest's first click or tap). Pressed
 * then, everything stops, and the next visit starts quiet; pressed while quiet, the music plays. Only in the
 * season and with scripts (season.css).
 */
export function SoundToggle() {
  const on = useSyncExternalStore(sound.subscribe, () => sound.on, () => false);
  return (
    <button
      type="button"
      className="hdr-sound"
      aria-pressed={on}
      onClick={() => (on ? sound.disable() : sound.enable())}
    >
      <svg className="hdr-sound__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <g className="hdr-sound__bell">
          <path d="M12 3.6v1.6M6.7 16.2c0-5.8 2.1-9.6 5.3-9.6s5.3 3.8 5.3 9.6M5.2 16.4h13.6" />
          <circle cx="12" cy="18.6" r="1.55" />
        </g>
        <path className="hdr-sound__ring" d="M19.4 6.1c1.2 1.2 1.9 2.8 1.9 4.6M4.6 6.1c-1.2 1.2-1.9 2.8-1.9 4.6" />
      </svg>
      <span className="sr-only">{t.season.sound}</span>
    </button>
  );
}
