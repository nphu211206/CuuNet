"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import type { DisasterType } from "@/lib/types";
import type { ProvinceRisk, PredictionResult } from "./types";

// === WORKER MESSAGE TYPES ===

interface WorkerReadyMessage {
  type: "ready";
  success: boolean;
  modelLoaded: boolean;
  backend: string | null;
}

interface WorkerResultMessage {
  type: "result";
  data: {
    riskScores: Record<string, ProvinceRisk>;
    predictions: Record<string, PredictionResult>;
  };
}

interface WorkerDisposedMessage {
  type: "disposed";
}

type WorkerMessage = WorkerReadyMessage | WorkerResultMessage | WorkerDisposedMessage;

// === HOOK INPUT/OUTPUT ===

export interface PredictRequest {
  provinces: string[];
  month: number;           // 0-11
  scenarioModifier: number; // 1.0 = normal
}

export interface PredictionWorkerState {
  isReady: boolean;
  isLoading: boolean;
  modelLoaded: boolean;
  backend: string | null;
  error: string | null;
}

export interface UsePredictionWorkerReturn extends PredictionWorkerState {
  predict: (request: PredictRequest) => Promise<{
    riskScores: Record<string, ProvinceRisk>;
    predictions: Record<string, PredictionResult>;
  }>;
  dispose: () => void;
}

// === HOOK ===

export function usePredictionWorker(): UsePredictionWorkerReturn {
  const workerRef = useRef<Worker | null>(null);
  const pendingResolveRef = useRef<((data: {
    riskScores: Record<string, ProvinceRisk>;
    predictions: Record<string, PredictionResult>;
  }) => void) | null>(null);
  const pendingRejectRef = useRef<((error: Error) => void) | null>(null);

  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [backend, setBackend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize worker on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const worker = new Worker("/workers/prediction-worker.js");
      workerRef.current = worker;

      worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
        switch (e.data.type) {
          case "ready":
            setIsReady(e.data.success);
            setModelLoaded(e.data.modelLoaded);
            setBackend(e.data.backend);
            if (!e.data.success) {
              setError("Worker initialized but model not loaded");
            }
            break;

          case "result":
            setIsLoading(false);
            if (pendingResolveRef.current) {
              pendingResolveRef.current(e.data.data);
              pendingResolveRef.current = null;
              pendingRejectRef.current = null;
            }
            break;

          case "disposed":
            setIsReady(false);
            setIsLoading(false);
            break;
        }
      };

      worker.onerror = (e) => {
        console.error("[PredictionWorker] Error:", e.message);
        setError(e.message);
        setIsLoading(false);
        if (pendingRejectRef.current) {
          pendingRejectRef.current(new Error(e.message));
          pendingRejectRef.current = null;
          pendingResolveRef.current = null;
        }
      };

      // Init
      worker.postMessage({ type: "init" });
    } catch (err) {
      console.error("[PredictionWorker] Failed to create worker:", err);
      setError("Failed to create prediction worker");
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "dispose" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Predict function - returns a promise that resolves with results
  const predict = useCallback((request: PredictRequest): Promise<{
    riskScores: Record<string, ProvinceRisk>;
    predictions: Record<string, PredictionResult>;
  }> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current || !isReady) {
        reject(new Error("Worker not ready"));
        return;
      }

      setIsLoading(true);
      setError(null);
      pendingResolveRef.current = resolve;
      pendingRejectRef.current = reject;

      workerRef.current.postMessage({
        type: "predict",
        data: {
          provinces: request.provinces,
          month: request.month,
          scenarioModifier: request.scenarioModifier,
        },
      });
    });
  }, [isReady]);

  // Dispose function
  const dispose = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ type: "dispose" });
    }
  }, []);

  return {
    isReady,
    isLoading,
    modelLoaded,
    backend,
    error,
    predict,
    dispose,
  };
}
