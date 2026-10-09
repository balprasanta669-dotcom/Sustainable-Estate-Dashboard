"""
Machine Learning Training Pipeline for FacilityIQ India.
Trained on Real CPCB Air Quality & Institutional Microgrid Telemetry.
Uses NumPy & Pandas for high-speed mathematical optimization, feature engineering,
and model serialization (avoiding broken DLL dependencies).
"""

import os
import json
import math
import numpy as np
import pandas as pd
from datetime import datetime
from typing import Dict, Any, Tuple, List

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# ML Model 1: Ridge Autoregressive Forecaster
# ---------------------------------------------------------------------------
class RidgeForecaster:
    """
    Multivariate Autoregressive Ridge Regression Model with Cyclical Encoding.
    Minimizes: ||Xw - y||^2 + alpha * ||w||^2
    Analytical closed-form solution: w = (X^T X + alpha * I)^(-1) X^T y
    """
    def __init__(self, alpha: float = 1.0, lags: List[int] = [1, 2, 3, 24]):
        self.alpha = alpha
        self.lags = lags
        self.weights = None
        self.intercept = 0.0
        self.feature_names = []
        self.metrics = {}
        self.scaler = {"mean": {}, "std": {}}

    def _create_features(self, df: pd.DataFrame, target_col: str) -> Tuple[np.ndarray, np.ndarray, List[str]]:
        df = df.copy()
        if "timestamp" in df.columns:
            df["dt"] = pd.to_datetime(df["timestamp"])
            df["hour"] = df["dt"].dt.hour
            df["dow"] = df["dt"].dt.dayofweek
        else:
            df["hour"] = 12
            df["dow"] = 2

        # Cyclical temporal features
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24.0)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24.0)
        df["dow_sin"]  = np.sin(2 * np.pi * df["dow"] / 7.0)
        df["dow_cos"]  = np.cos(2 * np.pi * df["dow"] / 7.0)

        feature_cols = ["hour_sin", "hour_cos", "dow_sin", "dow_cos"]

        # Lag features
        for lag in self.lags:
            lag_col = f"{target_col}_lag_{lag}"
            df[lag_col] = df[target_col].shift(lag)
            feature_cols.append(lag_col)

        # Drop NaNs from lagging
        valid_df = df.dropna().reset_index(drop=True)
        X = valid_df[feature_cols].values
        y = valid_df[target_col].values
        return X, y, feature_cols

    def fit(self, df: pd.DataFrame, target_col: str) -> Dict[str, Any]:
        X_raw, y_raw, feature_names = self._create_features(df, target_col)
        self.feature_names = feature_names

        # Train/Test Split (80% Train, 20% Validation)
        n = len(X_raw)
        split = int(0.8 * n)
        X_train, X_val = X_raw[:split], X_raw[split:]
        y_train, y_val = y_raw[:split], y_raw[split:]

        # Standardize features
        x_mean = np.mean(X_train, axis=0)
        x_std = np.std(X_train, axis=0) + 1e-8
        self.scaler["mean"] = {f: float(m) for f, m in zip(feature_names, x_mean)}
        self.scaler["std"] = {f: float(s) for f, s in zip(feature_names, x_std)}

        X_train_norm = (X_train - x_mean) / x_std
        X_val_norm = (X_val - x_mean) / x_std

        # Add bias / intercept column
        X_b = np.c_[np.ones(len(X_train_norm)), X_train_norm]
        X_val_b = np.c_[np.ones(len(X_val_norm)), X_val_norm]

        # Ridge closed form solution
        d = X_b.shape[1]
        I = np.eye(d)
        I[0, 0] = 0.0 # Do not regularize intercept
        w = np.linalg.solve(X_b.T @ X_b + self.alpha * I, X_b.T @ y_train)

        self.intercept = float(w[0])
        self.weights = {f: float(wi) for f, wi in zip(feature_names, w[1:])}

        # Predict validation
        y_pred = X_val_b @ w
        mae = float(np.mean(np.abs(y_val - y_pred)))
        rmse = float(np.sqrt(np.mean((y_val - y_pred) ** 2)))
        ss_tot = np.sum((y_val - np.mean(y_val)) ** 2)
        ss_res = np.sum((y_val - y_pred) ** 2)
        r2 = float(1.0 - (ss_res / (ss_tot + 1e-9)))

        self.metrics = {
            "samples_train": int(len(X_train)),
            "samples_val": int(len(X_val)),
            "r2_score": round(max(-1.0, min(1.0, r2)), 4),
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "regularization_alpha": self.alpha,
            "trained_at": datetime.now().isoformat()
        }
        return self.metrics

    def predict_multi_step(self, recent_history: List[float], steps: int = 24, start_hour: int = 0) -> List[Dict[str, Any]]:
        """Multi-step autoregressive rolling forecast."""
        predictions = []
        history = list(recent_history)

        w_vec = np.array([self.weights.get(f, 0.0) for f in self.feature_names])
        x_mean = np.array([self.scaler["mean"].get(f, 0.0) for f in self.feature_names])
        x_std = np.array([self.scaler["std"].get(f, 1.0) for f in self.feature_names])

        curr_hour = start_hour
        curr_dow = datetime.now().weekday()

        for step in range(steps):
            h = (curr_hour + step) % 24
            dow = (curr_dow + (curr_hour + step) // 24) % 7
            
            # Construct row
            row_dict = {
                "hour_sin": np.sin(2 * np.pi * h / 24.0),
                "hour_cos": np.cos(2 * np.pi * h / 24.0),
                "dow_sin":  np.sin(2 * np.pi * dow / 7.0),
                "dow_cos":  np.cos(2 * np.pi * dow / 7.0),
            }
            for lag in self.lags:
                idx = -lag
                row_dict[f"target_lag_{lag}"] = history[idx] if len(history) >= lag else history[-1]

            row_vals = []
            for f in self.feature_names:
                # Match lag feature
                if "lag_" in f:
                    lag_num = int(f.split("_")[-1])
                    val = history[-lag_num] if len(history) >= lag_num else history[-1]
                else:
                    val = row_dict.get(f, 0.0)
                row_vals.append(val)

            row_norm = (np.array(row_vals) - x_mean) / x_std
            y_hat = float(self.intercept + np.dot(row_norm, w_vec))
            y_hat = max(0.0, y_hat) # Physical constraint

            # Add to rolling history
            history.append(y_hat)
            sigma = self.metrics.get("rmse", 10.0)
            predictions.append({
                "step": step + 1,
                "hour_ahead": step + 1,
                "predicted": round(y_hat, 2),
                "lower_ci": round(max(0.0, y_hat - 1.96 * sigma), 2),
                "upper_ci": round(y_hat + 1.96 * sigma, 2)
            })

        return predictions

    def save(self, filepath: str):
        payload = {
            "model_type": "RidgeForecaster",
            "alpha": self.alpha,
            "lags": self.lags,
            "feature_names": self.feature_names,
            "intercept": self.intercept,
            "weights": self.weights,
            "scaler": self.scaler,
            "metrics": self.metrics
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "RidgeForecaster":
        with open(filepath, "r", encoding="utf-8") as f:
            d = json.load(f)
        model = cls(alpha=d["alpha"], lags=d["lags"])
        model.feature_names = d["feature_names"]
        model.intercept = d["intercept"]
        model.weights = d["weights"]
        model.scaler = d["scaler"]
        model.metrics = d["metrics"]
        return model


# ---------------------------------------------------------------------------
# ML Model 2: Multivariate Mahalanobis Anomaly Detector
# ---------------------------------------------------------------------------
class MultivariateAnomalyDetector:
    """
    Multivariate Distance Anomaly Detection for Multi-Sensor Telemetry.
    Computes statistical Mahalanobis distances against empirical covariance.
    """
    def __init__(self, threshold_percentile: float = 95.0):
        self.threshold_percentile = threshold_percentile
        self.feature_names = []
        self.mean_vector = None
        self.inv_cov_matrix = None
        self.threshold_distance = 3.0
        self.metrics = {}

    def fit(self, df: pd.DataFrame, feature_cols: List[str]) -> Dict[str, Any]:
        self.feature_names = feature_cols
        X = df[feature_cols].dropna().values
        
        mean_vec = np.mean(X, axis=0)
        cov_matrix = np.cov(X, rowvar=False)
        # Add regularization to diagonal for numeric stability
        cov_matrix += np.eye(cov_matrix.shape[0]) * 1e-4
        inv_cov = np.linalg.pinv(cov_matrix)

        self.mean_vector = [float(v) for v in mean_vec]
        self.inv_cov_matrix = inv_cov.tolist()

        # Compute training distances to set empirical threshold
        diff = X - mean_vec
        dist_sq = np.sum((diff @ inv_cov) * diff, axis=1)
        distances = np.sqrt(np.maximum(0.0, dist_sq))
        
        self.threshold_distance = float(np.percentile(distances, self.threshold_percentile))
        
        self.metrics = {
            "samples_analyzed": int(len(X)),
            "features": feature_cols,
            "threshold_percentile": self.threshold_percentile,
            "threshold_distance": round(self.threshold_distance, 3),
            "max_distance": round(float(np.max(distances)), 3),
            "trained_at": datetime.now().isoformat()
        }
        return self.metrics

    def score(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        X = df[self.feature_names].values
        mean_vec = np.array(self.mean_vector)
        inv_cov = np.array(self.inv_cov_matrix)

        diff = X - mean_vec
        dist_sq = np.sum((diff @ inv_cov) * diff, axis=1)
        distances = np.sqrt(np.maximum(0.0, dist_sq))

        results = []
        for i, d in enumerate(distances):
            is_anomaly = bool(d > self.threshold_distance)
            results.append({
                "index": i,
                "mahalanobis_distance": round(float(d), 3),
                "threshold": round(self.threshold_distance, 3),
                "is_anomaly": is_anomaly,
                "anomaly_score": round(float(d / (self.threshold_distance + 1e-6)), 3)
            })
        return results

    def save(self, filepath: str):
        payload = {
            "model_type": "MultivariateAnomalyDetector",
            "threshold_percentile": self.threshold_percentile,
            "feature_names": self.feature_names,
            "mean_vector": self.mean_vector,
            "inv_cov_matrix": self.inv_cov_matrix,
            "threshold_distance": self.threshold_distance,
            "metrics": self.metrics
        }
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)

    @classmethod
    def load(cls, filepath: str) -> "MultivariateAnomalyDetector":
        with open(filepath, "r", encoding="utf-8") as f:
            d = json.load(f)
        model = cls(threshold_percentile=d["threshold_percentile"])
        model.feature_names = d["feature_names"]
        model.mean_vector = d["mean_vector"]
        model.inv_cov_matrix = d["inv_cov_matrix"]
        model.threshold_distance = d["threshold_distance"]
        model.metrics = d["metrics"]
        return model


# ---------------------------------------------------------------------------
# Training Orchestrator: Train All Models on Real Data
# ---------------------------------------------------------------------------
def train_all_models() -> Dict[str, Any]:
    """Train all real ML models on the real CPCB and campus datasets."""
    results = {}
    start_time = datetime.now()

    # 1. Train Air Quality AQI Forecaster
    aqi_csv = os.path.join(DATA_DIR, "cpcb_air_quality.csv")
    if os.path.exists(aqi_csv):
        df_aqi = pd.read_csv(aqi_csv)
        aqi_forecaster = RidgeForecaster(alpha=2.5, lags=[1, 2, 3, 24, 48])
        aqi_metrics = aqi_forecaster.fit(df_aqi, target_col="aqi")
        aqi_model_path = os.path.join(MODELS_DIR, "model_aqi_forecast.json")
        aqi_forecaster.save(aqi_model_path)
        results["air_quality_forecaster"] = {
            "target": "CPCB Indian AQI",
            "metrics": aqi_metrics,
            "artifact": aqi_model_path
        }

    # 2. Train Energy Consumption Forecaster
    energy_csv = os.path.join(DATA_DIR, "campus_energy.csv")
    if os.path.exists(energy_csv):
        df_energy = pd.read_csv(energy_csv)
        energy_forecaster = RidgeForecaster(alpha=1.5, lags=[1, 2, 3, 24])
        energy_metrics = energy_forecaster.fit(df_energy, target_col="total_consumption_kw")
        energy_model_path = os.path.join(MODELS_DIR, "model_energy_forecast.json")
        energy_forecaster.save(energy_model_path)
        results["energy_forecaster"] = {
            "target": "Institutional Campus Load (kW)",
            "metrics": energy_metrics,
            "artifact": energy_model_path
        }

    # 3. Train Multivariate Multi-Sensor Anomaly Detector
    if os.path.exists(aqi_csv):
        df_aqi = pd.read_csv(aqi_csv)
        detector = MultivariateAnomalyDetector(threshold_percentile=96.5)
        det_metrics = detector.fit(df_aqi, feature_cols=["pm25", "pm10", "no2", "co", "temperature_c", "humidity_pct"])
        det_path = os.path.join(MODELS_DIR, "model_multivariate_anomaly.json")
        detector.save(det_path)
        results["multivariate_anomaly_detector"] = {
            "target": "Environmental Sensor Array (PM2.5, PM10, NO2, CO, Temp, RH)",
            "metrics": det_metrics,
            "artifact": det_path
        }

    duration_s = (datetime.now() - start_time).total_seconds()
    results["training_summary"] = {
        "status": "COMPLETED",
        "duration_seconds": round(duration_s, 2),
        "models_trained": len([k for k in results if k != "training_summary"]),
        "timestamp": datetime.now().isoformat()
    }

    # Save summary metadata
    with open(os.path.join(MODELS_DIR, "training_manifest.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    out = train_all_models()
    print(json.dumps(out, indent=2))
