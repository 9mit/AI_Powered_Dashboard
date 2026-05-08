"""
Configuration module for India Development Goals Dashboard.
Handles all configuration management including validation and security.
"""

import os
from dataclasses import dataclass
from typing import Optional
import logging

logger = logging.getLogger(__name__)


@dataclass
class Config:
    """Base configuration class with security validations."""
    
    # Application Settings
    APP_NAME: str = "India Development Goals Dashboard"
    APP_VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Data Settings
    DATA_SOURCE_URL: str = "https://raw.githubusercontent.com/mrinalcs/india-literacy/master/india-districts-census-2011.csv"
    DATA_CACHE_FILE: str = "assets/processed_data.csv"
    DATA_CACHE_TIMEOUT: int = 3600  # 1 hour in seconds
    DATA_REQUEST_TIMEOUT: int = 15  # seconds
    DATA_MAX_RETRIES: int = 3
    DATA_RETRY_DELAY: int = 2  # seconds
    
    # UI/UX Settings
    PAGE_LAYOUT: str = "wide"
    PAGE_TITLE: str = "India Development Goals Dashboard"
    PAGE_ICON: str = "🇮🇳"
    
    # Security Settings
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50 MB
    ALLOWED_FILE_TYPES: tuple = ('.csv', '.xlsx', '.xls', '.json')
    ENABLE_SECURITY_HEADERS: bool = True
    SESSION_TIMEOUT: int = 1800  # 30 minutes
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    LOG_FILE: Optional[str] = None
    
    # Performance
    CACHE_ENABLED: bool = True
    MAX_CACHE_ENTRIES: int = 1000
    
    @classmethod
    def from_env(cls) -> 'Config':
        """Load configuration from environment variables."""
        config = cls()
        
        # Override with environment variables
        config.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
        config.DATA_CACHE_TIMEOUT = int(os.getenv("DATA_CACHE_TIMEOUT", config.DATA_CACHE_TIMEOUT))
        config.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
        
        return config
    
    def validate(self) -> bool:
        """Validate configuration settings."""
        try:
            # Validate timeouts
            if self.DATA_REQUEST_TIMEOUT <= 0:
                raise ValueError("DATA_REQUEST_TIMEOUT must be positive")
            
            if self.DATA_CACHE_TIMEOUT < 0:
                raise ValueError("DATA_CACHE_TIMEOUT cannot be negative")
            
            # Validate file size
            if self.MAX_FILE_SIZE <= 0:
                raise ValueError("MAX_FILE_SIZE must be positive")
            
            logger.info("Configuration validation passed")
            return True
        except ValueError as e:
            logger.error(f"Configuration validation failed: {e}")
            return False


class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    DATA_CACHE_TIMEOUT = 300  # 5 minutes for faster iteration


class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    LOG_LEVEL = "WARNING"
    ENABLE_SECURITY_HEADERS = True
    SESSION_TIMEOUT = 3600  # 1 hour


class TestingConfig(Config):
    """Testing configuration."""
    DEBUG = True
    LOG_LEVEL = "DEBUG"
    DATA_CACHE_FILE = "test_data.csv"
    CACHE_ENABLED = False


def get_config() -> Config:
    """Get appropriate configuration based on environment."""
    env = os.getenv("ENV", "development").lower()
    
    config_map = {
        "development": DevelopmentConfig,
        "production": ProductionConfig,
        "testing": TestingConfig,
    }
    
    config_class = config_map.get(env, DevelopmentConfig)
    config = config_class.from_env()
    
    if not config.validate():
        raise RuntimeError("Configuration validation failed")
    
    return config
