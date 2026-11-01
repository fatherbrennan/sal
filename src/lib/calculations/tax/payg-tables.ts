interface Coefficient {
  a: number;
  b: number;
}
interface CoefficientTable {
  bands: readonly (Coefficient & { upper: number })[];
  top: Coefficient;
}

const ordinary2025Claimed: CoefficientTable = {
  bands: [
    { upper: 361, a: 0, b: 0 },
    { upper: 500, a: 0.16, b: 57.8462 },
    { upper: 625, a: 0.26, b: 107.8462 },
    { upper: 721, a: 0.18, b: 57.8462 },
    { upper: 865, a: 0.189, b: 64.3365 },
    { upper: 1282, a: 0.3227, b: 180.0385 },
    { upper: 2596, a: 0.32, b: 176.5769 },
    { upper: 3653, a: 0.39, b: 358.3077 },
  ],
  top: { a: 0.47, b: 650.6154 },
};
const ordinary2026Claimed: CoefficientTable = {
  bands: [
    { upper: 362, a: 0, b: 0 },
    { upper: 538, a: 0.15, b: 54.3462 },
    { upper: 673, a: 0.25, b: 108.2135 },
    { upper: 721, a: 0.17, b: 54.3473 },
    { upper: 865, a: 0.179, b: 60.8377 },
    { upper: 1282, a: 0.3227, b: 185.1935 },
    { upper: 2596, a: 0.32, b: 181.7319 },
    { upper: 3653, a: 0.39, b: 363.4627 },
  ],
  top: { a: 0.47, b: 655.7704 },
};
const ordinary2025Unclaimed: CoefficientTable = {
  bands: [
    { upper: 150, a: 0.16, b: 0.16 },
    { upper: 371, a: 0.2117, b: 7.755 },
    { upper: 515, a: 0.189, b: -0.6702 },
    { upper: 932, a: 0.3227, b: 68.2367 },
    { upper: 2246, a: 0.32, b: 65.7202 },
    { upper: 3303, a: 0.39, b: 222.951 },
  ],
  top: { a: 0.47, b: 487.2587 },
};
const ordinary2026Unclaimed: CoefficientTable = {
  bands: [
    { upper: 188, a: 0.15, b: 0.15 },
    { upper: 371, a: 0.2084, b: 11.0185 },
    { upper: 515, a: 0.179, b: 0.1066 },
    { upper: 932, a: 0.3227, b: 74.1674 },
    { upper: 2246, a: 0.32, b: 71.6508 },
    { upper: 3303, a: 0.39, b: 228.8816 },
  ],
  top: { a: 0.47, b: 493.1893 },
};
const combinedEarlyClaimed: CoefficientTable = {
  bands: [
    { upper: 361, a: 0, b: 0 },
    { upper: 500, a: 0.16, b: 57.8462 },
    { upper: 625, a: 0.26, b: 107.8462 },
    { upper: 721, a: 0.18, b: 57.8462 },
    { upper: 865, a: 0.189, b: 64.3365 },
    { upper: 1079, a: 0.3227, b: 180.0385 },
    { upper: 1246, a: 0.3327, b: 180.0385 },
    { upper: 1282, a: 0.3427, b: 180.0385 },
    { upper: 1321, a: 0.34, b: 176.5769 },
    { upper: 1401, a: 0.345, b: 176.5769 },
    { upper: 1485, a: 0.35, b: 176.5769 },
    { upper: 1574, a: 0.355, b: 176.5769 },
    { upper: 1668, a: 0.36, b: 176.5769 },
    { upper: 1768, a: 0.365, b: 176.5769 },
    { upper: 1874, a: 0.37, b: 176.5769 },
    { upper: 1987, a: 0.375, b: 176.5769 },
    { upper: 2106, a: 0.38, b: 176.5769 },
    { upper: 2233, a: 0.385, b: 176.5769 },
    { upper: 2366, a: 0.39, b: 176.5769 },
    { upper: 2508, a: 0.395, b: 176.5769 },
    { upper: 2596, a: 0.4, b: 176.5769 },
    { upper: 2659, a: 0.47, b: 358.3077 },
    { upper: 2819, a: 0.475, b: 358.3077 },
    { upper: 2988, a: 0.48, b: 358.3077 },
    { upper: 3167, a: 0.485, b: 358.3077 },
    { upper: 3653, a: 0.49, b: 358.3077 },
  ],
  top: { a: 0.57, b: 650.6154 },
};
const combined2025Claimed: CoefficientTable = {
  bands: [
    { upper: 361, a: 0, b: 0 },
    { upper: 500, a: 0.16, b: 57.8462 },
    { upper: 625, a: 0.26, b: 107.8462 },
    { upper: 721, a: 0.18, b: 57.8462 },
    { upper: 865, a: 0.189, b: 64.3365 },
    { upper: 1282, a: 0.3227, b: 180.0385 },
    { upper: 1288, a: 0.32, b: 176.5769 },
    { upper: 2403, a: 0.47, b: 369.8462 },
    { upper: 2596, a: 0.49, b: 417.9231 },
    { upper: 3447, a: 0.56, b: 599.6538 },
    { upper: 3653, a: 0.49, b: 358.3077 },
  ],
  top: { a: 0.57, b: 650.6154 },
};
const combined2026Claimed: CoefficientTable = {
  bands: [
    { upper: 362, a: 0, b: 0 },
    { upper: 538, a: 0.15, b: 54.3462 },
    { upper: 673, a: 0.25, b: 108.2135 },
    { upper: 721, a: 0.17, b: 54.3473 },
    { upper: 865, a: 0.179, b: 60.8377 },
    { upper: 1282, a: 0.3227, b: 185.1935 },
    { upper: 1337, a: 0.32, b: 181.7319 },
    { upper: 2494, a: 0.47, b: 382.2935 },
    { upper: 2596, a: 0.49, b: 432.1846 },
    { upper: 3577, a: 0.56, b: 613.9154 },
    { upper: 3653, a: 0.49, b: 363.4627 },
  ],
  top: { a: 0.57, b: 655.7704 },
};
const combined2025Unclaimed: CoefficientTable = {
  bands: [
    { upper: 150, a: 0.16, b: 0.16 },
    { upper: 371, a: 0.2117, b: 7.755 },
    { upper: 515, a: 0.189, b: -0.6702 },
    { upper: 932, a: 0.3227, b: 68.2367 },
    { upper: 938, a: 0.32, b: 65.7202 },
    { upper: 2053, a: 0.47, b: 206.4894 },
    { upper: 2246, a: 0.49, b: 247.5663 },
    { upper: 2597, a: 0.56, b: 404.7971 },
    { upper: 3303, a: 0.49, b: 222.951 },
  ],
  top: { a: 0.57, b: 487.2587 },
};
const combined2026Unclaimed: CoefficientTable = {
  bands: [
    { upper: 188, a: 0.15, b: 0.15 },
    { upper: 371, a: 0.2084, b: 11.0185 },
    { upper: 515, a: 0.179, b: 0.1066 },
    { upper: 932, a: 0.3227, b: 74.1674 },
    { upper: 987, a: 0.32, b: 71.6508 },
    { upper: 2144, a: 0.47, b: 219.7124 },
    { upper: 2246, a: 0.49, b: 262.6035 },
    { upper: 2727, a: 0.56, b: 419.8343 },
    { upper: 3303, a: 0.49, b: 228.8816 },
  ],
  top: { a: 0.57, b: 493.1893 },
};

export type { CoefficientTable };
export {
  combined2025Claimed,
  combined2025Unclaimed,
  combined2026Claimed,
  combined2026Unclaimed,
  combinedEarlyClaimed,
  ordinary2025Claimed,
  ordinary2025Unclaimed,
  ordinary2026Claimed,
  ordinary2026Unclaimed,
};
