"""
Unit tests for data_utils module.
"""

import pytest
import pandas as pd
import numpy as np
from src.data_utils import (
    DataValidationError, DataProcessor, DataAnalyzer,
    analyze_data
)


class TestDataProcessor:
    """Test DataProcessor class."""
    
    @pytest.fixture
    def sample_census_data(self):
        """Create sample census data for testing."""
        return pd.DataFrame({
            'State name': ['Maharashtra', 'Tamil Nadu'],
            'District name': ['Mumbai', 'Chennai'],
            'Population': [10000000, 8000000],
            'Households': [2000000, 1600000],
            'Literate': [7000000, 6000000],
            'Having_latrine_facility_within_the_premises_Total_Households': [1800000, 1500000],
            'Housholds_with_Electric_Lighting': [1900000, 1550000],
            'Households_with_Telephone_Mobile_Phone': [1700000, 1400000]
        })
    
    def test_process_census_data_valid(self, sample_census_data):
        """Test processing of valid census data."""
        result = DataProcessor.process_census_data(sample_census_data)
        
        assert not result.empty
        assert len(result) > 0
        assert 'state' in result.columns
        assert 'district' in result.columns
        assert 'education_literacy_rate' in result.columns
    
    def test_process_census_data_missing_columns(self):
        """Test processing data with missing columns."""
        incomplete_data = pd.DataFrame({
            'State name': ['Maharashtra'],
            'District name': ['Mumbai']
        })
        
        with pytest.raises(DataValidationError):
            DataProcessor.process_census_data(incomplete_data)
    
    def test_validate_dataframe_valid(self, sample_census_data):
        """Test validation of valid dataframe."""
        processed = DataProcessor.process_census_data(sample_census_data)
        assert DataProcessor.validate_dataframe(processed, min_rows=1)
    
    def test_validate_dataframe_empty(self):
        """Test validation of empty dataframe."""
        empty_df = pd.DataFrame()
        
        with pytest.raises(DataValidationError):
            DataProcessor.validate_dataframe(empty_df)


class TestDataAnalyzer:
    """Test DataAnalyzer class."""
    
    def test_analyze_indicator_positive_trend(self):
        """Test analysis of indicator with positive trend."""
        values = [50.0, 55.0, 60.0, 65.0]
        years = [2020, 2021, 2022, 2023]
        
        result = DataAnalyzer.analyze_indicator(values, years)
        
        assert result['latest_value'] == 65.0
        assert result['previous_value'] == 60.0
        assert result['trend'] == 'increasing'
    
    def test_analyze_indicator_negative_trend(self):
        """Test analysis of indicator with negative trend."""
        values = [80.0, 75.0, 70.0, 65.0]
        years = [2020, 2021, 2022, 2023]
        
        result = DataAnalyzer.analyze_indicator(values, years)
        
        assert result['latest_value'] == 65.0
        assert result['trend'] == 'decreasing'
    
    def test_analyze_indicator_stable(self):
        """Test analysis of stable indicator."""
        values = [70.0, 70.5, 70.2, 70.1]
        years = [2020, 2021, 2022, 2023]
        
        result = DataAnalyzer.analyze_indicator(values, years)
        
        assert result['trend'] == 'stable'
    
    def test_analyze_indicator_insufficient_data(self):
        """Test analysis with insufficient data."""
        result = DataAnalyzer.analyze_indicator([], [])
        
        assert result['latest_value'] is None
        assert result['trend'] == 'insufficient_data'


class TestAnalyzeDataFunction:
    """Test analyze_data function."""
    
    def test_analyze_data_valid(self):
        """Test analyze_data with valid input."""
        df = pd.DataFrame({
            'year': [2020, 2021, 2022, 2023],
            'value': [50.0, 55.0, 60.0, 65.0]
        })
        
        result = analyze_data(df, 'value')
        
        assert result['latest_value'] == 65.0
        assert result['forecast'] is not None
    
    def test_analyze_data_empty(self):
        """Test analyze_data with empty dataframe."""
        df = pd.DataFrame()
        
        result = analyze_data(df, 'value')
        
        assert result['latest_value'] is None
        assert result['trend'] == 'insufficient_data'
    
    def test_analyze_data_missing_column(self):
        """Test analyze_data with missing column."""
        df = pd.DataFrame({'year': [2020, 2021]})
        
        result = analyze_data(df, 'missing_col')
        
        assert result['latest_value'] is None


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
