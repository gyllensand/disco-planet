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
  InstancedMesh,
  Mesh,
  PointLightHelper,
  ShaderMaterial,
} from "three";
import { start } from "tone";
import { Sample, CHORDS } from "./App";
import { useGesture } from "react-use-gesture";
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
} from "./constants";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
const InertiaPlugin = require("./momentum");

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

// const Rings = () => {
//   const mesh = useRef<InstancedMesh>();
//   useEffect(() => {
//     for (let i = 0; i < ringCount; i++) {
//       // temp.position.set(Math.random(), Math.random(), Math.random());
//       // temp.updateMatrix();
//       // ref.current.setMatrixAt(id, temp.matrix);
//       // @ts-ignore
//       // mesh.current!.material.

//       mesh.current!.geometry.attributes.color = rings[i].color;
//     }

//     mesh.current!.instanceMatrix.needsUpdate = true;
//   }, []);

//   return (
//     <instancedMesh ref={mesh} args={[undefined, undefined, ringCount]}>
//       <ringBufferGeometry args={[20, 20 + 1, RING_SEGMENTS, RING_SEGMENTS]}>
//         <instancedBufferAttribute
//           attach="attributes-color"
//           args={[colorArray, 3]}
//         />
//       </ringBufferGeometry>
//       <meshStandardMaterial color={o.color} />
//     </instancedMesh>
//   );
// };

const Scene = () => {
  const { size, viewport } = useThree((state) => ({
    size: state.size,
    viewport: state.viewport,
  }));
  const { getCurrentViewport } = viewport;
  const aspect = useMemo(
    () => size.width / getCurrentViewport().width,
    [size, getCurrentViewport]
  );
  const lastRotation = useRef(0);
  const lastPosY = useRef(0);
  const lastPosX = useRef(0);
  const outerGroupRef = useRef<Mesh>();
  const groupRef = useRef<Mesh>();
  const isDragging = useRef(false);
  const [toneInitialized, setToneInitialized] = useState(false);
  const [lastPlayedSample, setLastPlayedSample] = useState<Sample>();

  const [isVerticalRight, setIsVerticalRight] = useState(false);
  const [isHorizontalBottom, setIsHorizontalBottom] = useState(false);
  const [hasInitializedTouch, setHasInitializedTouch] = useState(false);

  const availableChords = useMemo(
    () =>
      CHORDS.filter(({ sampler, index }) => index !== lastPlayedSample?.index),
    [lastPlayedSample]
  );

  const getSize = useCallback(
    (size: number) => (viewport.aspect > 1 ? size : size * viewport.aspect),
    [viewport.aspect]
  );

  const [{ rotation }, setRotation] = useSpring(() => ({
    rotation: [0, 0, 0],
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

  useFrame(() => {
    if (!isDragging.current) {
      outerGroupRef.current!.rotation.z -= 0.025;
    }
  });

  const initializeTone = useCallback(async () => {
    await start();
    setToneInitialized(true);
  }, []);

  const getRotationDegrees = useCallback((element: HTMLElement) => {
    var st = window.getComputedStyle(element, null);
    var tm =
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
    ({ type }) => {
      const element = document.getElementById("disc");
      if (!element) {
        return;
      }

      if (!isDragging.current && type === "pointermove") {
        isDragging.current = true;
      } else if (isDragging.current && type === "pointerup") {
        isDragging.current = false;
      }

      groupRef.current!.rotation.z = -getRotationDegrees(element) / 50;
    },
    [getRotationDegrees]
  );

  useEffect(() => {
    new Draggable("#disc", {
      type: "rotation",
      onDrag: onRotation,
      onThrowUpdate: onRotation,
      trigger: "#disc",
      inertia: true,
      cursor: "default",
      activeCursor: "grabbing",
    });
  }, [onRotation]);

  const onClick = useCallback(async () => {
    if (!toneInitialized) {
      await initializeTone();
    }

    const currentSampler = pickRandom(availableChords);
    setLastPlayedSample(currentSampler);
  }, [initializeTone, toneInitialized, availableChords]);

  const bind = useGesture(
    {
      // onPointerDown: () => {
      //   console.log("onPointerDown");
      //   setIsPointerDown(true);
      // },
      // onPointerUp: () => {
      //   setIsPointerDown(false);
      //   console.log("onPointerUp");
      // },
      onDrag: ({
        movement: [x, y],
        offset,
        down,
        xy,
        moving,
        first,
        last,
        initial,
        touches,
        tap,
        lastOffset,
      }) => {
        // if(first || last || tap || touches > 1) {
        //   return
        // }
        // console.log(lastOffset)

        // if (first) {
        //   console.log(
        //     "FIRST",
        //     "\n",
        //     "offset y",
        //     offset[1],
        //     "\n",
        //     "offset x",
        //     offset[0]
        //   );
        // }

        // if (first) {
        //   console.log("FIRST", "\n", "y", y, "\n", "x", x);
        // }

        // if(!hasInitializedTouch) {
        //   return
        // }
        // console.log("lastRotation before", lastRotation.current);
        if (xy[0] > size.width / 2 && !isVerticalRight) {
          lastRotation.current = lastRotation.current + y;
          console.log("1 y", lastRotation.current + y);
          setIsVerticalRight(true);
        } else if (xy[0] < size.width / 2 && isVerticalRight) {
          console.log("2 y", lastRotation.current - y);
          lastRotation.current = lastRotation.current - y;
          setIsVerticalRight(false);
        }

        if (xy[1] > size.height / 2 && isHorizontalBottom) {
          console.log("3 x", lastRotation.current - x);
          lastRotation.current = lastRotation.current - x;
          setIsHorizontalBottom(false);
        } else if (xy[1] < size.height / 2 && !isHorizontalBottom) {
          console.log("4 x", lastRotation.current + x);
          lastRotation.current = lastRotation.current + x;
          setIsHorizontalBottom(true);
        }

        // if(first) {
        //   return
        // }

        const posY = xy[0] > size.width / 2 ? -y : y;
        const posX = xy[1] > size.height / 2 ? x : -x;
        const rotZ = (posY + posX + lastRotation.current * 2) / aspect / 2;

        // console.log("posY", posY);
        // console.log("posX", posX);
        // console.log("rotZ", rotZ);
        // console.log("lastRotation after", lastRotation.current);

        // if(first && rotation.isAnimating) {
        //   return
        // }
        // console.log(groupRef.current!.rotation.z)
        if (last) {
          // lastRotation.current = 0
          lastPosY.current = y;
          lastPosX.current = x;
          console.log(
            "xy",
            xy,
            "\n",
            "posY",
            posY,
            "\n",
            "posX",
            posX,
            "\n",
            "lastRotation",
            lastRotation.current,
            "\n",
            "rotZ",
            rotZ
          );
          setHasInitializedTouch(false);
        }

        setRotation.start({
          rotation: [0, 0, rotZ],
          // immediate: down,
        });
      },
    },
    {
      drag: {
        // threshold: 20,
        // filterTaps: true,
        // useTouch: true,
        bounds: {
          bottom: (getSize(7) / 2) * aspect,
          top: (-getSize(7) / 2) * aspect,
          left: (-getSize(7) / 2) * aspect,
          right: (getSize(7) / 2) * aspect,
        },
        initial: ({ initial, lastOffset }) => {
          console.log("APA", lastOffset);
          console.log(
            "❌ INITIAL",
            "\n",
            "initial",
            initial,
            "\n",
            "lastPosY",
            lastPosY.current,
            "\n",
            "lastPosX",
            lastPosX.current,
            "\n",
            "aspect",
            aspect
          );

          setHasInitializedTouch(true);
          return [lastPosX.current, lastPosY.current];
        },
      },
    }
  );

  const lightRef = useRef();
  useHelper(lightRef, PointLightHelper, 5, "red");

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls enabled={false} />
      {/* <ambientLight intensity={1} /> */}
      <pointLight
        position={[getSize(10), getSize(3), getSize(5)]}
        args={["#ffffff", 1]}
      />
      <pointLight
        position={[getSize(-10), getSize(-3), getSize(5)]}
        args={["#ffffff", 1]}
      />

      <a.group ref={outerGroupRef}>
        {/*
      // @ts-ignore */}
        <a.group ref={groupRef} rotation={rotation}>
          {/* <a.group ref={groupRef} rotation={rotation} {...bind()}> */}
          <mesh>
            <ringBufferGeometry
              args={[getSize(2), getSize(7), RING_SEGMENTS, RING_SEGMENTS]}
            />
            <meshPhongMaterial color={discColor} />
          </mesh>

          {RING_INNER_RADIUS.map(
            (radius, i) =>
              i % 2 === 0 && (
                <mesh key={i}>
                  <ringBufferGeometry
                    args={[
                      getSize(radius),
                      getSize(radius) + 0.05,
                      RING_SEGMENTS,
                      RING_SEGMENTS,
                    ]}
                  />
                  <meshStandardMaterial
                    color={"#000000"}
                    opacity={0.05}
                    transparent
                  />
                </mesh>
              )
          )}

          {/* {rings.map((o, i) => {
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
        </a.group>
      </a.group>
      {/* <EffectComposer>
        <GodRaysEffect innerRadius={getSize(7)} outerRadius={getSize(7.1)} />
      </EffectComposer> */}
    </>
  );
};

gsap.registerPlugin(Draggable, InertiaPlugin);

export default Scene;
