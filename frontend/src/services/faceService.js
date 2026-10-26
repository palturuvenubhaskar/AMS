import * as faceapi from '@vladmandic/face-api';

let modelsLoaded = false;
let modelLoadingPromise = null;

/**
 * Loads face-api detection, landmark, and recognition neural network models from /models
 */
export async function loadFaceApiModels() {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      const MODEL_URL = '/models';
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
        faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      ]);
      modelsLoaded = true;
      return true;
    } catch (err) {
      console.error('Failed to load Face-API models:', err);
      modelLoadingPromise = null;
      throw err;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Detects all faces in a video or image element with 68 landmarks and 128-d descriptors
 */
export async function detectAllFaces(inputElement, scoreThreshold = 0.45) {
  if (!modelsLoaded) await loadFaceApiModels();
  
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 320,
    scoreThreshold,
  });

  return await faceapi
    .detectAllFaces(inputElement, options)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

/**
 * Detects a single face for enrollment with high precision
 */
export async function detectSingleFace(inputElement) {
  if (!modelsLoaded) await loadFaceApiModels();

  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5,
  });

  return await faceapi
    .detectSingleFace(inputElement, options)
    .withFaceLandmarks()
    .withFaceDescriptor();
}

/**
 * Creates a FaceMatcher initialized with enrolled students' descriptors
 * @param {Array<{ studentId: number|string, embedding: number[] }>} enrolledFaces
 * @param {number} distanceThreshold - Euclidean distance threshold (e.g. 0.55). Lower is stricter.
 */
export function createFaceMatcher(enrolledFaces, distanceThreshold = 0.55) {
  if (!enrolledFaces || enrolledFaces.length === 0) return null;

  const labeledDescriptors = enrolledFaces
    .filter(f => Array.isArray(f.embedding) && f.embedding.length === 128)
    .map(f => {
      const descriptor = new Float32Array(f.embedding);
      return new faceapi.LabeledFaceDescriptors(f.studentId.toString(), [descriptor]);
    });

  if (labeledDescriptors.length === 0) return null;

  return new faceapi.FaceMatcher(labeledDescriptors, distanceThreshold);
}

export { faceapi };
