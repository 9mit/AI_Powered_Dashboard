import pandas as pd
import numpy as np

def generate_simulated_data():
    """
    Generates simulated development indicator data for Indian states and districts over time.
    """
    years = list(range(2015, 2025))
    states = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
        'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
        'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
        'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
        'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ]
    districts = {
        'Andhra Pradesh': ['Visakhapatnam', 'Guntur', 'Nellore'],
        'Arunachal Pradesh': ['Itanagar', 'Tawang', 'Bomdila'],
        'Assam': ['Guwahati', 'Dibrugarh', 'Silchar'],
        'Bihar': ['Patna', 'Gaya', 'Muzaffarpur'],
        'Chhattisgarh': ['Raipur', 'Bilaspur', 'Durg'],
        'Goa': ['Panaji', 'Margao', 'Vasco da Gama'],
        'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara'],
        'Haryana': ['Gurugram', 'Faridabad', 'Panipat'],
        'Himachal Pradesh': ['Shimla', 'Mandi', 'Dharamshala'],
        'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad'],
        'Karnataka': ['Bengaluru', 'Mysuru', 'Hubli'],
        'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode'],
        'Madhya Pradesh': ['Bhopal', 'Indore', 'Jabalpur'],
        'Maharashtra': ['Mumbai', 'Pune', 'Nagpur'],
        'Manipur': ['Imphal', 'Churachandpur', 'Thoubal'],
        'Meghalaya': ['Shillong', 'Tura', 'Jowai'],
        'Mizoram': ['Aizawl', 'Lunglei', 'Saiha'],
        'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung'],
        'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela'],
        'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar'],
        'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur'],
        'Sikkim': ['Gangtok', 'Namchi', 'Gyalshing'],
        'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
        'Telangana': ['Hyderabad', 'Warangal', 'Karimnagar'],
        'Tripura': ['Agartala', 'Udaipur', 'Dharmanagar'],
        'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Varanasi'],
        'Uttarakhand': ['Dehradun', 'Haridwar', 'Nainital'],
        'West Bengal': ['Kolkata', 'Howrah', 'Siliguri']
    }

    data_records = []

    for state in states:
        state_districts = districts.get(state, [f"{state} District 1"]) # Fallback if no districts defined
        for district in state_districts:
            for year in years:
                record = {
                    'state': state,
                    'district': district,
                    'year': year,
                    # Education: Literacy Rate (percentage)
                    'education_literacy_rate': round(np.random.uniform(60, 95), 2),
                    # Healthcare: Doctor-Patient Ratio (doctors per 1000 population)
                    'healthcare_doctor_patient_ratio': round(np.random.uniform(0.5, 2.0), 2),
                    # Infrastructure: Road Density (km per 100 sq km)
                    'infrastructure_road_density': round(np.random.uniform(50, 150), 2),
                    # Digital/Financial Inclusion: Bank Account Penetration (percentage of adults)
                    'digital_financial_inclusion_rate': round(np.random.uniform(40, 100), 2),
                }
                data_records.append(record)
    return pd.DataFrame(data_records)

def analyze_data(df, indicator):
    """
    Performs simple forecasting and anomaly detection for a given indicator.

    Args:
        df (pd.DataFrame): DataFrame containing time-series data for one indicator.
                          Expected columns: 'year', 'value'.
        indicator (str): The name of the indicator column to analyze (e.g., 'value').

    Returns:
        dict: Contains forecast, anomaly status, and details.
    """
    if df.empty:
        return {'forecast': None, 'is_anomaly': False, 'anomaly_details': None, 'latest_value': None, 'previous_value': None}

    values = df[indicator].tolist()
    years = df['year'].tolist()

    latest_value = values[-1]
    previous_value = values[-2] if len(values) >= 2 else None

    # Simple linear forecast (slope of last 3 points)
    forecast = None
    if len(values) >= 3:
        # Calculate slope based on last three data points
        x = np.array(years[-3:])
        y = np.array(values[-3:])
        # Simple linear regression for slope (m = (nΣxy - ΣxΣy) / (nΣx^2 - (Σx)^2))
        n = len(x)
        sum_xy = np.sum(x * y)
        sum_x = np.sum(x)
        sum_y = np.sum(y)
        sum_x_sq = np.sum(x**2)

        try:
            slope = (n * sum_xy - sum_x * sum_y) / (n * sum_x_sq - sum_x**2)
            # Forecast for the next year (current_year + 1)
            forecast = latest_value + slope
        except ZeroDivisionError:
            # Handle cases where denominator is zero (e.g., all x values are the same)
            forecast = latest_value # No change expected
    elif len(values) > 0:
        forecast = latest_value # If not enough data, forecast is just the last value

    # Simple anomaly detection: outside 2 standard deviations
    is_anomaly = False
    anomaly_details = None
    if len(values) > 1: # Need at least 2 points to calculate std dev
        avg = np.mean(values)
        std_dev = np.std(values)

        if std_dev > 0: # Avoid division by zero
            if latest_value < avg - 2 * std_dev or latest_value > avg + 2 * std_dev:
                is_anomaly = True
                anomaly_details = f"Value ({latest_value:.2f}) is outside 2 standard deviations from the average ({avg:.2f})."

    return {
        'forecast': round(forecast, 2) if forecast is not None else None,
        'is_anomaly': is_anomaly,
        'anomaly_details': anomaly_details,
        'latest_value': round(latest_value, 2) if latest_value is not None else None,
        'previous_value': round(previous_value, 2) if previous_value is not None else None
    }
