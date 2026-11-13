/** Scene spans on the final timeline, seconds [from, to) (OWNER: lead). Agents never edit this file. */
export const SCENE_SPANS: Record<string, [number, number]> = {
  H1: [0, 26.7], // hook
  P1: [26.7, 61.6], // CPU vs GPU, games → AI, 75–90% share
  P2: [61.6, 110.6], // 1993 founding, 1996 near-bankruptcy, 1999 GPU / 2006 CUDA / 2012 AlexNet, 2022 ChatGPT rush
  P3: [110.6, 144.5], // how big: $96B quarter, $5.8T ≈ 11× Bangladesh GDP, Vera Rubin, demand > supply
  P4: [144.5, 184.6], // Jensen Huang profile, leather jacket, famous quote
  P5: [184.6, 254.6], // SENSITIVE: Nov 8 letter, investigation, allegation unproven, denials
  P6: [254.6, 294.6], // Nov 12 resignation, Kress interim, stock −13% → −4%, −$1.6T, Congress
  P7: [294.6, 346.8], // future: strengths ($108B, +70%), four risks, Nov 17 test
  P8: [346.8, 384.5], // what it means for Bangladesh, lesson, outro CTA
};
