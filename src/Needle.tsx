import { a, easings, useSpring } from "@react-spring/three";
import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, Vector3 } from "three";
import { RING_SEGMENTS } from "./constants";

const Needle = ({
  isActive,
  getSize,
  color,
  secondColor,
}: {
  isActive: boolean;
  getSize: (size: number) => number;
  color: string;
  secondColor: string;
}) => {
  const [{ rotation }, setRotation] = useSpring(() => ({
    rotation: [0, 0, 0.6],
    config: { duration: 1000, easing: easings.easeInOutCubic },
  })) as any;

  useEffect(() => {
    setRotation.start({
      rotation: isActive ? [0, 0, 0.2] : [0, 0, 0.6],
    });
  }, [isActive, setRotation]);

  const curve = useMemo(
    () =>
      new CatmullRomCurve3(
        [
          new Vector3(getSize(1), getSize(1), 0),
          new Vector3(getSize(1.2), getSize(-2.55), 0),
          new Vector3(getSize(0.75), getSize(-3.4), 0),
        ],
        false,
        "catmullrom",
        0.2
      ),
    [getSize]
  );

  return (
    <a.group position={[getSize(4.9), getSize(6.5), 0]} rotation={rotation}>
      <mesh>
        <circleBufferGeometry
          args={[getSize(0.4), RING_SEGMENTS, RING_SEGMENTS]}
        />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[getSize(-0.06), getSize(-0.04), getSize(0.08)]}>
        <circleBufferGeometry
          args={[getSize(0.15), RING_SEGMENTS, RING_SEGMENTS]}
        />
        <meshBasicMaterial color={secondColor} />
      </mesh>
      <mesh position={[getSize(-1), getSize(-1), 0]}>
        <tubeBufferGeometry args={[curve, 70, getSize(0.08), 4]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh
        position={[getSize(-0.325), getSize(-4.5), 0.01]}
        rotation={[0, 0, -0.6]}
      >
        <planeBufferGeometry args={[getSize(0.35), getSize(0.8)]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </a.group>
  );
};

export default Needle;
