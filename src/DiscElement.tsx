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
        pointerEvents: "none",
      }}
    >
      <div
        id="disc"
        style={{
          height: getSize(windowSize[1] - getSize(20)),
          width: getSize(windowSize[1] - getSize(20)),
          //   borderWidth: 5,
          //   borderColor: "red",
          //   borderStyle: "double",
          pointerEvents: "auto",
          borderRadius: "50%",
          zIndex: 1,
        }}
      ></div>
      {/* {!isToneInit && (
        <div
          onClick={onStart}
          style={{
            position: "absolute",
            height: getSize(windowSize[1] - getSize(20)),
            width: getSize(windowSize[1] - getSize(20)),
            borderWidth: 10,
            borderColor: "green",
            borderStyle: "double",
            pointerEvents: "auto",
            borderRadius: "50%",
            zIndex: 2,
          }}
        ></div>
      )} */}
    </div>
  );
};

export default Disc;
