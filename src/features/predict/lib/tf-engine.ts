/**
 * TensorFlow.js Engine for disaster prediction.
 *
 * This module handles:
 * - Loading pre-trained LSTM model from public/models/
 * - Running inference with proper tensor memory management
 * - Graceful fallback when model is not available
 *
 * The model is expected to be a Keras LSTM model converted to TF.js format.
 * Input shape: [batch, 12, 6] (12 months × 6 features)
 * Output shape: [batch, 6] (risk scores for 6 disaster types)
 */

import type { DisasterType } from "@/lib/types";

const MODEL_URL = "/models/disaster-predict/model.json";

const DISASTER_TYPES: DisasterType[] = [
  "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
];

export interface TFPredictionResult {
  risks: Record<DisasterType, number>;
  modelLoaded: boolean;
}

/**
 * Attempt to load the TF.js model.
 * Returns null if model files are not available (graceful fallback).
 */
export async function loadModel(): Promise<any | null> {
  try {
    // Dynamic import to avoid loading TF.js when not needed
    const tf = await import("@tensorflow/tfjs");

    // Try to load the model
    const model = await tf.loadLayersModel(MODEL_URL);
    console.log("[TF.js] Model loaded successfully");
    return model;
  } catch (error) {
    // Model not found - this is expected in development
    console.warn("[TF.js] Model not available, using statistical engine:", (error as Error).message);
    return null;
  }
}

/**
 * Prepare input features for the model from historical data.
 *
 * Input format: [batch_size, time_steps, features]
 * - time_steps: 12 months
 * - features: [flood_freq, storm_freq, landslide_freq, drought_freq, avg_temp, avg_precipitation]
 */
export function createInputTensor(
  historicalData: Record<DisasterType, number[]>,
  weatherFeatures?: { temperature: number; precipitation: number }
): number[][][] {
  const months = 12;
  const features: number[][] = [];

  for (let m = 0; m < months; m++) {
    const monthFeatures = [
      historicalData.flood[m] ?? 0,
      historicalData.storm[m] ?? 0,
      historicalData.landslide[m] ?? 0,
      historicalData.drought[m] ?? 0,
      historicalData.earthquake[m] ?? 0,
      historicalData.tsunami[m] ?? 0,
    ];
    features.push(monthFeatures);
  }

  return [features]; // Add batch dimension
}

/**
 * Run prediction with the loaded model.
 * Uses tf.tidy() for automatic tensor cleanup.
 */
export async function predictWithModel(
  model: any,
  inputFeatures: number[][][]
): Promise<Record<DisasterType, number>> {
  const tf = await import("@tensorflow/tfjs");

  // Use tf.tidy for automatic tensor disposal
  const result = tf.tidy(() => {
    const input = tf.tensor3d(inputFeatures);
    const prediction = model.predict(input) as any;
    const data = prediction.dataSync() as Float32Array;
    return Array.from(data);
  });

  // Map output to disaster types
  const risks: Record<DisasterType, number> = {} as any;
  for (let i = 0; i < DISASTER_TYPES.length; i++) {
    risks[DISASTER_TYPES[i]] = Math.max(0, Math.min(1, result[i] ?? 0));
  }

  return risks;
}

/**
 * Get TensorFlow.js memory info (for debugging).
 */
export async function getTFMemoryInfo(): Promise<{ numTensors: number; numBytes: number } | null> {
  try {
    const tf = await import("@tensorflow/tfjs");
    const mem = tf.memory();
    return { numTensors: mem.numTensors, numBytes: mem.numBytes };
  } catch {
    return null;
  }
}

/**
 * Check if TF.js backend is available (WebGL/WebGPU/WASM).
 */
export async function getBackendInfo(): Promise<string | null> {
  try {
    const tf = await import("@tensorflow/tfjs");
    await tf.ready();
    return tf.getBackend();
  } catch {
    return null;
  }
}
