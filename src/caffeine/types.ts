/** Sound effects available in public/sfx/caffeine/<name>.wav (made by scripts/make_audio_caffeine.py). */
export const SFX_NAMES = [
  "whoosh_soft",
  "whoosh_fast",
  "pop",
  "click_lock",
  "clink",
  "tick",
  "tick_fast",
  "thud_low",
  "ding",
  "paper",
  "riser",
  "lamp_click",
  "dive",
  "zoom_in",
  "dock_amber",
  "bubble_rise",
  "bounce_deny",
  "power_down",
  "timer_wind",
  "liquid_drop",
  "release_pluck",
  "chime_store",
  "rewind",
  "heartbeat_ache",
  "ding_2",
  "ding_3",
  "clock_wind",
] as const;

export type SfxName = (typeof SFX_NAMES)[number];

/** A sound cue at shot-local seconds. Keep them sparse: about one per 2–3 s at most. */
export type Cue = { readonly at: number; readonly sfx: SfxName; readonly volume?: number };
