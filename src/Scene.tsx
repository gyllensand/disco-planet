import { OrbitControls, useHelper } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { a, useSpring } from "@react-spring/three";
import {
  Color,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  PointLightHelper,
  RingBufferGeometry,
  RingGeometry,
  ShaderMaterial,
  Vector3,
} from "three";
import { Loop, start, Transport } from "tone";
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
} from "./constants";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
const Momentum = require("./momentum");

declare const fxrand: () => number;

const sortRandom = <T,>(array: T[]) =>
  array.sort((a, b) => 0.5 - Math.random());

const pickRandom = <T,>(array: T[]) =>
  array[Math.floor(Math.random() * array.length)];

const sortRandomHash = <T,>(array: T[]) => array.sort((a, b) => 0.5 - fxrand());

const pickRandomHash = <T,>(array: T[]) =>
  array[Math.floor(fxrand() * array.length)];

export const RING_SEGMENTS = 128;

interface Ring {
  width: number;
  innerRadius: number;
  color: string;
  thetaStart: number;
  thetaLength: number;
}

const pointLights = pickRandomHash(sortRandom(POINT_LIGHTS));

const bgTheme = pickRandomHash(BG_COLORS);
const discTheme = bgTheme.theme === "light" ? DISC_COLORS[0] : DISC_COLORS[1];
const ringTheme = discTheme.theme === "light" ? RING_COLORS[0] : RING_COLORS[1];
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

const getSize = (size: number, aspect: number) =>
  aspect > 1 ? size : size * aspect;

// const Rings = ({ aspect }: { aspect: number }) => {
//   const mesh = useRef<InstancedMesh>();
//   const object = useRef(new Object3D<RingBufferGeometry>());
//   const geometry = useRef(new RingBufferGeometry());

//   const radiuses = useMemo(
//     () => RING_INNER_RADIUS.filter((o, i) => i % 2 === 0),
//     []
//   );

//   // useEffect(() => {
//   //   for (let i = 0; i < ringCount; i++) {
//   //     // temp.position.set(Math.random(), Math.random(), Math.random());
//   //     // temp.updateMatrix();
//   //     // ref.current.setMatrixAt(id, temp.matrix);
//   //     // @ts-ignore
//   //     // mesh.current!.material.

//   //     mesh.current!.geometry.attributes.color = rings[i].color;
//   //   }

//   //   mesh.current!.instanceMatrix.needsUpdate = true;
//   // }, []);

//   useEffect(() => {
//     radiuses.forEach((radius) => {
//       // console.log(mesh.current!.geometry.attributes)
//       geometry.current.parameters = {
//         innerRadius: getSize(radius, aspect),
//         outerRadius: getSize(radius + 0.05, aspect),
//         thetaSegments: RING_SEGMENTS,
//         phiSegments: RING_SEGMENTS,
//         thetaStart: 0,
//         thetaLength: Math.PI * 2,
//       };

//       console.log(object.current)

//       mesh.current!.geometry = geometry.current
//       mesh.current!.instanceMatrix.needsUpdate = true;
//       // console.log(geometry);
//     });
//   }, [radiuses, aspect]);

//   // {RING_INNER_RADIUS.map(
//   //   (radius, i) =>
//   //     i % 2 === 0 && (
//   //       <mesh key={i}>
//   //         <ringBufferGeometry
//   //           args={[
//   //             getSize(radius),
//   //             getSize(radius) + 0.05,
//   //             RING_SEGMENTS,
//   //             RING_SEGMENTS,
//   //           ]}
//   //         />
//   //         <meshStandardMaterial
//   //           color={"#000000"}
//   //           opacity={0.05}
//   //           transparent
//   //         />
//   //       </mesh>
//   //     )
//   // )}

//   return (
//     <instancedMesh
//       ref={mesh}
//       args={[undefined, undefined, radiuses.length]}
//       geometry={geometry.current}
//     >
//       {/* <ringBufferGeometry args={[20, 20 + 1, RING_SEGMENTS, RING_SEGMENTS]} /> */}
//       <meshStandardMaterial color={"#000000"} opacity={0.05} transparent />
//     </instancedMesh>
//   );
// };

const StaticRings = ({ aspect }: { aspect: number }) => {
  const material = new MeshStandardMaterial({
    color: "#000000",
    opacity: 0.05,
    transparent: true,
  });
  const radiuses = useMemo(
    () => RING_INNER_RADIUS.filter((o, i) => i % 2 !== 0),
    []
  );

  return (
    <>
      {radiuses.map((radius, i) => (
        <mesh key={i} material={material}>
          <ringBufferGeometry
            args={[
              getSize(radius, aspect),
              getSize(radius, aspect) + 0.05,
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

const Scene = () => {
  const { viewport } = useThree((state) => ({
    viewport: state.viewport,
  }));
  const outerGroupRef = useRef<Mesh>();
  const groupRef = useRef<Mesh>();
  const draggableRef = useRef<Draggable>();

  const discElement = useMemo(() => document.getElementById("disc"), []);
  const [isDragging, setIsDragging] = useState(false);
  const [toneInitialized, setToneInitialized] = useState(false);

  Transport.timeSignature = [4, 4];
  Transport.bpm.value = 135;
  Transport.loop = true;
  Transport.loopStart = 0;
  Transport.loopEnd = "8m";

  const getSize = useCallback(
    (size: number) => (viewport.aspect > 1 ? size : size * viewport.aspect),
    [viewport.aspect]
  );

  useEffect(() => {
    console.log(
      "%c * Computer Emotions * ",
      "color: #d80fe7; font-size: 16px; background-color: #000000;"
    );

    // AUDIO.forEach(({ player }) => player.toDestination().sync());
    VINYL_NOISE.toDestination().sync();
    BEAT.toDestination().sync();
  }, []);

  useFrame(() => {
    if (!isDragging) {
      outerGroupRef.current!.rotation.z -= 0.025;
    }
  });

  const initializeTone = useCallback(async () => {
    await start();
    setToneInitialized(true);
  }, []);

  const getRotationDegrees = useCallback((element: HTMLElement | null) => {
    if (!element) {
      return 0;
    }

    const st = window.getComputedStyle(element, null);
    const tm =
      st.getPropertyValue("-webkit-transform") ||
      st.getPropertyValue("-moz-transform") ||
      st.getPropertyValue("-ms-transform") ||
      st.getPropertyValue("-o-transform") ||
      st.getPropertyValue("transform") ||
      "none";

    if (tm !== "none") {
      if (!element) {
        return 0;
      }

      const string = element?.style.transform.split("(")[2];
      const value = parseFloat(string.slice(0, string.length - 4));

      return value;
    }
    return 0;
  }, []);

  const onRotation = useCallback(
    (state: any) => {
      const velocity =
        Math.abs(state.movementX) > Math.abs(state.movementY)
          ? Math.abs(state.movementX)
          : Math.abs(state.movementY);

      console.log(velocity);

      groupRef.current!.rotation.z = -getRotationDegrees(discElement) / 50;
    },
    [getRotationDegrees, discElement]
  );

  const onRelease = useCallback(() => {
    setIsDragging(false);
  }, []);

  const onPress = useCallback(async () => {
    if (!toneInitialized) {
      await initializeTone();
    }

    if (!isDragging) {
      setIsDragging(true);
    }

    groupRef.current!.rotation.z = -getRotationDegrees(discElement) / 50;
  }, [
    initializeTone,
    toneInitialized,
    discElement,
    getRotationDegrees,
    isDragging,
  ]);

  useEffect(() => {
    // switch (Transport.state) {
    //   case "started":
    //     if (!isPlaying || isDragging) {
    //       Transport.pause();
    //     }
    //     break;

    //   case "paused":
    //     Transport.start();
    //     break;

    //   case "stopped":
    //     if (isPlaying && !isDragging) {
    //       Transport.start("+0.1");
    //     }
    //     break;
    // }

    if (!toneInitialized) {
      return;
    }

    if (isDragging) {
      if (VINYL_NOISE.state === "started") {
        VINYL_NOISE.volume.value = -999;
      }
      return;
    }

    if (Transport.state === "stopped") {
      Transport.start("+0.1");
      // AUDIO[1].player.volume.value = -10;
      // AUDIO[1].player.start(0);
    }

    // if (Transport.state === "paused") {
    //   Transport.start()
    // }

    if (VINYL_NOISE.state === "stopped") {
      VINYL_NOISE.volume.value = -10;
      VINYL_NOISE.loop = true;
      VINYL_NOISE.start(0);
    } else {
      VINYL_NOISE.volume.value = -10;
    }
  }, [toneInitialized, isDragging]);

  useEffect(() => {
    if (draggableRef.current) {
      return;
    }

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
      dragClickables: true,
    });
  }, [onRotation, onPress, onRelease]);

  // const lightRef = useRef();
  // useHelper(lightRef, PointLightHelper, 5, "red");

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls enabled={false} />
      {/* <ambientLight intensity={1} /> */}
      <pointLight
        position={pointLights[0] as unknown as Vector3}
        args={["#ffffff", 1]}
      />
      <pointLight
        position={pointLights[1] as unknown as Vector3}
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

          {/* <StaticRings aspect={viewport.aspect} />

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
      {/* <EffectComposer>
        <GodRaysEffect innerRadius={getSize(7)} outerRadius={getSize(7.1)} />
      </EffectComposer> */}
    </>
  );
};

gsap.registerPlugin(Draggable, Momentum);

export default Scene;
