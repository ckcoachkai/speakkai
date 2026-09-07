import { Composition } from "remotion";
import { PointExampleCheck } from "./PointExampleCheck";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="PointExampleCheckEN" component={PointExampleCheck} durationInFrames={540} fps={30} width={1080} height={1080} defaultProps={{chinese:false}} />
      <Composition id="PointExampleCheckZH" component={PointExampleCheck} durationInFrames={540} fps={30} width={1080} height={1080} defaultProps={{chinese:true}} />
    </>
  );
};
