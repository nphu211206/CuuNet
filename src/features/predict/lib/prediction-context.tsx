"use client";

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import type { DisasterType } from "@/lib/types";
import type {
  PredictionState,
  PredictionAction,
  ProvinceRisk,
  PredictionResult,
  ExternalAlert,
} from "./types";
import { PREDICTION_CONFIG, SCENARIOS } from "../config/predict-config";
import { getAllProvinces } from "./geo-risk";
import { calculateRiskScore } from "./risk-engine";
import { predictionEngine } from "./statistical-engine";

// === INITIAL STATE ===

const initialState: PredictionState = {
  selectedProvince: PREDICTION_CONFIG.DEFAULT_PROVINCE,
  selectedMonth: PREDICTION_CONFIG.DEFAULT_MONTH,
  selectedScenario: PREDICTION_CONFIG.DEFAULT_SCENARIO,
  riskScores: new Map(),
  predictions: new Map(),
  externalAlerts: [],
  isLoading: false,
  error: null,
};

// === REDUCER ===

function predictionReducer(
  state: PredictionState,
  action: PredictionAction
): PredictionState {
  switch (action.type) {
    case "SET_PROVINCE":
      return { ...state, selectedProvince: action.payload };

    case "SET_MONTH":
      return { ...state, selectedMonth: action.payload };

    case "SET_SCENARIO":
      return { ...state, selectedScenario: action.payload };

    case "SET_RISK_SCORES":
      return { ...state, riskScores: action.payload };

    case "SET_PREDICTIONS":
      return { ...state, predictions: action.payload };

    case "SET_ALERTS":
      return { ...state, externalAlerts: action.payload };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload };

    case "UPDATE_PROVINCE_RISK": {
      const newMap = new Map(state.riskScores);
      newMap.set(action.payload.province, action.payload);
      return { ...state, riskScores: newMap };
    }

    default:
      return state;
  }
}

// === CONTEXT ===

interface PredictionContextType {
  state: PredictionState;
  dispatch: React.Dispatch<PredictionAction>;
  // Convenience methods
  setProvince: (province: string | null) => void;
  setMonth: (month: number) => void;
  setScenario: (scenarioId: string) => void;
  initializeRiskScores: () => void;
  generatePredictions: (province: string) => void;
  getScenarioModifier: (type: DisasterType) => number;
}

const PredictionContext = createContext<PredictionContextType | null>(null);

// === PROVIDER ===

interface PredictionProviderProps {
  children: ReactNode;
}

export function PredictionProvider({ children }: PredictionProviderProps) {
  const [state, dispatch] = useReducer(predictionReducer, initialState);

  const setProvince = useCallback((province: string | null) => {
    dispatch({ type: "SET_PROVINCE", payload: province });
  }, []);

  const setMonth = useCallback((month: number) => {
    dispatch({ type: "SET_MONTH", payload: month });
  }, []);

  const setScenario = useCallback((scenarioId: string) => {
    dispatch({ type: "SET_SCENARIO", payload: scenarioId });
  }, []);

  // Initialize risk scores for all provinces
  const initializeRiskScores = useCallback(() => {
    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const provinces = getAllProvinces();
      const scenario = SCENARIOS.find((s) => s.id === state.selectedScenario);
      const result = new Map<string, ProvinceRisk>();

      for (const province of provinces) {
        const types: DisasterType[] = ["flood", "storm", "landslide", "drought", "earthquake", "tsunami"];
        const risks = {} as Record<DisasterType, import("./types").RiskScore>;
        let totalScore = 0;
        let highestScore = 0;
        let topThreat: DisasterType = "flood";

        for (const type of types) {
          const modifier = scenario?.modifiers[type] ?? 1.0;
          const risk = calculateRiskScore(province, type, state.selectedMonth, undefined, modifier);
          risks[type] = risk;
          totalScore += risk.score;
          if (risk.score > highestScore) {
            highestScore = risk.score;
            topThreat = type;
          }
        }

        const overallRisk = totalScore / types.length;
        const prevMonth = (state.selectedMonth + 11) % 12;
        const nextMonth = (state.selectedMonth + 1) % 12;
        const prevMod = scenario?.modifiers[topThreat] ?? 1.0;
        const nextMod = scenario?.modifiers[topThreat] ?? 1.0;
        const prevScore = calculateRiskScore(province, topThreat, prevMonth, undefined, prevMod).score;
        const nextScore = calculateRiskScore(province, topThreat, nextMonth, undefined, nextMod).score;

        let trend: "increasing" | "stable" | "decreasing";
        if (nextScore > overallRisk + 0.05) trend = "increasing";
        else if (nextScore < overallRisk - 0.05) trend = "decreasing";
        else trend = "stable";

        result.set(province, { province, risks, overallRisk, topThreat, trend });
      }

      dispatch({ type: "SET_RISK_SCORES", payload: result });
      dispatch({ type: "SET_ERROR", payload: null });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        payload: err instanceof Error ? err.message : "Failed to calculate risks",
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [state.selectedMonth, state.selectedScenario]);

  // Generate predictions for a specific province
  const generatePredictions = useCallback(
    (province: string) => {
      const types: DisasterType[] = [
        "flood", "storm", "landslide", "drought", "earthquake", "tsunami",
      ];

      const newPredictions = new Map(state.predictions);

      for (const type of types) {
        const key = `${province}-${type}`;
        if (newPredictions.has(key)) continue;

        // Build historical data (12 months of risk scores)
        const historical: number[] = [];
        for (let m = 0; m < 12; m++) {
          historical.push(calculateRiskScore(province, type, m).score);
        }

        const result = predictionEngine.predict(
          historical,
          PREDICTION_CONFIG.MONTHS_AHEAD
        );

        const predResult: PredictionResult = {
          province,
          disasterType: type,
          historicalData: historical,
          predictions: result.predictions,
          trend: result.trend,
          confidence: result.confidence,
          strategy: result.strategy,
        };

        newPredictions.set(key, predResult);
      }

      dispatch({ type: "SET_PREDICTIONS", payload: newPredictions });
    },
    [state.predictions]
  );

  // Get current scenario modifier for a disaster type
  const getScenarioModifier = useCallback(
    (type: DisasterType): number => {
      const scenario = SCENARIOS.find((s) => s.id === state.selectedScenario);
      return scenario?.modifiers[type] ?? 1.0;
    },
    [state.selectedScenario]
  );

  const contextValue: PredictionContextType = {
    state,
    dispatch,
    setProvince,
    setMonth,
    setScenario,
    initializeRiskScores,
    generatePredictions,
    getScenarioModifier,
  };

  return (
    <PredictionContext.Provider value={contextValue}>
      {children}
    </PredictionContext.Provider>
  );
}

// === HOOK ===

export function usePrediction(): PredictionContextType {
  const context = useContext(PredictionContext);
  if (!context) {
    throw new Error("usePrediction must be used within a PredictionProvider");
  }
  return context;
}
