import { OrbitControls, Text, useHelper } from "@react-three/drei";
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
import {
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  PointLightHelper,
  Vector3,
} from "three";
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
} from "./constants";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
import Needle from "./Needle";
const Momentum = require("./momentum");
const debounce = require("lodash.debounce");

declare const fxrand: () => number;

const sortRandom = <T,>(array: T[]) =>
  array.sort((a, b) => 0.5 - Math.random());

const pickRandom = <T,>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];

const sortRandomHash = <T,>(array: T[]) => array.sort((a, b) => 0.5 - fxrand());

const pickRandomHash = <T,>(array: T[]) =>
  array[Math.floor(fxrand() * array.length)];

const RING_SEGMENTS = 64;

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
const needleTheme =
  discTheme.theme === "light" ? RING_COLORS[1] : RING_COLORS[0];
const centerTheme =
  discTheme.theme === "light" ? RING_COLORS[0] : RING_COLORS[1];

const bgColor = pickRandomHash(bgTheme.colors);
const discColor = pickRandomHash(discTheme.colors);
const centerColor = pickRandomHash(
  centerTheme.colors.filter((color) => color !== discColor && color !== bgColor)
);
const centerColor2 = pickRandomHash(
  centerTheme.colors.filter((color) => color !== discColor && color !== bgColor)
);
const needleColor = pickRandomHash(discTheme.colors);
// console.log(bgColor, discColor, centerColor, centerColor2);
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
  const material = new MeshStandardMaterial({
    color: "#000000",
    opacity: 0.05,
    transparent: true,
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
              getSizeByAspect(radius, aspect) + 0.05,
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

// const StaticRings = ({ aspect }: { aspect: number }) => {
//   const mesh = useRef<InstancedMesh>();
//   const object = new Object3D();
//   const geometry = useMemo(() => new RingBufferGeometry(), []);
//   const instancedGeometry = new InstancedBufferGeometry()

//   const material = new MeshStandardMaterial({
//     color: "#000000",
//     opacity: 0.05,
//     transparent: true,
//   });
//   const radiuses = useMemo(
//     () => RING_INNER_RADIUS.filter((o, i) => i % 2 !== 0),
//     []
//   );

//   instancedGeometry.instanceCount = radiuses.length

//   useLayoutEffect(() => {
//     radiuses.forEach((radius) => {
//       geometry.parameters = {
//         innerRadius: getSizeByAspect(radius, aspect),
//         outerRadius: getSizeByAspect(radius, aspect) + 0.05,
//         thetaSegments: RING_SEGMENTS,
//         phiSegments: RING_SEGMENTS,
//         thetaStart: 0,
//         thetaLength: Math.PI * 2,
//       };

//       console.log("2", geometry);
//       // geometry.setAttribute( 'position', new BufferAttribute( vertices, 3 ) );
//     });
//   }, [radiuses, geometry, aspect]);

//   return (
//     <instancedMesh
//       ref={mesh}
//       args={[undefined, undefined, radiuses.length]}
//       material={material}
//       // geometry={geometry.current}
//     >
//       {/* <ringBufferGeometry args={[20, 20 + 1, RING_SEGMENTS, RING_SEGMENTS]}>
//       <instancedBufferAttribute />
//       </ringBufferGeometry> */}
//     </instancedMesh>
//   );
// };

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
  // const audioActive = useRef(false);

  let text = useRef("");
  let text2 = useRef("");

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
    console.log("tone initialized");
    // text.current = "tone initialized";
    setTimeout(() => {
      console.log("is playing true");
      // text.current = "tis playing true";
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

  // useEffect(() => {
  //   if (hasInitialInteraction && !toneInitialized) {
  //     initializeTone();
  //   }
  // }, [hasInitialInteraction, toneInitialized, initializeTone]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  // const updatePlaybackRate = useCallback(
  //   debounce((interpolatedRate: number) => {
  //     BEAT.playbackRate = Math.round(interpolatedRate * 100) / 100;
  //     console.log(Math.round(interpolatedRate * 100) / 100);
  //   }, 1),
  //   []
  // );

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
    // text.current = "onrelease";
  }, []);

  const onPress = useCallback(async () => {
    // setHasInitialInteraction(true);
    console.log("onpress");
    await initializeTone();

    isTouchDevice();

    setIsDragging(true);
    // text.current = "onpress";
  }, [initializeTone]);

  useEffect(() => {
    if (!audioActive) {
      return;
    }

    console.log("123123");
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

        console.log("vinyl started");
      }
    }
  }, [isDragging, audioActive, startTransport]);

  useEffect(() => {
    draggableRef.current = new Draggable("#disc", {
      type: "rotation",
      onDrag: onRotation,
      // onMove: onRotation,
      // onDragEnd: () => { text.current = "A"},
      // onDragStart,
      // onDragEnd: () => updateTransport(),
      onThrowUpdate: onRotation,
      // onThrowComplete: () => updateTransport(),
      // onPressInit: onPress as () => void,
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

  const lightRef = useRef();
  useHelper(lightRef, PointLightHelper, 5, "red");

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls />
      {/* <ambientLight intensity={1} /> */}
      <pointLight
        ref={lightRef}
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
            <meshPhongMaterial color={discColor} />
          </mesh>

          {/* <StaticRings aspect={aspect} /> */}

          {/*{rings.map((o, i) => {
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
          })} */}

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
      />
      <Text color="black" anchorX="center" anchorY="middle" fontSize={3}>
        {text.current}
      </Text>
      {/* 
      <Text color="black" anchorX="left" anchorY="middle" fontSize={3}>
        {text2.current}
      </Text> */}
      {/* <EffectComposer>
        <GodRaysEffect innerRadius={getSize(7)} outerRadius={getSize(7.1)} />
      </EffectComposer> */}
    </>
  );
};

gsap.registerPlugin(Draggable, Momentum);

export default Scene;
