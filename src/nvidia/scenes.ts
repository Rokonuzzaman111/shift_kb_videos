/** Scene spans on the final timeline, seconds [from, to) (OWNER: lead). Agents never edit this file. */
export const SCENE_SPANS: Record<string, [number, number]> = {
  H1: [0, 26.05], // hook (ends in the pause after "শুরু থেকে বলি")
  P1: [26.05, 65.86], // CPU vs GPU, games → AI, 75–90% share
  P2: [65.86, 118.87], // 1993 founding, 1996 near-bankruptcy, 1999 GPU / 2006 CUDA / 2012 AlexNet, 2022 ChatGPT rush
  P3: [118.87, 142.8], // how big: $96B quarter, $5.8T ≈ 11× Bangladesh GDP, Vera Rubin, demand > supply
  P4: [142.8, 182.9], // Jensen Huang profile, leather jacket, famous quote
  P5: [182.9, 252.9], // SENSITIVE: Nov 8 letter, investigation, allegation unproven, denials
  P6: [252.9, 292.9], // Nov 12 resignation, Kress interim, stock −13% → −4%, −$1.6T, Congress
  P7: [292.9, 345.1], // future: strengths ($108B, +70%), four risks, Nov 17 test
  P8: [345.1, 382.8], // what it means for Bangladesh, lesson, outro CTA
};
