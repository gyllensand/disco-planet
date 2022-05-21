import {
  OrbitControls,
  Plane,
  shaderMaterial,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { extend, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { a, useSpring } from "@react-spring/three";
import {
  Color,
  DoubleSide,
  Mesh,
  PointLightHelper,
  ShaderMaterial,
} from "three";
import { start } from "tone";
import { Sample, CHORDS } from "./App";
import { useGesture } from "react-use-gesture";

declare const fxrand: () => number;

const sortRandom = <T,>(array: T[]) =>
  array.sort((a, b) => 0.5 - Math.random());

const pickRandom = <T,>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];

const sortRandomHash = <T,>(array: T[]) => array.sort((a, b) => 0.5 - fxrand());

const pickRandomHash = <T,>(array: T[]) =>
  array[Math.floor(fxrand() * array.length)];

export const RING_SEGMENTS = 128;

export const THETA_START = [
  0,
  0.25,
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
  2.25,
  2.5,
  2.75,
  3,
  3.25,
  3.5,
  3.75,
  4,
  4.25,
  4.5,
  4.75,
  5,
  5.25,
  5.5,
  5.75,
  6,
  Math.PI * 2,
];

export const THETA_LENGTH = [
  1,
  1.25,
  1.5,
  1.75,
  2,
  2.25,
  2.5,
  2.75,
  3,
  3.25,
  3.5,
  3.75,
  4,
  4.25,
  4.5,
  4.75,
  5,
  5.25,
  5.5,
  5.75,
  6,
  Math.PI * 2,
];

export const RING_COUNT = [10, 15, 20, 25];

export const RING_WIDTH = [0.05, 0.05, 0.05, 0.05, 0.1, 0.1, 0.15, 0.2];

export const RING_INNER_RADIUS = [
  2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75,
  6, 6.25, 6.5, 6.75,
];

export const BG_COLORS = [
  {
    theme: "dark",
    colors: [
      "#000000", // black
      "#0b0b4b", // navy
      "#1b3342", // teal
      "#1b4225", // green
      "#421b1b", // burgundy
    ],
  },
  {
    theme: "light",
    colors: [
      "#ffffff", // white
      "#ffd600", // yellow
      "#497fff", // blue
      "#eb3434", // red
      "#ff6aeb", // pink
      "#fe7418", // orange
      "#00f7fb", // turqoise
    ],
  },
];

export const DISC_COLORS = [
  {
    theme: "dark",
    colors: [
      "#000000", // black
      "#0b0b4b", // navy
      "#1b3342", // teal
      "#1b4225", // green
      "#421b1b", // burgundy
    ],
  },
  {
    theme: "light",
    colors: [
      "#ffffff", // white
      "#ffd600", // yellow
      "#497fff", // blue
      "#eb3434", // red
      "#ff6aeb", // pink
      "#fe7418", // orange
      "#00f7fb", // turqoise
    ],
  },
];

export const RING_COLORS = [
  {
    theme: "dark",
    colors: [
      "#000000", // black
      "#004451", // greenblue
      "#111033", // blue
      "#800b0b", // red
      "#053d08", // green
      "#dc0fc0", // pink
      "#aa4807", // orange
      "#75007e", // purple
    ],
  },
  {
    theme: "light",
    colors: [
      "#ffffff", // white
      "#ffd600", // yellow
      "#497fff", // blue
      "#eb3434", // red
      "#30f8a0", // green
      "#ff6aeb", // pink
      "#fe7418", // orange
      "#00f7fb", // turqoise
    ],
  },
];

// notes
// randmoize position of pointlights
// make sure colors are spot on in contrast

interface Ring {
  width: number;
  innerRadius: number;
  color: string;
  thetaStart: number;
  thetaLength: number;
}

const bgTheme = pickRandom(BG_COLORS);
const discTheme = bgTheme.theme === "light" ? DISC_COLORS[0] : DISC_COLORS[1];
const ringTheme = discTheme.theme === "light" ? RING_COLORS[0] : RING_COLORS[1];

const bgColor = pickRandom(bgTheme.colors);
const discColor = pickRandom(discTheme.colors);
const centerColor = pickRandom(ringTheme.colors);
const centerColor2 = pickRandom(ringTheme.colors);
console.log(discColor);
const ringCount = pickRandom(RING_COUNT);
const rings = new Array(ringCount).fill(null).map<Ring>(() => {
  const width = pickRandom(RING_WIDTH);
  const innerRadius = pickRandom(RING_INNER_RADIUS);
  const color = pickRandom(ringTheme.colors);
  const thetaStart = pickRandom(THETA_START);
  const thetaLength = pickRandom(THETA_LENGTH);

  return {
    width,
    innerRadius,
    color,
    thetaStart,
    thetaLength,
  };
});

// @ts-ignore
window.$fxhashFeatures = {
  // pitch,
  // pattern,
  // scale,
  // blur,
  // time,
  // bgColor: bgColor.getHexString(),
  // lineColor1: lineColor1.getHexString(),
  // lineColor2: lineColor2.getHexString(),
};

const Scene = () => {
  const { viewport } = useThree();
  const groupRef = useRef<Mesh>();
  const [toneInitialized, setToneInitialized] = useState(false);
  const [lastPlayedSample, setLastPlayedSample] = useState<Sample>();
  const [isPointerDown, setIsPointerDown] = useState(false);

  const availableChords = useMemo(
    () =>
      CHORDS.filter(({ sampler, index }) => index !== lastPlayedSample?.index),
    [lastPlayedSample]
  );

  const getSize = useCallback(
    (size: number) => (viewport.aspect > 1 ? size : size * viewport.aspect),
    [viewport.aspect]
  );

  const [{ scale }, setScale] = useSpring(() => ({
    scale: [1, 1, 1],
  }));

  const [{ rotation }, setRotation] = useSpring(() => ({
    rotation: [0, 0, 0],
  }));

  const [{ animTime }, setAnimTime] = useSpring(() => ({
    animTime: 0,
  }));

  useEffect(() => {
    console.log(
      "%c * Computer Emotions * ",
      "color: #d80fe7; font-size: 16px; background-color: #000000;"
    );

    CHORDS.forEach(({ sampler }) => sampler.toDestination());
  }, []);

  // useEffect(() => {
  //   if (lastPlayedSample) {
  //     lastPlayedSample.sampler.triggerAttack(pitch);
  //   }
  // }, [lastPlayedSample]);

  useFrame(({ clock }) => {
    if (!isPointerDown) {
      groupRef.current!.rotation.z -= 0.025;
    }
  });

  const initializeTone = useCallback(async () => {
    await start();
    setToneInitialized(true);
  }, []);

  const onClick = useCallback(async () => {
    if (!toneInitialized) {
      await initializeTone();
    }

    const currentSampler = pickRandom(availableChords);
    setLastPlayedSample(currentSampler);
  }, [initializeTone, toneInitialized, availableChords]);

  const bind = useGesture({
    onPointerDown: () => {
      setIsPointerDown(true);
    },
    onPointerUp: () => {
      setIsPointerDown(false);
    },
    onDrag: () => {
      console.log("§12312123");
    },
  });

  const lightRef = useRef();
  useHelper(lightRef, PointLightHelper, 5, "red");

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls />
      <ambientLight intensity={1} />
      {/* <pointLight ref={lightRef} position={[0, 0, -5]} args={["red", 10, 100]} /> */}
      {/* <pointLight position={[10, 3, 5]} args={["white", 1]} />
      <pointLight position={[-10, -3, 5]} args={["white", 1]} /> */}
      {/* <pointLight position={[3, 10, 5]} args={["white", 0.5]} /> */}

      {/*
      // @ts-ignore */}
      <a.group ref={groupRef} {...bind()}>
        <mesh>
          <ringBufferGeometry
            args={[getSize(2), getSize(7), RING_SEGMENTS, RING_SEGMENTS]}
          />
          <meshPhongMaterial color={discColor} />
        </mesh>

        {rings.map((o, i) => {
          return (
            <mesh key={i}>
              <ringBufferGeometry
                args={[
                  getSize(o.innerRadius),
                  getSize(o.innerRadius) + o.width,
                  RING_SEGMENTS,
                  RING_SEGMENTS,
                  o.thetaStart,
                  o.thetaLength,
                ]}
              />
              <meshStandardMaterial color={o.color} />
            </mesh>
          );
        })}

        <mesh>
          <ringBufferGeometry
            args={[
              getSize(0.3),
              getSize(2),
              RING_SEGMENTS,
              RING_SEGMENTS,
              0,
              Math.PI,
            ]}
          />
          <meshStandardMaterial color={centerColor} />
        </mesh>
        <mesh>
          <ringBufferGeometry
            args={[
              getSize(0.3),
              getSize(2),
              RING_SEGMENTS,
              RING_SEGMENTS,
              Math.PI,
              Math.PI,
            ]}
          />
          <meshStandardMaterial color={centerColor2} />
        </mesh>
      </a.group>
    </>
  );
};

export default Scene;
