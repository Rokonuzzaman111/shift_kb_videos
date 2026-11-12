import { AbsoluteFill } from "remotion";
import { K, headFont } from "./theme";

/** Temporary stand-in used by scaffolding until a shot/component is built. */
export const Placeholder: React.FC<{ readonly label: string }> = ({ label }) => (
  <AbsoluteFill style={{ background: K.bg2, justifyContent: "center", alignItems: "center" }}>
    <div style={{ fontFamily: headFont, fontSize: 70, color: K.muted }}>{label}</div>
  </AbsoluteFill>
);
