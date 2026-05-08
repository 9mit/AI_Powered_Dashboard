# 🇮🇳 India Development Goals Dashboard v2.0

[![Python 3.11+](https://img.shields.io/badge/python-3.11+-blue.svg)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/streamlit-1.28+-green.svg)](https://streamlit.io/)
[![Docker](https://img.shields.io/badge/docker-enabled-blue.svg)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A **production-ready**, **luxury-designed** analytics platform for monitoring and visualizing India's progress toward key development goals across education, healthcare, infrastructure, and digital/financial inclusion.

## ✨ Key Features

### 🎨 Premium Design System
- **Luxury Color Palette**: Royal Blue (#1E3A8A), Rich Cream (#FFF8E7), Developer's Black (#1A1A2E), Gold Accents (#D4AF37)
- **Responsive UI**: Fully responsive for desktop, tablet, and mobile devices
- **Interactive Visualizations**: Plotly-powered dynamic charts with smooth animations
- **Accessibility**: WCAG 2.1 Level AA compliance

### 📊 Advanced Analytics
- **Real-time Processing**: Cached data with configurable refresh intervals
- **Forecasting**: Linear regression predictions for future trends
- **Anomaly Detection**: Z-score based statistical analysis
- **Comparative Analysis**: Multi-dimensional radar visualization

### 🔒 Security & Privacy
- **100% Offline-Capable**: No external API dependencies required
- **Privacy-First**: All data processing local to the application
- **Input Validation**: Comprehensive sanitization
- **Error Handling**: Robust exception management

### 📦 Production Ready
- **Docker Support**: Containerized deployment
- **CI/CD Pipeline**: Automated testing and deployment
- **Testing Suite**: Unit tests with pytest
- **Monitoring**: Comprehensive logging

## 🚀 Quick Start

### Prerequisites
- Python 3.11 or higher
- 50MB free disk space

### Installation

1. **Clone repository**:
```bash
git clone https://github.com/yourusername/Development_dashboard.git
cd Development_dashboard
```

2. **Create virtual environment** (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/macOS
python3 -m venv venv
source venv/bin/activate
```

3. **Install dependencies**:
```bash
pip install -r requirements.txt
```

4. **Run application**:
```bash
streamlit run src/app.py
```

### Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# Direct Docker
docker build -t india-dev-dashboard .
docker run -p 8501:8501 india-dev-dashboard
```

## 📊 Data & Methodology

### Data Sources
- **Census of India 2011**: District-level development baseline
- **Open Data**: Freely available, no authentication required
- **Real-time Simulation**: Deterministic growth projections to 2024

### Key Indicators
| Indicator | Metric | Source |
|-----------|--------|--------|
| Education | Literacy Rate (%) | Census 2011 |
| Healthcare | Sanitation Access (%) | Census 2011 |
| Infrastructure | Electrification (%) | Census 2011 |
| Digital Inclusion | Mobile Connectivity (%) | Census 2011 |

## 📁 Project Structure

```
Development_dashboard/
├── src/
│   ├── app.py              # Main Streamlit application
│   ├── data_utils.py       # Data processing & analysis
│   ├── config.py           # Configuration management
│   └── __init__.py
├── tests/
│   ├── test_data_utils.py  # Unit tests
│   └── conftest.py
├── .github/workflows/
│   └── ci-cd.yml           # CI/CD pipeline
├── Dockerfile              # Container definition
├── docker-compose.yml      # Docker orchestration
├── requirements.txt        # Python dependencies
├── .env.example           # Environment template
└── readme.md              # Documentation
```

## 🧪 Testing

```bash
# Run all tests
pytest tests/ -v

# With coverage
pytest tests/ --cov=src

# Lint code
flake8 src/

# Format code
black src/
```

## 🔒 Security

### Deployment Best Practices
- Run behind reverse proxy (nginx/Traefik)
- Enable HTTPS/TLS
- Use environment variables for secrets
- Implement rate limiting
- Regular security updates

### Data Protection
- Census 2011 public data only
- No personal information
- Local-only processing
- Optional caching

## 📞 Support

- **GitHub Issues**: [Report bugs](https://github.com/yourusername/Development_dashboard/issues)
- **Documentation**: See this readme for detailed information
- **Email**: support@example.com

## 📄 License

MIT License - see LICENSE file for details

## 👥 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/improvement`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/improvement`)
5. Open Pull Request

## 🎯 Roadmap

- [ ] Real-time API integration
- [ ] User authentication
- [ ] Mobile app
- [ ] Multi-language support
- [ ] Advanced ML models (ARIMA, Prophet)
- [ ] PDF export reports

---

**Made with ❤️ for India's development progress**

