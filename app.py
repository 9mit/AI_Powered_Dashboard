import streamlit as st
import pandas as pd
import plotly.express as px
from data_utils import generate_simulated_data, analyze_data
from llm_service import call_gemini_api
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Set page configuration
st.set_page_config(layout="wide", page_title="India Development Goals Dashboard", page_icon="🇮🇳")

# Check for GEMINI_API_KEY
gemini_api_key_available = os.getenv("GEMINI_API_KEY") is not None

# --- Data Loading and Initialization ---
@st.cache_data
def load_data():
    """Loads and caches the simulated data."""
    return generate_simulated_data()

df = load_data()

# Initialize session state variables if they don't exist
if 'selected_state' not in st.session_state:
    st.session_state.selected_state = df['state'].iloc[0] if not df.empty else ''
if 'selected_district' not in st.session_state:
    # Set initial district based on the default selected state
    initial_districts = df[df['state'] == st.session_state.selected_state]['district'].unique()
    st.session_state.selected_district = initial_districts[0] if len(initial_districts) > 0 else ''

# --- Header ---
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.5em;
        font-weight: bold;
        color: #4A00B0;
        text-align: center;
        margin-bottom: 1.5em;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    .main-header svg {
        margin-right: 0.5em;
        color: #6B21A8;
    }
    .stSelectbox > div > div {
        border-radius: 0.5rem;
        border: 1px solid #d1d5db;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }
    .stButton > button {
        background-color: #8B5CF6; /* Purple-600 */
        color: white;
        font-weight: bold;
        padding: 0.5rem 1rem;
        border-radius: 0.5rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        background-color: #7C3AED; /* Purple-700 */
        transform: scale(1.02);
    }
    .stButton > button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.5); /* Ring-2 Purple-500 */
    }
    .stTextInput > div > div > input {
        border-radius: 0.5rem;
        border: 1px solid #d1d5db;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        padding: 0.5rem 1rem;
    }
    .metric-card {
        background-color: white;
        border-radius: 0.75rem; /* rounded-xl */
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
        padding: 1.5rem; /* p-6 */
        border: 1px solid #e5e7eb; /* border-gray-200 */
        margin-bottom: 1.5rem;
    }
    .chart-card {
        background-color: white;
        border-radius: 0.75rem; /* rounded-xl */
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05); /* shadow-lg */
        padding: 1.5rem; /* p-6 */
        border: 1px solid #e5e7eb; /* border-gray-200 */
        margin-bottom: 1.5rem;
    }
    .llm-panel {
        background-color: #F3E8FF; /* Purple-50 */
        border: 1px solid #DDAAFF; /* Purple-200 */
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    .llm-panel-green {
        background-color: #ECFDF5; /* Green-50 */
        border: 1px solid #A7F3D0; /* Green-200 */
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    .llm-panel-orange {
        background-color: #FFF7ED; /* Orange-50 */
        border: 1px solid #FED7AA; /* Orange-200 */
        border-radius: 0.75rem;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }
    .llm-output {
        background-color: white;
        padding: 1rem;
        border-radius: 0.375rem; /* rounded-md */
        border: 1px solid #d1d5db; /* border-gray-300 */
        min-height: 100px;
        white-space: pre-wrap;
    }
    </style>
    <div class="main-header">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-home"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        India Development Goals Dashboard
    </div>
    """,
    unsafe_allow_html=True
)

# --- Filters ---
all_states = df['state'].unique().tolist()
all_states.sort()

col1, col2 = st.columns(2)

with col1:
    selected_state = st.selectbox(
        "Select State:",
        options=all_states,
        key='state_select',
        on_change=lambda: st.session_state.update(selected_district=df[df['state'] == st.session_state.state_select]['district'].unique()[0] if not df[df['state'] == st.session_state.state_select].empty else '')
    )
    st.session_state.selected_state = selected_state

with col2:
    districts_for_selected_state = df[df['state'] == st.session_state.selected_state]['district'].unique().tolist()
    districts_for_selected_state.sort()
    selected_district = st.selectbox(
        "Select District:",
        options=districts_for_selected_state,
        key='district_select'
    )
    st.session_state.selected_district = selected_district

# Filtered data for charts and insights
filtered_df = df[(df['state'] == st.session_state.selected_state) & (df['district'] == st.session_state.selected_district)].sort_values(by='year')

# --- AI/ML Insights Panel ---
st.markdown(
    f"""
    <div class="metric-card" style="background-color: #E0F2F7; border-color: #B2EBF2;">
        <h2 style="font-size:1.25em; font-weight:600; color:#00796B; margin-bottom:1rem; display:flex; align-items:center;">
            💡 AI/ML Insights for {st.session_state.selected_district}, {st.session_state.selected_state}
        </h2>
    </div>
    """,
    unsafe_allow_html=True
)

insights_data = {
    'education_literacy_rate': {'name': 'Literacy Rate (%)', 'icon': '📚', 'color': '#8884d8'},
    'healthcare_doctor_patient_ratio': {'name': 'Doctor-Patient Ratio', 'icon': '❤️', 'color': '#82ca9d'},
    'infrastructure_road_density': {'name': 'Road Density (km/100sqkm)', 'icon': '🏗️', 'color': '#ffc658'},
    'digital_financial_inclusion_rate': {'name': 'Bank Account Penetration (%)', 'icon': '💰', 'color': '#ff7300'},
}

cols_insights = st.columns(len(insights_data))

for i, (key, info) in enumerate(insights_data.items()):
    indicator_df = filtered_df[['year', key]].rename(columns={key: 'value'})
    analysis_result = analyze_data(indicator_df, 'value')

    latest_value = analysis_result['latest_value']
    previous_value = analysis_result['previous_value']
    forecast = analysis_result['forecast']
    is_anomaly = analysis_result['is_anomaly']
    anomaly_details = analysis_result['anomaly_details']

    delta_value = None
    if latest_value is not None and previous_value is not None:
        delta_value = round(latest_value - previous_value, 2)

    with cols_insights[i]:
        # The entire HTML block is now a single line to prevent Streamlit from adding extra <p> tags
        st.markdown(
            f"""<div style="background-color: white; border-radius: 0.5rem; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px 0 rgba(0,0,0,0.06); padding: 1rem; border: 1px solid #e5e7eb;"><div style="display: flex; align-items: center; margin-bottom: 0.5rem;"><span style="font-size: 1.25em; margin-right: 0.5rem;">{info['icon']}</span><h3 style="font-size: 1em; font-weight: 500; color: #374151;">{info['name']}</h3></div><div style="font-size: 0.9em; color: #4B5563; margin-bottom: 0.25rem;">Latest: <span style="font-weight: 600; color: #1F2937;">{latest_value if latest_value is not None else 'N/A'}</span>{f' ({delta_value:+})' if delta_value is not None else ''}</div><div style="font-size: 0.9em; color: #4B5563; margin-bottom: 0.25rem;">Forecast: <span style="font-weight: 600; color: #1F2937;">{forecast if forecast is not None else 'N/A'}</span></div><div style="font-size: 0.9em; color: { '#EF4444' if is_anomaly else '#10B981'};">Anomaly: <span style="font-weight: 600;">{ 'Yes' if is_anomaly else 'No'}</span>{f' - {anomaly_details}' if anomaly_details else ''}</div></div>""",
            unsafe_allow_html=True
        )

# --- Charts ---
st.markdown(
    """
    <div class="metric-card" style="background-color: #E0F7FA; border-color: #B2EBF2;">
        <h2 style="font-size:1.25em; font-weight:600; color:#00796B; margin-bottom:1rem; display:flex; align-items:center;">
            📊 Time-Series Visualizations
        </h2>
    </div>
    """,
    unsafe_allow_html=True
)

chart_cols = st.columns(2)

chart_configs = [
    {'data_key': 'education_literacy_rate', 'title': 'Education: Literacy Rate (%)', 'color': '#00BFFF'}, # Deep Sky Blue
    {'data_key': 'healthcare_doctor_patient_ratio', 'title': 'Healthcare: Doctor-Patient Ratio', 'color': '#32CD32'}, # Lime Green
    {'data_key': 'infrastructure_road_density', 'title': 'Infrastructure: Road Density (km/100sqkm)', 'color': '#FFD700'}, # Gold
    {'data_key': 'digital_financial_inclusion_rate', 'title': 'Digital/Financial Inclusion: Bank Account Penetration (%)', 'color': '#FF69B4'}, # Hot Pink
]

for i, config in enumerate(chart_configs):
    with chart_cols[i % 2]:
        # Removed the st.markdown(f'<div class="chart-card">') and </div>
        st.subheader(config['title'])
        if not filtered_df.empty:
            # Use partition to safely get the part after the first colon, or the whole string if no colon
            y_axis_label = config['title'].partition(':')[2].strip() or config['title'].strip()
            fig = px.line(
                filtered_df,
                x='year',
                y=config['data_key'],
                title=config['title'],
                labels={'year': 'Year', config['data_key']: y_axis_label},
                color_discrete_sequence=[config['color']]
            )
            fig.update_layout(
                xaxis_title="Year",
                yaxis_title=y_axis_label, # Use the safely parsed label here
                hovermode="x unified",
                margin=dict(l=20, r=20, t=40, b=20),
                height=350,
                template="plotly_dark" # Use dark theme for plotly charts
            )
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning("No data available for the selected district.")
        # Removed the st.markdown(f'</div>')


# --- LLM Integration Sections ---

# Helper function to generate LLM prompt strings
def generate_llm_prompt(prompt_type, current_question=''):
    base_data_string = f"Data points for {st.session_state.selected_district}, {st.session_state.selected_state} (Year: Indicator Value):\n"
    base_data_string += filtered_df.to_string(index=False) # Convert DataFrame to string for prompt

    insights_string = "AI/ML Insights (Latest Value, Forecast, Anomaly Status):\n"
    for key, info in insights_data.items():
        indicator_df = filtered_df[['year', key]].rename(columns={key: 'value'})
        analysis_result = analyze_data(indicator_df, 'value')
        insights_string += (
            f"{info['name']}: Latest: {analysis_result['latest_value'] if analysis_result['latest_value'] is not None else 'N/A'}, "
            f"Forecast (next year): {analysis_result['forecast'] if analysis_result['forecast'] is not None else 'N/A'}, "
            f"Anomaly: {'Yes - ' + analysis_result['anomaly_details'] if analysis_result['is_anomaly'] else 'No'}\n"
        )

    if prompt_type == 'summary':
        return f"""Generate a concise, actionable summary for policymakers, NGOs, and citizens based on the following development indicator data for {st.session_state.selected_district}, {st.session_state.selected_state}. Focus on key trends, areas of progress, potential concerns (anomalies), and future outlook (forecasts).

        {base_data_string}

        {insights_string}

        Provide a summary that highlights:
        1. Overall progress and key achievements.
        2. Areas needing attention or showing decline/anomalies.
        3. Forecasted trends for the next year.
        4. Actionable recommendations for each stakeholder type (policymakers, NGOs, citizens).
        """
    elif prompt_type == 'question':
        return f"""Based on the following development indicator data and AI/ML insights for {st.session_state.selected_district}, {st.session_state.selected_state}, answer the user's question concisely. If the information is not directly available, state that.

        {base_data_string}

        {insights_string}

        User's Question: "{current_question}"
        """
    elif prompt_type == 'recommendations':
        return f"""Based on the following development indicator data and AI/ML insights for {st.session_state.selected_district}, {st.session_state.selected_state}, generate specific, actionable policy recommendations for improving development goals in education, healthcare, infrastructure, and digital/financial inclusion. Consider trends, areas of concern (anomalies), and forecasted values.

        {base_data_string}

        {insights_string}

        Provide recommendations categorized by sector and suggest concrete steps.
        """
    return ""

# --- AI-Powered Policy Summary ---
st.markdown(
    """
    <div class="llm-panel">
        <h2 style="font-size:1.25em; font-weight:600; color:#6B21A8; margin-bottom:1rem; display:flex; align-items:center;">
            💡 AI-Powered Policy Summary
        </h2>
    </div>
    """,
    unsafe_allow_html=True
)
if not gemini_api_key_available:
    st.warning("Gemini API Key not found. Please set `GEMINI_API_KEY` in your `.env` file to enable LLM features.")
if st.button('✨ Generate Summary', key='generate_summary_btn', disabled=not gemini_api_key_available):
    with st.spinner('Generating summary...'):
        summary_prompt = generate_llm_prompt('summary')
        summary_text = call_gemini_api(summary_prompt)
        st.session_state.summary_text = summary_text
else:
    if 'summary_text' not in st.session_state:
        st.session_state.summary_text = 'Click "✨ Generate Summary" to get insights.'
st.markdown(f'<div class="llm-output">{st.session_state.summary_text}</div>', unsafe_allow_html=True)

# --- Ask a Question about the Data ---
st.markdown(
    """
    <div class="llm-panel-green">
        <h2 style="font-size:1.25em; font-weight:600; color:#065F46; margin-bottom:1rem; display:flex; align-items:center;">
            💬 Ask a Question about the Data
        </h2>
    </div>
    """,
    unsafe_allow_html=True
)
user_question = st.text_input("Enter your question:", key='user_question_input', placeholder="e.g., What is the trend for literacy rate?", disabled=not gemini_api_key_available)
if st.button('✨ Ask', key='ask_question_btn', disabled=not gemini_api_key_available):
    if user_question:
        with st.spinner('Answering...'):
            question_prompt = generate_llm_prompt('question', user_question)
            llm_answer = call_gemini_api(question_prompt)
            st.session_state.llm_answer = llm_answer
    else:
        st.session_state.llm_answer = 'Please enter a question.'
else:
    if 'llm_answer' not in st.session_state:
        st.session_state.llm_answer = 'Ask a question about the data above.'
st.markdown(f'<div class="llm-output">{st.session_state.llm_answer}</div>', unsafe_allow_html=True)


# --- Policy Recommendation Generator ---
st.markdown(
    """
    <div class="llm-panel-orange">
        <h2 style="font-size:1.25em; font-weight:600; color:#9A3412; margin-bottom:1rem; display:flex; align-items:center;">
            💼 Policy Recommendation Generator
        </h2>
    </div>
    """,
    unsafe_allow_html=True
)
if st.button('✨ Generate Policy Recommendations', key='generate_policy_btn', disabled=not gemini_api_key_available):
    with st.spinner('Generating recommendations...'):
        recommendations_prompt = generate_llm_prompt('recommendations')
        policy_recommendations = call_gemini_api(recommendations_prompt)
        st.session_state.policy_recommendations = policy_recommendations
else:
    if 'policy_recommendations' not in st.session_state:
        st.session_state.policy_recommendations = 'Click "✨ Generate Policy Recommendations" to get suggestions.'
st.markdown(f'<div class="llm-output">{st.session_state.policy_recommendations}</div>', unsafe_allow_html=True)
