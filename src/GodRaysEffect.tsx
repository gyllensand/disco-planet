import { useFrame } from "@react-three/fiber";
import { GodRays } from "@react-three/postprocessing";
import { BlendFunction, KernelSize } from "postprocessing";
import { forwardRef, useRef } from "react";
import { Mesh } from "three";

interface Props {
  innerRadius: number;
  outerRadius: number;
  aspect: number;
}

const Sun = forwardRef<Mesh, Props>((props, forwardRef) => {
  return (
    <mesh ref={forwardRef as any} position={[0, 0, 0]}>
      <circleBufferGeometry args={[0.1, 32, 32]} />
      <meshBasicMaterial color="yellow" />
    </mesh>
  );
});

const GodRaysEffect = (props: Props) => {
  const sunRef = useRef<THREE.Mesh>();

  return (
    <>
      <Sun ref={sunRef as any} {...props} />
      {sunRef.current && (
        <GodRays
          sun={sunRef.current}
          blendFunction={BlendFunction.SCREEN}
          samples={30}
          density={0.97}
          decay={0.96}
          weight={0.2}
          exposure={0.4}
          clampMax={1}
          kernelSize={KernelSize.VERY_SMALL}
          blur={1}
        />
      )}
    </>
  );
};

export default GodRaysEffect;
