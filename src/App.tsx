import { Suspense, useCallback, useState } from "react";
import { Canvas } from "@react-three/fiber";
import Scene from "./Scene";
import { Vector3 } from "three";
import { Loop, Player, Sampler, start } from "tone";
import DiscElement from "./DiscElement";
import AudioEnergy from "./AudioEnergy";

console.log(
  "%c * Computer Emotions * ",
  "color: #d80fe7; font-size: 16px; background-color: #000000;"
);

export interface Sample {
  index: number;
  sampler: Sampler;
}

const baseUrl = `${process.env.PUBLIC_URL}/audio/`;

export const SCRATCH: Sample[] = [
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-1.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-2.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-3.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-4.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-5.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-6.mp3",
      },
      baseUrl,
    }),
  },
  {
    index: 0,
    sampler: new Sampler({
      urls: {
        1: "scratch-short-1.mp3",
      },
      baseUrl,
    }),
  },
];

export const VINYL_NOISE = new Player({
  url: `${baseUrl}vinyl-noise.mp3`,
});

export const DRUMS = new Player({
  url: `${baseUrl}drums.mp3`,
});

export const INSTRUMENTS = new Player({
  url: `${baseUrl}instruments.mp3`,
});

export const analyser = new AudioEnergy();

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
