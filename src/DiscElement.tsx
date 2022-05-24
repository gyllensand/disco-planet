import { useCallback, useLayoutEffect, useState } from "react";

const Disc = () => {
  const [windowSize, setWindowSize] = useState([0, 0]);
  const [aspect, setAspect] = useState(0);

  const updateSize = useCallback(() => {
    setWindowSize([window.innerWidth, window.innerHeight]);
    setAspect(window.innerWidth / window.innerHeight);
  }, []);

  const getSize = useCallback(
    (size: number) => (aspect > 1 ? size : size * aspect),
    [aspect]
  );

  useLayoutEffect(() => {
    window.addEventListener("resize", updateSize);
    updateSize();
  }, [updateSize]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        id="disc"
        style={{
          height: getSize(windowSize[1] - getSize(20)),
          width: getSize(windowSize[1] - getSize(20)),
        //   borderWidth: 2,
        //   borderColor: "red",
        //   borderStyle: "double",
          borderRadius: "50%",
          zIndex: 99,
        }}
      ></div>
    </div>
  );
};

export default Disc;
