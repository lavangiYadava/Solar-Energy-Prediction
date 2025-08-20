# model.py  — import-safe, no work at top level

from __future__ import annotations
import os
from functools import lru_cache
import numpy as np
import pandas as pd
from sklearn.model_selection import KFold, train_test_split, learning_curve
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.feature_selection import RFE
from sklearn.pipeline import Pipeline

try:
    import joblib  # optional but recommended
except ImportError:
    joblib = None

# ---------------------------
# Public util: plot learning curve
# ---------------------------
import matplotlib.pyplot as plt


def plot_learning_curve_util(estimator, X, y, cv=None, n_jobs=None, scoring=None, title="Learning Curve"):
    train_sizes, train_scores, test_scores = learning_curve(
        estimator, X, y, cv=cv, n_jobs=n_jobs, scoring=scoring
    )
    plt.figure(figsize=(10, 6))
    plt.plot(train_sizes, train_scores.mean(axis=1), label='Training score')
    plt.plot(train_sizes, test_scores.mean(axis=1), label='Validation score')
    plt.title(title)
    plt.xlabel('Training Size')
    plt.ylabel('Score')
    plt.legend()
    return plt.gcf()  # return figure so caller decides to show/save


# ---------------------------
# Model build/train/persist
# ---------------------------
MODEL_PATH = os.environ.get("x")
DEFAULT_DF_PATH = "x"
# Option B: Use environment variable

FEATURE_COLUMNS = [
    'Date', 'Time', 'Latitude', 'Longitude', 'Altitude', 'YRMODAHRMI', 'Month', 'Hour',
    'Humidity', 'AmbientTemp', 'Wind.Speed', 'Visibility', 'Pressure', 'Cloud.Ceiling'
]
TARGET_COLUMN = 'PolyPwr'


def _build_pipeline(n_features: int | None = None) -> Pipeline:
    etr = ExtraTreesRegressor(random_state=42)
    rfe = RFE(etr, n_features_to_select=n_features)
    pipe = Pipeline([
        ('scaler', StandardScaler()),
        ('rfe', rfe),
        ('etr', etr),
    ])
    return pipe


def _load_dataframe(df_path: str) -> pd.DataFrame:
    df = pd.read_csv(df_path)
    # clean / encode here (your previous code did one-hot, drops, etc.)
    # If you really need the earlier transforms, move them here so training & inference match.
    return df


def _train_pipeline(df_path: str, n_splits: int = 3) -> Pipeline:
    df = _load_dataframe(df_path)

    # Prepare features/target
    data_excluded = df.drop(columns=['Location', 'Season'], errors='ignore')
    y = data_excluded[TARGET_COLUMN]
    X = data_excluded.drop(columns=[TARGET_COLUMN])

    # Optionally: enforce column order if your predict() will create rows manually
    # X = X.reindex(columns=FEATURE_COLUMNS)

    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)
    cv = KFold(n_splits=n_splits, shuffle=True, random_state=42)

    pipe = _build_pipeline()  # you can choose n_features
    pipe.fit(X_train, y_train)
    # (Optional) evaluate with cross_val here if you want

    return pipe


def _ensure_dir(path: str):
    os.makedirs(os.path.dirname(path), exist_ok=True)


def train_and_save(df_path: str, out_path: str = MODEL_PATH) -> str:
    pipe = _train_pipeline(df_path)
    if joblib is None:
        raise RuntimeError("joblib not installed: pip install joblib")
    _ensure_dir(out_path)
    joblib.dump(pipe, out_path)
    return out_path


def _load_saved_pipeline(path: str) -> Pipeline | None:
    if joblib is None or not os.path.exists(path):
        return None
    try:
        return joblib.load(path)
    except Exception:
        return None


@lru_cache(maxsize=1)
def get_pipeline(df_path: str | None = DEFAULT_DF_PATH) -> Pipeline:
    """
    Lazy accessor. First call tries to load a saved model; if none exists and df_path
    is provided, trains and saves one. Subsequent calls reuse the cached instance.
    """
    pipe = _load_saved_pipeline(MODEL_PATH)
    if pipe is not None:
        return pipe
    if not df_path:
        raise RuntimeError("No trained model found and no dataset path provided. "
                           "Set SOLAR_CSV_PATH or pass df_path to get_pipeline().")
    # Train once, save, then return
    train_and_save(df_path, MODEL_PATH)
    return _load_saved_pipeline(MODEL_PATH)


# ---------------------------
# Inference helper
# ---------------------------

def _row_from_kwargs(**kw) -> pd.DataFrame:
    """
    Build a single-row DataFrame from keyword args. Ensures column order matches training.
    """
    # Ensure all required columns exist; fill missing with np.nan or defaults
    row = {col: kw.get(col) for col in FEATURE_COLUMNS}
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def predict_power(*, pipeline: Pipeline | None = None, **features) -> float:
    """
    Predict power (PolyPwr) for a single sample.
    Usage:
        y = predict_power(pipeline=get_pipeline(...),
                          Date=20231231, Time=1533, Latitude=..., Longitude=..., Altitude=..., ...)
    """
    pipe = pipeline or get_pipeline()
    X_row = _row_from_kwargs(**features)
    y_pred = pipe.predict(X_row)
    return float(y_pred[0])


# ---------------------------
# Optional CLI / demo (runs only if called directly)
# ---------------------------
if __name__ == "__main__":
    # Example: python model.py /path/to/data.csv
    import sys

    csv_path = sys.argv[1] if len(sys.argv) > 1 else (DEFAULT_DF_PATH or "x")
    if not csv_path:
        print("Provide path to CSV or set SOLAR_CSV_PATH env var.")
        sys.exit(1)

    print("Training model...")
    saved = train_and_save(csv_path)
    print("Saved to:", saved)

    # # quick demo prediction (fill your actual values)
    # demo = dict(
    #     Date=20231231, Time=1533, Latitude=32.929188, Longitude=-97.155715, Altitude=84,
    #     YRMODAHRMI=2.01712e11, Month=12, Hour=15, Humidity=44, AmbientTemp=13.8889,
    #     'Wind.Speed'=11.2654, Visibility=16.0934, Pressure=1019.6375907859999, 'Cloud.Ceiling'=12.192
    # )
    # y = predict_power(**demo)
    # print("Demo prediction:", y)
