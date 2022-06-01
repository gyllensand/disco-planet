import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MathUtils, Mesh, MeshStandardMaterial, Vector3 } from "three";
import { Loop, start, Transport } from "tone";
import { analyser, DRUMS, INSTRUMENTS, VINYL_NOISE } from "./App";
import {
  RING_COUNT,
  RING_WIDTH,
  RING_INNER_RADIUS,
  THETA_START,
  THETA_LENGTH,
  BG_COLORS,
  DISC_COLORS,
  CENTER_COLORS,
  RING_COLORS,
  POINT_LIGHTS,
  RING_STATIC_RADIUS,
  RING_SEGMENTS,
  Ring,
  DEFAULT_BPM,
} from "./constants";
import { Draggable } from "gsap/Draggable";
import gsap from "gsap";
import Needle from "./Needle";
import { a, useSpring } from "@react-spring/three";
import {
  pickRandomHash,
  sortRandomHash,
  adjustColor,
  getSizeByAspect,
  range,
} from "./utils";
const Momentum = require("./momentum");

const pointLights = pickRandomHash(sortRandomHash(POINT_LIGHTS));

const bgTheme = pickRandomHash(BG_COLORS);
const discTheme = bgTheme.theme === "light" ? DISC_COLORS[0] : DISC_COLORS[1];
const centerTheme =
  discTheme.theme === "light" ? CENTER_COLORS[0] : CENTER_COLORS[1];
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
const needleColor2 = adjustColor(
  needleColor,
  needleTheme.theme === "light" ? -50 : 50
);
const haloColor = adjustColor(
  bgColor,
  bgColor === "#000000" ? 60 : bgTheme.theme === "light" ? -30 : 30
);

const ringCount = pickRandomHash(RING_COUNT);
const rings = new Array(ringCount).fill(null).map<Ring>(() => {
  const width = pickRandomHash(RING_WIDTH);
  const innerRadius = pickRandomHash(RING_INNER_RADIUS);
  const color = pickRandomHash(RING_COLORS);
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
  bgColor,
  discColor,
  centerColor1: centerColor,
  centerColor2,
  needleColor,
  ringCount,
};

const StaticRings = ({ aspect }: { aspect: number }) => {
  const color =
    discColor === "#000000" ? "#000000" : adjustColor(discColor, -50);

  const material = new MeshStandardMaterial({
    color,
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

const Scene = () => {
  const { aspect } = useThree((state) => ({
    aspect: state.viewport.aspect,
  }));
  const outerGroupRef = useRef<Mesh>();
  const groupRef = useRef<Mesh>();
  const centerRef = useRef<Mesh>();
  const haloRef = useRef<Mesh>();
  const draggableRef = useRef<Draggable>();

  const [isDragging, setIsDragging] = useState(false);
  const toneInitialized = useRef(false);
  const [audioActive, setAudioActive] = useState(false);

  Transport.timeSignature = [4, 4];
  Transport.bpm.value = DEFAULT_BPM;

  const [{ lightRotation }, setLightRotation] = useSpring(() => ({
    lightRotation: [0, 0, 0],
    config: { friction: 20 },
  }));

  const loop = useMemo(
    () =>
      new Loop(() => {
        setLightRotation.start({
          lightRotation: [0, 0, lightRotation.get()[2] + Math.PI * 4],
        });
      }, "8m"),
    [setLightRotation, lightRotation]
  );

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
    if (Transport.state !== "stopped") {
      return;
    }

    Transport.start("+2");
    Transport.scheduleOnce(() => {
      INSTRUMENTS.setLoopPoints("8m", "16m");
      INSTRUMENTS.loop = true;
      DRUMS.setLoopPoints("8m", "16m");
      DRUMS.loop = true;
    }, "+1");

    loop.start("8m");
    DRUMS.start(0);
    INSTRUMENTS.start(0);
  }, [loop]);

  useFrame(() => {
    if (!isDragging) {
      outerGroupRef.current!.rotation.z -= 0.025;
    }

    analyser.update();
    const clamp = (energy: number, threshold: number) =>
      isFinite(energy) && energy > threshold ? energy : threshold;

    const bassEnergy = analyser.getEnergy().byFrequency("bass");
    const scaleEnergy = analyser._map(bassEnergy, -100, -50, 1, 1.05);
    const scaleValue = clamp(scaleEnergy, 1);

    centerRef.current!.scale.set(scaleValue, scaleValue, scaleValue);
    haloRef.current!.scale.set(scaleValue, scaleValue, scaleValue);
  });

  useEffect(() => {
    VINYL_NOISE.toDestination();
    INSTRUMENTS.toDestination().sync();
    DRUMS.toDestination().sync();
    DRUMS.connect(analyser);
  }, []);

  const onRotation = useCallback(() => {
    if (!groupRef.current || !draggableRef.current) {
      return;
    }

    const interpolatedRate = MathUtils.clamp(
      range(-10, 10, 0, 2, draggableRef.current.deltaX),
      0.3,
      1.7
    );

    const playbackRate = Math.round(interpolatedRate * 100) / 100;

    if (Transport.state === "started") {
      INSTRUMENTS.playbackRate = playbackRate;
      DRUMS.playbackRate = playbackRate;
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

  return (
    <>
      <color attach="background" args={[bgColor]} />
      <OrbitControls enabled={false} />

      <a.group rotation={lightRotation as any}>
        <pointLight
          position={pointLights[0].map((o) => getSize(o)) as unknown as Vector3}
          args={["#ffffff", 1]}
        />
        <pointLight
          position={pointLights[1].map((o) => getSize(o)) as unknown as Vector3}
          args={["#ffffff", 1]}
        />
      </a.group>

      <group ref={outerGroupRef}>
        <group ref={groupRef}>
          <mesh ref={haloRef}>
            <ringBufferGeometry
              args={[getSize(6), getSize(7), RING_SEGMENTS, RING_SEGMENTS]}
            />
            <meshBasicMaterial color={haloColor} />
          </mesh>
          <mesh>
            <ringBufferGeometry
              args={[getSize(1), getSize(7), RING_SEGMENTS, RING_SEGMENTS]}
            />
            <meshPhongMaterial color={discColor} />
          </mesh>

          <StaticRings aspect={aspect} />
          <DynamicRings aspect={aspect} />

          <group ref={centerRef}>
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
      </group>
      <Needle
        getSize={getSize}
        isActive={toneInitialized.current}
        color={needleColor}
        secondColor={needleColor2}
      />
    </>
  );
};

gsap.registerPlugin(Draggable, Momentum);

export default Scene;
