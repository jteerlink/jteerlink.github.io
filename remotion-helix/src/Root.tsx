import "./index.css";
import { Composition, CalculateMetadataFunction } from "remotion";
import { HelixComposition } from "./HelixComposition";

// Default the export to a browser-friendly transparent WebM (VP9).
const calculateMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = async () => {
  return {
    defaultCodec: "vp8",
    defaultVideoImageFormat: "png",
    defaultPixelFormat: "yuva420p",
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Helix"
        component={HelixComposition}
        durationInFrames={180}
        fps={30}
        width={1920}
        height={1080}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
