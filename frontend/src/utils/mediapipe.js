// Using global FaceMesh from CDN scripts in index.html
export const setupFaceMesh = (onResults) => {
  // eslint-disable-next-line no-undef
  const faceMesh = new window.FaceMesh({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
    },
  });

  faceMesh.setOptions({
    maxNumFaces: 1,
    refineLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });

  faceMesh.onResults(onResults);
  return faceMesh;
};

// Indices for landmarks
export const EYE_INDICES = {
  left: [33, 160, 158, 133, 153, 144],
  right: [362, 385, 387, 263, 373, 380]
};

export const IRIS_INDICES = {
  left: [468, 469, 470, 471, 472],
  right: [473, 474, 475, 476, 477]
};

// 8 points in mouth contour order for proper MAR calculation:
// 0: left corner, 1: upper-left, 2: upper-center, 3: upper-right,
// 4: right corner, 5: lower-right, 6: lower-center, 7: lower-left
export const MOUTH_INDICES = [78, 82, 13, 312, 308, 317, 14, 87];
