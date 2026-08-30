import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
SYNTHETIC_DATA_DIR = DATA_DIR / "synthetic"
BASELINE_DATA_DIR = DATA_DIR / "baseline"
MODELS_DIR = BASE_DIR / "models_store"
DB_PATH = SYNTHETIC_DATA_DIR / "baghewala_twin.db"

# Ensure runtime directories exist
for directory in [DATA_DIR, RAW_DATA_DIR, SYNTHETIC_DATA_DIR, BASELINE_DATA_DIR, MODELS_DIR]:
    directory.mkdir(parents=True, exist_ok=True)

def get_database_url() -> str:
    url = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql://", 1)
    return url

class Settings(BaseModel):
    PROJECT_NAME: str = "Baghewala Heavy-Oil Well-to-Surface Digital Twin"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = get_database_url()
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")
    
    # Baghewala Field Characteristics (Heavy Oil)
    FIELD_NAME: str = "Baghewala"
    FORMATION: str = "Jodhpur / Bikaner-Nagaur Sandstone"
    CRUDE_API: float = 17.5  # Heavy oil API gravity (~14-19 API)
    BASE_RESERVOIR_TEMP_C: float = 38.0  # Native virgin reservoir temperature (°C)
    STEAM_INJECTION_TEMP_C: float = 240.0  # Saturated steam temperature at injection pressure (°C)
    RESERVOIR_DEPTH_M: float = 1050.0  # Average true vertical depth (meters)
    RESERVOIR_PRESSURE_BAR: float = 75.0  # Initial reservoir pressure (bar)
    
settings = Settings()
