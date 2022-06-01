export interface Ring {
  width: number;
  innerRadius: number;
  color: string;
  thetaStart: number;
  thetaLength: number;
}

export interface Theme {
  theme: "light" | "dark";
  colors: string[];
}

export const DEFAULT_BPM = 110;

export const RING_SEGMENTS = 80;

export const THETA_START = [
  0,
  0.25,
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2,
  2.25,
  2.5,
  2.75,
  3,
  3.25,
  3.5,
  3.75,
  4,
  4.25,
  4.5,
  4.75,
  5,
  5.25,
  5.5,
  5.75,
  6,
  Math.PI * 2,
];

export const THETA_LENGTH = [
  1,
  1.25,
  1.5,
  1.75,
  2,
  2.25,
  2.5,
  2.75,
  3,
  3.25,
  3.5,
  3.75,
  4,
  4.25,
  4.5,
  4.75,
  5,
  5.25,
  5.5,
  5.75,
  6,
  Math.PI * 2,
];

export const RING_COUNT = [5, 6, 7, 8, 9, 10, 11, 12];

export const RING_WIDTH = [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.1];

export const RING_INNER_RADIUS = [
  2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 3.5, 3.75, 4,
  4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5,
];

export const RING_STATIC_RADIUS = [
  2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 3.5,
  3.75, 4, 4.25, 4.5, 4.75, 5, 5.25, 5.5, 5.75, 6, 6.25, 6.5,
];

export const POINT_LIGHTS = [
  [
    [10, 7.5, 5],
    [-10, -7.5, 5],
  ],
  [
    [10, -7.5, 5],
    [-10, 7.5, 5],
  ],
  [
    [10, 7.5, 5],
    [-10, -7.5, 5],
  ],
  [
    [10, -7.5, 5],
    [-10, 7.5, 5],
  ],
  [
    [12, 0, 5],
    [-12, 0, 5],
  ],
  [
    [0, -12, 5],
    [0, 12, 5],
  ],
];

export const BG_COLORS: Theme[] = [
  {
    theme: "dark",
    colors: ["#000000", "#0b0b4b", "#1b3342", "#1b4225", "#421b1b", "#48005b"],
  },
  {
    theme: "light",
    colors: ["#ffffff", "#ffce00", "#497fff", "#eb3434", "#f97b9c", "#fe7418"],
  },
  {
    theme: "light",
    colors: ["#ffffff", "#ffce00", "#497fff", "#eb3434", "#f97b9c", "#fe7418"],
  },
];

export const DISC_COLORS: Theme[] = [
  {
    theme: "dark",
    colors: ["#000000", "#0b0b4b", "#1b3342", "#1b4225", "#421b1b", "#48005b"],
  },
  {
    theme: "light",
    colors: ["#000000", "#eb3434", "#eb3434", "#fe7418", "#fe7418", "#344df2"],
  },
];

export const CENTER_COLORS: Theme[] = [
  {
    theme: "dark",
    colors: [
      "#000000",
      "#1b3342",
      "#0b0b4b",
      "#800b0b",
      "#1b4225",
      "#dc0fc0",
      "#aa4807",
      "#75007e",
    ],
  },
  {
    theme: "light",
    colors: [
      "#ffffff",
      "#ffce00",
      "#497fff",
      "#eb3434",
      "#30f8a0",
      "#f97b9c",
      "#fe7418",
      "#00f7fb",
    ],
  },
];

export const RING_COLORS = [
  "#000000",
  "#1b3342",
  "#0b0b4b",
  "#800b0b",
  "#1b4225",
  "#dc0fc0",
  "#aa4807",
  "#75007e",
  "#ffffff",
  "#ffce00",
  "#497fff",
  "#344df2",
  "#eb3434",
  "#30f8a0",
  "#f97b9c",
  "#fe7418",
  "#00f7fb",
];
