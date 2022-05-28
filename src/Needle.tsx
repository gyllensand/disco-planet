import { a, easings, useSpring } from "@react-spring/three";
import { RoundedBox } from "@react-three/drei";
import { useEffect, useMemo } from "react";
import { CatmullRomCurve3, Color, Vector3 } from "three";

const convertToRGB = (hex: string) => {
  const aRgbHex = hex.match(/.{1,2}/g);

  if (!aRgbHex) {
    return "#ffffff";
  }

  const aRgb = [
    parseInt(aRgbHex[0], 16),
    parseInt(aRgbHex[1], 16),
    parseInt(aRgbHex[2], 16),
  ];
  return aRgb;
};

const Needle = ({
  isActive,
  getSize,
  color,
}: {
  isActive: boolean;
  getSize: (size: number) => number;
  color: string;
}) => {
  const lidColor = useMemo(
    () => new Color(color).lerp(new Color("#ffffff"), 0.00001),
    [color]
  );
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
    // () => new CatmullRomCurve3([new Vector3(1, 1, 0.5), new Vector3(1, -2, 0.5), new Vector3(0, -3, 0.5)]),
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
        <circleBufferGeometry args={[getSize(0.5), 64, 64]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh position={[getSize(-0.05), getSize(-0.03), getSize(0.1)]}>
        <circleBufferGeometry args={[getSize(0.2), 64, 64]} />
        <meshStandardMaterial color={lidColor} />
      </mesh>
      <RoundedBox
        position={[getSize(-0.3), getSize(-4.5), 0]}
        rotation={[1.5, -0.6, 0]}
        args={[getSize(0.35), getSize(0.2), getSize(0.95)]}
        radius={0.05}
      >
        <meshBasicMaterial color={color} />
      </RoundedBox>
      <mesh position={[getSize(-1), getSize(-1), 0]}>
        <tubeBufferGeometry args={[curve, 70, getSize(0.08), 10]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </a.group>
  );
};

export default Needle;
