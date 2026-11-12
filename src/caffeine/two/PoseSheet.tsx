/** OWNER: motion2d agent. QA helper: all Student poses over the ExamHall plus a caption sample. */
import { AbsoluteFill } from "remotion";
import { useSeconds } from "../../kit/time";
import { ExamHall } from "./ExamHall";
import { Student, type StudentPose } from "./Student";

const POSES: StudentPose[] = ["study", "nodding", "yawn", "awake-tired", "headache"];

export const PoseSheet: React.FC<{ readonly offset?: number }> = ({ offset = 0 }) => {
  const t = useSeconds() + offset;
  return (
    <AbsoluteFill>
      <ExamHall t={t} />
      {POSES.map((p, i) => (
        <Student key={p} t={t} pose={p} poseAt={0} width={400} style={{ position: "absolute", left: (i % 2) * 520 + 60, top: Math.floor(i / 2) * 560 + 60 }} />
      ))}
    </AbsoluteFill>
  );
};
