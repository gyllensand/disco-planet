import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { Vector3 } from "three";
import { Loop, Player, Sampler } from "tone";
import DiscElement from "./DiscElement";

export interface Sample {
  index: number;
  sampler: Sampler;
}

const baseUrl = `${process.env.PUBLIC_URL}/audio/`;

// export const CHORDS: Sample[] = [
//   {
//     index: 0,
//     sampler: new Sampler({
//       urls: {
//         1: "chord_1.mp3",
//       },
//       baseUrl,
//     }),
//   },
// ];

export const VINYL_NOISE = new Player({
  url: `${baseUrl}vinyl-noise.mp3`,
});

export const BEAT = new Player({
  url: `${baseUrl}pad.mp3`,
});

// export const AUDIO = [
//   {
//     index: 0,
//     name: "vinylNoise",
//     player: new Player({
//       url: `${baseUrl}vinyl-noise.mp3`,
//     }),
//   },
//   {
//     index: 1,
//     name: "beat",
//     player: new Player({
//       url: `${baseUrl}pad.mp3`,
//     }),
//   },
// ];

const App = () => {
  return (
    <>
      <Canvas
        dpr={window.devicePixelRatio}
        camera={{ position: new Vector3(0, 0, 10) }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
      <DiscElement />
    </>
  );
};

export default App;
