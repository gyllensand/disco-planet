import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { Vector3 } from "three";
import { Player } from "tone";
import DiscElement from "./DiscElement";
import AudioEnergy from "./AudioEnergy";

console.log(
  "%c * Computer Emotions * ",
  "color: #d80fe7; font-size: 16px; background-color: #000000;"
);

const baseUrl = `${process.env.PUBLIC_URL}/audio/`;
export const analyser = new AudioEnergy();

export const VINYL_NOISE = new Player({
  url: `${baseUrl}vinyl-noise.mp3`,
});

export const DRUMS = new Player({
  url: `${baseUrl}drums.mp3`,
});

export const INSTRUMENTS = new Player({
  url: `${baseUrl}instruments.mp3`,
});

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
