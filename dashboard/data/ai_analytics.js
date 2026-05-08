// AI Analytics Engine for India Development Dashboard

// Simple Linear Regression Model
class SimpleLinearRegression {
    predict(values, years) {
        const n = values.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y = values;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // Generate future predictions
        const predictions = [];
        for (let i = 0; i < years; i++) {
            const futureX = n + i;
            const prediction = slope * futureX + intercept;
            predictions.push(Math.max(0, Math.min(100, prediction))); // Bound between 0-100
        }
        
        return {
            slope,
            intercept,
            predictions,
            r2: this.calculateR2(x, y, slope, intercept)
        };
    }
    
    calculateR2(x, y, slope, intercept) {
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        const totalSumSquares = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
        const residualSumSquares = y.reduce((sum, yi, i) => {
            const predicted = slope * x[i] + intercept;
            return sum + Math.pow(yi - predicted, 2);
        }, 0);
        
        return 1 - (residualSumSquares / totalSumSquares);
    }
}

// Anomaly Detection Model
class AnomalyDetector {
    detect(values, threshold = 2) {
        if (!values || values.length === 0) return [];
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        
        const anomalies = [];
        values.forEach((value, index) => {
            if (stdDev === 0) return;
            const zScore = Math.abs((value - mean) / stdDev);
            if (zScore > threshold) {
                anomalies.push({
                    index,
                    value,
                    zScore,
                    severity: zScore > 3 ? 'high' : 'medium'
                });
            }
        });
        
        return anomalies;
    }
}

// NLP Processor for generating insights
class NLPProcessor {
    generateSummary(insight, template) {
        let summary = template;
        
        // Replace placeholders based on insight type
        if (insight.type === 'correlation') {
            summary = summary.replace('{factors}', this.extractFactors(insight.description));
        } else if (insight.type === 'trend') {
            summary = summary.replace('{metric}', this.extractMetric(insight.description));
        } else if (insight.type === 'opportunity') {
            summary = summary.replace('{location}', this.extractLocation(insight.description));
        }
        
        summary = summary.replace('{description}', insight.description);
        
        return summary;
    }
    
    extractFactors(description) {
        // Simple extraction logic
        if (description.includes('digital') && description.includes('financial')) {
            return 'digital and financial sectors';
        } else if (description.includes('literacy') && description.includes('healthcare')) {
            return 'education and healthcare systems';
        }
        return 'development indicators';
    }
    
    extractMetric(description) {
        const metrics = ['literacy', 'healthcare', 'digital', 'financial', 'infrastructure'];
        for (const metric of metrics) {
            if (description.toLowerCase().includes(metric)) {
                return metric;
            }
        }
        return 'development metrics';
    }
    
    extractLocation(description) {
        const states = ['UP', 'MH', 'BR', 'WB', 'AP', 'TN', 'RJ', 'KA'];
        for (const state of states) {
            if (description.includes(state)) {
                return state;
            }
        }
        return 'target regions';
    }
}

class AIAnalyticsEngine {
    constructor() {
        this.models = {
            regression: new SimpleLinearRegression(),
            anomalyDetector: new AnomalyDetector(),
            nlpProcessor: new NLPProcessor()
        };
        this.insights = [];
        this.predictions = {};
    }

    // Predictive Analytics using Linear Regression
    predictTrends(data, years = 5) {
        const predictions = {};
        
        Object.keys(data).forEach(sector => {
            predictions[sector] = {};
            Object.keys(data[sector]).forEach(metric => {
                const values = data[sector][metric];
                if (Array.isArray(values)) {
                    const trend = this.models.regression.predict(values, years);
                    predictions[sector][metric] = trend;
                }
            });
        });
        
        this.predictions = predictions;
        return predictions;
    }

    // Anomaly Detection
    detectAnomalies(data) {
        const anomalies = [];
        
        Object.keys(data).forEach(sector => {
            Object.keys(data[sector]).forEach(metric => {
                const values = data[sector][metric];
                if (Array.isArray(values)) {
                    const detected = this.models.anomalyDetector.detect(values);
                    if (detected.length > 0) {
                        anomalies.push({
                            sector,
                            metric,
                            anomalies: detected
                        });
                    }
                }
            });
        });
        
        return anomalies;
    }

    // Generate AI insights using pattern recognition
    generateInsights(data, stateData) {
        const insights = [];
        
        // Performance correlation analysis
        const correlations = this.analyzeCorrelations(stateData);
        insights.push(...correlations);
        
        // Growth trend analysis
        const trends = this.analyzeTrends(data);
        insights.push(...trends);
        
        // Investment opportunity identification
        const opportunities = this.identifyOpportunities(stateData);
        insights.push(...opportunities);
        
        // Policy impact analysis
        const policyImpacts = this.analyzePolicyImpacts(data);
        insights.push(...policyImpacts);
        
        this.insights = insights;
        return insights;
    }

    analyzeCorrelations(stateData) {
        const insights = [];
        const states = Object.keys(stateData);
        if (states.length === 0) return [];
        
        // Digital-Economic correlation
        const digitalEconCorr = this.calculateCorrelation(
            states.map(s => stateData[s].digital),
            states.map(s => stateData[s].financial)
        );
        
        if (digitalEconCorr > 0.7) {
            insights.push({
                type: 'correlation',
                title: 'Digital-Financial Synergy',
                description: `Strong correlation (${(digitalEconCorr * 100).toFixed(1)}%) between digital penetration and financial inclusion`,
                confidence: 0.85,
                actionable: true
            });
        }
        
        // Education-Healthcare correlation
        const eduHealthCorr = this.calculateCorrelation(
            states.map(s => stateData[s].literacy),
            states.map(s => stateData[s].healthcare)
        );
        
        if (eduHealthCorr > 0.6) {
            insights.push({
                type: 'correlation',
                title: 'Education-Health Nexus',
                description: `States with higher literacy show ${(eduHealthCorr * 100).toFixed(1)}% better healthcare outcomes`,
                confidence: 0.78,
                actionable: true
            });
        }
        
        return insights;
    }

    analyzeTrends(data) {
        const insights = [];
        
        // Fastest growing sectors
        const growthRates = {};
        Object.keys(data).forEach(sector => {
            Object.keys(data[sector]).forEach(metric => {
                const values = data[sector][metric];
                if (Array.isArray(values)) {
                    const growth = this.calculateGrowthRate(values);
                    growthRates[`${sector}_${metric}`] = growth;
                }
            });
        });
        
        const fastestGrowth = Object.entries(growthRates)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);
        
        fastestGrowth.forEach(([key, rate]) => {
            const [sector, metric] = key.split('_');
            insights.push({
                type: 'trend',
                title: `Accelerating Progress in ${sector}`,
                description: `${metric} shows exceptional growth rate of ${(rate * 100).toFixed(1)}% annually`,
                confidence: 0.82,
                actionable: true
            });
        });
        
        return insights;
    }

    identifyOpportunities(stateData) {
        const insights = [];
        const states = Object.keys(stateData);
        if (states.length === 0) return [];
        
        // Find underperforming states with high potential
        const opportunities = states.map(state => {
            const data = stateData[state];
            const avgScore = (data.literacy + data.healthcare + data.digital + data.financial) / 4;
            const potential = this.calculatePotential(data);
            
            return {
                state,
                current: avgScore,
                potential,
                gap: potential - avgScore
            };
        }).sort((a, b) => b.gap - a.gap);
        
        const topOpportunities = opportunities.slice(0, 3);
        topOpportunities.forEach(opp => {
            insights.push({
                type: 'opportunity',
                title: `Investment Opportunity: ${opp.state}`,
                description: `High potential state with ${opp.gap.toFixed(1)}% improvement opportunity`,
                confidence: 0.75,
                actionable: true,
                priority: opp.gap > 15 ? 'high' : 'medium'
            });
        });
        
        return insights;
    }

    analyzePolicyImpacts(data) {
        const insights = [];
        
        // Simulate policy impact analysis
        const recentGrowth = this.calculateRecentGrowth(data);
        
        if (recentGrowth.digital > 0.05) {
            insights.push({
                type: 'policy',
                title: 'Digital India Initiative Impact',
                description: `Digital metrics show accelerated growth (+${(recentGrowth.digital * 100).toFixed(1)}%) indicating policy success`,
                confidence: 0.88,
                actionable: false
            });
        }
        
        if (recentGrowth.financial > 0.03) {
            insights.push({
                type: 'policy',
                title: 'Financial Inclusion Policies Working',
                description: `Banking access improvements (+${(recentGrowth.financial * 100).toFixed(1)}%) exceed targets`,
                confidence: 0.84,
                actionable: false
            });
        }
        
        return insights;
    }

    // Utility functions
    calculateCorrelation(x, y) {
        const n = x.length;
        if (n === 0) return 0;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return denominator === 0 ? 0 : numerator / denominator;
    }

    calculateGrowthRate(values) {
        if (values.length < 2) return 0;
        const start = values[0];
        const end = values[values.length - 1];
        if (start === 0) return 0;
        const years = values.length - 1;
        return Math.pow(end / start, 1 / years) - 1;
    }

    calculatePotential(stateData) {
        // Simple potential calculation based on relative performance
        const weights = { literacy: 0.3, healthcare: 0.25, digital: 0.25, financial: 0.2 };
        const benchmarks = { literacy: 90, healthcare: 85, digital: 80, financial: 95 };
        
        return Object.keys(weights).reduce((potential, metric) => {
            const current = stateData[metric];
            const benchmark = benchmarks[metric];
            const improvementPotential = Math.max(0, benchmark - current) * weights[metric];
            return potential + current + improvementPotential;
        }, 0);
    }

    calculateRecentGrowth(data) {
        const growth = {};
        Object.keys(data).forEach(sector => {
            const metrics = data[sector];
            const sectorGrowth = Object.keys(metrics).map(metric => {
                const values = metrics[metric];
                if (Array.isArray(values)) {
                    return this.calculateGrowthRate(values.slice(-3)); // Last 3 years
                }
                return 0;
            });
            growth[sector] = sectorGrowth.reduce((a, b) => a + b, 0) / (sectorGrowth.length || 1);
        });
        return growth;
    }

    // NLP-based insight generation
    generateNLPInsights(rawInsights) {
        return rawInsights.map(insight => {
            const templates = {
                correlation: [
                    "Analysis reveals strong synergy between {factors}",
                    "Data indicates significant relationship between {factors}",
                    "Research shows correlation in {factors} performance"
                ],
                trend: [
                    "Trending upward: {metric} demonstrates consistent growth",
                    "Positive momentum observed in {metric} indicators",
                    "Growth trajectory shows {metric} acceleration"
                ],
                opportunity: [
                    "Investment potential identified in {location}",
                    "Strategic opportunity emerging in {location}",
                    "Development gap presents opportunity in {location}"
                ]
            };
            
            const template = templates[insight.type] || ["Insight: {description}"];
            const selectedTemplate = template[Math.floor(Math.random() * template.length)];
            
            return {
                ...insight,
                nlpSummary: this.models.nlpProcessor.generateSummary(insight, selectedTemplate)
            };
        });
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AIAnalyticsEngine, SimpleLinearRegression, AnomalyDetector, NLPProcessor };
}
