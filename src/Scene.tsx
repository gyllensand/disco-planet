import {
  GradientTexture,
  OrbitControls,
  Text,
  useHelper,
  useTexture,
} from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { a, useSpring } from "@react-spring/three";
import { MathUtils, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { start, Transport } from "tone";
import { Sample, VINYL_NOISE, BEAT } from "./App";
import { EffectComposer } from "@react-three/postprocessing";
import GodRaysEffect from "./GodRaysEffect";
import {
  RING_COUNT,
  RING_WIDTH,
  RING_INNER_RADIUS,
  THETA_START,
  THETA_LENGTH,
  BG_COLORS,
  DISC_COLORS,
  RING_COLORS,
  RING_COLORS_ALL,
  POINT_LIGHTS,
  RING_STATIC_RADIUS,
  RING_SEGMENTS,
} from "./constants";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
import Needle from "./Needle";
const Momentum = require("./momentum");

declare const fxrand: () => number;

const sortRandom = <T,>(array: T[]) =>
  array.sort((a, b) => 0.5 - Math.random());

const pickRandom = <T,>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];

const sortRandomHash = <T,>(array: T[]) => array.sort((a, b) => 0.5 - fxrand());

const pickRandomHash = <T,>(array: T[]) =>
  array[Math.floor(fxrand() * array.length)];

interface Ring {
  width: number;
  innerRadius: number;
  color: string;
  thetaStart: number;
  thetaLength: number;
}

const range = (x1: number, y1: number, x2: number, y2: number, a: number) =>
  MathUtils.lerp(x2, y2, MathUtils.inverseLerp(x1, y1, a));

const pointLights = pickRandomHash(sortRandom(POINT_LIGHTS));

const bgTheme = pickRandomHash(BG_COLORS);
const discTheme = bgTheme.theme === "light" ? DISC_COLORS[0] : DISC_COLORS[1];
const centerTheme =
  discTheme.theme === "light" ? RING_COLORS[0] : RING_COLORS[1];
const needleTheme = bgTheme.theme === "light" ? BG_COLORS[0] : BG_COLORS[1];

const bgColor = pickRandomHash(bgTheme.colors);
const discColor = pickRandomHash(discTheme.colors);
const centerColor = pickRandomHash(
  centerTheme.colors.filter((color) => color !== discColor && color !== bgColor)
);
const centerColor2 = pickRandomHash(
  centerTheme.colors.filter((color) => color !== discColor && color !== bgColor)
);
const needleColor = pickRandomHash(
  needleTheme.colors.filter((color) => color !== discColor && color !== bgColor)
);

const ringCount = pickRandomHash(RING_COUNT);
const rings = new Array(ringCount).fill(null).map<Ring>(() => {
  const width = pickRandomHash(RING_WIDTH);
  const innerRadius = pickRandomHash(RING_INNER_RADIUS);
  const color = pickRandomHash(RING_COLORS_ALL);
  const thetaStart = pickRandomHash(THETA_START);
  const thetaLength = pickRandomHash(THETA_LENGTH);

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
  ringCount,
  rings,
  // pitch,
  // pattern,
  // scale,
  // blur,
  // time,
  // bgColor: bgColor.getHexString(),
  // lineColor1: lineColor1.getHexString(),
  // lineColor2: lineColor2.getHexString(),
};

export const getSizeByAspect = (size: number, aspect: number) =>
  aspect > 1 ? size : size * aspect;

const StaticRings = ({ aspect }: { aspect: number }) => {
  const color =
    discColor === "#000000"
      ? "#000000"
      : discTheme.theme === "light"
      ? "#ffffff"
      : "#000000";

  const material = new MeshStandardMaterial({
    color,
    // opacity: 0.05,
    // transparent: true,
  });
  const radiuses = useMemo(
    () => RING_STATIC_RADIUS.filter((o, i) => i % 2 !== 0),
    []
  );

  return (
    <>
      {radiuses.map((radius, i) => (
        <mesh key={i} material={material}>
          <ringBufferGeometry
            args={[
              getSizeByAspect(radius, aspect),
              getSizeByAspect(radius, aspect) + getSizeByAspect(0.01, aspect),
              RING_SEGMENTS,
              RING_SEGMENTS,
              0,
              Math.PI * 2,
            ]}
          />
        </mesh>
      ))}
    </>
  );
};

const DynamicRings = ({ aspect }: { aspect: number }) => {
  return (
    <>
      {rings.map((ring, i) => (
        <mesh key={i}>
          <ringBufferGeometry
            args={[
              getSizeByAspect(ring.innerRadius, aspect),
              getSizeByAspect(ring.innerRadius, aspect) +
                getSizeByAspect(ring.width, aspect),
              RING_SEGMENTS,
              RING_SEGMENTS,
              ring.thetaStart,
              ring.thetaLength,
            ]}
          />
          <meshStandardMaterial color={ring.color} />
        </mesh>
      ))}
    </>
  );
};

function isTouchDevice() {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore
    navigator.msMaxTouchPoints > 0
  );
}

const Scene = () => {
  const { aspect } = useThree((state) => ({
    aspect: state.viewport.aspect,
  }));
  const outerGroupRef = useRef<Mesh>();
  const groupRef = useRef<Mesh>();
  const draggableRef = useRef<Draggable>();

  const [isDragging, setIsDragging] = useState(false);
  const toneInitialized = useRef(false);
  const [audioActive, setAudioActive] = useState(false);

  let text = useRef("");

  Transport.timeSignature = [4, 4];
  Transport.bpm.value = 135;
  Transport.loop = true;
  Transport.loopStart = 0;
  Transport.loopEnd = "8m";

  const initializeTone = useCallback(async () => {
    if (toneInitialized.current) {
      return;
    }

    await start();
    toneInitialized.current = true;

    setTimeout(() => {
      setAudioActive(true);
    }, 1000);
  }, []);

  const startTransport = useCallback(() => {
    if (Transport.state === "stopped") {
      console.log("start transport");
      Transport.start("+2");
      BEAT.volume.value = -10;
      BEAT.start(0);
    }
  }, []);

  const resumeTransport = useCallback(() => {
    if (Transport.state === "paused") {
      console.log("resume transport");
      Transport.start("+0.1");
    }
  }, []);

  const stopTransport = useCallback(() => {
    if (Transport.state === "started") {
      console.log("stop transport");
      Transport.stop(0);
    }
  }, []);

  useFrame(() => {
    if (!isDragging) {
      outerGroupRef.current!.rotation.z -= 0.025;
    }
  });

  useEffect(() => {
    VINYL_NOISE.toDestination();
    BEAT.toDestination().sync();
  }, []);

  const onRotation = useCallback(() => {
    if (!groupRef.current || !draggableRef.current) {
      return;
    }

    const interpolatedRate = MathUtils.clamp(
      range(-10, 10, 0, 2, draggableRef.current.deltaX),
      0.3,
      2
    );

    if (Transport.state === "started") {
      BEAT.playbackRate = Math.round(interpolatedRate * 100) / 100;
    }

    groupRef.current.rotation.z = -draggableRef.current.rotation / 50;
  }, []);

  const onRelease = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onPress = useCallback(() => {
    initializeTone();
    setIsDragging(true);
  }, [initializeTone]);

  useEffect(() => {
    if (!audioActive) {
      return;
    }

    if (isDragging) {
      if (VINYL_NOISE.state === "started") {
        VINYL_NOISE.volume.value = -999;
      }
    } else {
      VINYL_NOISE.volume.value = -10;

      if (VINYL_NOISE.state === "stopped") {
        VINYL_NOISE.loop = true;
        VINYL_NOISE.start("+0.1");

        startTransport();
      }
    }
  }, [isDragging, audioActive, startTransport]);

  useEffect(() => {
    draggableRef.current = new Draggable("#disc", {
      type: "rotation",
      onDrag: onRotation,
      onThrowUpdate: onRotation,
      onRelease,
      onPress: onPress as () => void,
      trigger: "#disc",
      inertia: true,
      cursor: "grab",
      activeCursor: "grabbing",
    });
  }, [onRotation, onPress, onRelease]);

  const getSize = useCallback(
    (size: number) => getSizeByAspect(size, aspect),
    [aspect]
  );

  // const lightRef = useRef();
  // useHelper(lightRef, PointLightHelper, 5, "red");

  const texture = useTexture(
    `${process.env.PUBLIC_URL}/texture/grain-texture.jpeg`
  );

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls />

      <pointLight
        position={pointLights[0].map((o) => getSize(o)) as unknown as Vector3}
        args={["#ffffff", 1]}
      />
      <pointLight
        position={pointLights[1].map((o) => getSize(o)) as unknown as Vector3}
        args={["#ffffff", 1]}
      />

      <group ref={outerGroupRef}>
        <group ref={groupRef}>
          <mesh>
            <ringBufferGeometry
              args={[getSize(2), getSize(7), RING_SEGMENTS, RING_SEGMENTS]}
            />
            <meshPhongMaterial color={discColor}>
              {/* <GradientTexture
                stops={[0, 1]}
                colors={[discColor, discColor2]}
                size={1024}
              /> */}
            </meshPhongMaterial>
          </mesh>

          {/* <StaticRings aspect={aspect} /> */}

          <DynamicRings aspect={aspect} />

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
        </group>
      </group>
      <Needle
        getSize={getSize}
        isActive={toneInitialized.current}
        color={needleColor}
        secondColor={bgColor}
      />
      {/* <Text color="black" anchorX="center" anchorY="middle" fontSize={3}>
        {text.current}
      </Text> */}

      {/* <EffectComposer>
        <GodRaysEffect
          aspect={aspect}
          innerRadius={getSize(7)}
          outerRadius={getSize(7.1)}
        />
      </EffectComposer> */}
    </>
  );
};

gsap.registerPlugin(Draggable, Momentum);

export default Scene;
