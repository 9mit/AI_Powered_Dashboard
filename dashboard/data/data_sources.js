// Data Sources Configuration and ETL Pipeline
class DataSourceManager {
    constructor() {
        this.sources = {
            government: {
                dataGovIn: {
                    baseUrl: 'https://api.data.gov.in/resource',
                    apiKey: null, // To be configured
                    endpoints: {
                        education: {
                            literacy: '/education/literacy-rate',
                            enrollment: '/education/school-enrollment',
                            dropout: '/education/dropout-rates'
                        },
                        healthcare: {
                            facilities: '/health/healthcare-facilities',
                            mortality: '/health/mortality-rates',
                            immunization: '/health/immunization-coverage'
                        },
                        infrastructure: {
                            roads: '/infrastructure/road-network',
                            electricity: '/infrastructure/power-access',
                            water: '/infrastructure/water-supply'
                        },
                        digital: {
                            internet: '/telecom/internet-penetration',
                            mobile: '/telecom/mobile-subscribers',
                            broadband: '/telecom/broadband-connections'
                        }
                    }
                },
                statePortals: {
                    maharashtra: 'https://mahades.maharashtra.gov.in/api',
                    tamilnadu: 'https://tn.data.gov.in/api',
                    karnataka: 'https://kadata.gov.in/api'
                }
            },
            international: {
                worldBank: {
                    baseUrl: 'https://api.worldbank.org/v2',
                    endpoints: {
                        indicators: '/country/IND/indicator',
                        metadata: '/country/IND'
                    },
                    indicators: {
                        literacy: 'SE.ADT.LITR.ZS',
                        mortality: 'SH.DYN.MORT',
                        gdp: 'NY.GDP.PCAP.CD',
                        internet: 'IT.NET.USER.ZS',
                        mobile: 'IT.CEL.SETS.P2',
                        electricity: 'EG.ELC.ACCS.ZS'
                    }
                },
                un: {
                    baseUrl: 'https://unstats.un.org/SDGAPI',
                    endpoints: {
                        goals: '/v1/sdg/Goal',
                        indicators: '/v1/sdg/Indicator',
                        data: '/v1/sdg/GeoArea/356/Data' // 356 is India's code
                    }
                }
            },
            districts: {
                census: {
                    baseUrl: 'https://censusindia.gov.in/api',
                    endpoints: {
                        demographics: '/demographics',
                        literacy: '/education/literacy',
                        infrastructure: '/infrastructure'
                    }
                },
                surveys: {
                    nfhs: { // National Family Health Survey
                        baseUrl: 'http://rchiips.org/nfhs/api',
                        datasets: ['health', 'nutrition', 'family_planning']
                    },
                    nsso: { // National Sample Survey Office
                        baseUrl: 'http://mospi.nic.in/nsso/api',
                        datasets: ['employment', 'consumption', 'housing']
                    }
                }
            }
        };
        
        this.cache = new Map();
        this.lastUpdated = new Map();
        this.updateIntervals = {
            realtime: 5 * 60 * 1000, // 5 minutes
            daily: 24 * 60 * 60 * 1000, // 24 hours
            weekly: 7 * 24 * 60 * 60 * 1000, // 7 days
            monthly: 30 * 24 * 60 * 60 * 1000 // 30 days
        };
        
        // Real-time polling configuration
        this.pollingIntervals = new Map();
        this.eventListeners = new Map();
        this.isPolling = false;
        this.retryAttempts = 3;
        this.retryDelay = 1000;
    }

    // Event system for real-time updates
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    emit(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => callback(data));
        }
    }

    // Start real-time data polling
    startRealTimePolling(intervalMs = 60000) {
        if (this.isPolling) {
            console.log('Real-time polling already active');
            return;
        }

        this.isPolling = true;
        console.log(`Starting real-time polling every ${intervalMs}ms`);

        // Poll all configured data sources
        const pollAll = async () => {
            try {
                await this.fetchAllIndicators();
                this.emit('dataUpdated', { timestamp: new Date().toISOString() });
            } catch (error) {
                console.error('Polling error:', error);
                this.emit('pollingError', error);
            }
        };

        // Initial fetch
        pollAll();

        // Set up interval
        this.pollingIntervals.set('main', setInterval(pollAll, intervalMs));
    }

    // Stop real-time polling
    stopRealTimePolling() {
        this.pollingIntervals.forEach((interval, key) => {
            clearInterval(interval);
            this.pollingIntervals.delete(key);
        });
        this.isPolling = false;
        console.log('Real-time polling stopped');
    }

    // Fetch all indicators from World Bank
    async fetchAllIndicators() {
        const indicators = this.sources.international.worldBank.indicators;
        const results = {};

        for (const [name, indicator] of Object.entries(indicators)) {
            try {
                const data = await this.fetchWorldBankDataReal(indicator);
                results[name] = data;
                this.cache.set(`worldBank_${name}`, data);
                this.lastUpdated.set(`worldBank_${name}`, Date.now());
            } catch (error) {
                console.error(`Error fetching ${name}:`, error);
                // Fall back to cached data
                const cached = this.cache.get(`worldBank_${name}`);
                if (cached) {
                    results[name] = cached;
                }
            }
        }

        return results;
    }

    // Real World Bank API fetch
    async fetchWorldBankDataReal(indicator, params = {}) {
        const { worldBank } = this.sources.international;
        const url = `${worldBank.baseUrl}${worldBank.endpoints.indicators}/${indicator}?format=json&per_page=20&date=2015:2024`;

        let lastError;
        for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
            try {
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const json = await response.json();
                
                // World Bank API returns array: [metadata, data]
                if (json && json[1] && Array.isArray(json[1])) {
                    const data = json[1].filter(item => item.value !== null);
                    return {
                        indicator: json[0]?.indicator?.value || indicator,
                        country: json[0]?.country?.value || 'India',
                        data: data.map(item => ({
                            year: item.date,
                            value: item.value
                        })),
                        lastUpdated: new Date().toISOString(),
                        source: 'World Bank API'
                    };
                }

                throw new Error('Invalid World Bank API response');
            } catch (error) {
                lastError = error;
                console.warn(`Attempt ${attempt + 1} failed for ${indicator}:`, error.message);
                if (attempt < this.retryAttempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
                }
            }
        }

        throw lastError;
    }

    // ETL Pipeline Implementation
    async extractData(source, endpoint, params = {}) {
        try {
            const cacheKey = `${source}_${endpoint}_${JSON.stringify(params)}`;
            
            // Check cache first
            if (this.isCacheValid(cacheKey)) {
                console.log(`Returning cached data for ${cacheKey}`);
                return this.cache.get(cacheKey);
            }

            console.log(`Fetching fresh data from ${source}:${endpoint}`);
            
            let data;
            switch (source) {
                case 'worldBank':
                    data = await this.fetchWorldBankData(endpoint, params);
                    break;
                case 'dataGovIn':
                    data = await this.fetchDataGovInData(endpoint, params);
                    break;
                case 'census':
                    data = await this.fetchCensusData(endpoint, params);
                    break;
                default:
                    data = await this.fetchGenericData(source, endpoint, params);
            }

            // Cache the data
            this.cache.set(cacheKey, data);
            this.lastUpdated.set(cacheKey, Date.now());
            
            return data;
        } catch (error) {
            console.error(`Error extracting data from ${source}:${endpoint}`, error);
            
            // Return cached data if available, even if stale
            const cacheKey = `${source}_${endpoint}_${JSON.stringify(params)}`;
            if (this.cache.has(cacheKey)) {
                console.log('Returning stale cached data due to fetch error');
                return this.cache.get(cacheKey);
            }
            
            // Return mock data if no cache available
            return this.generateMockData(source, endpoint);
        }
    }

    async transformData(rawData, sourceType, targetSchema) {
        try {
            const transformer = this.getTransformer(sourceType);
            const transformedData = await transformer.transform(rawData, targetSchema);
            
            // Data validation
            this.validateData(transformedData, targetSchema);
            
            // Data enrichment
            const enrichedData = await this.enrichData(transformedData, sourceType);
            
            return enrichedData;
        } catch (error) {
            console.error('Error transforming data:', error);
            throw error;
        }
    }

    async loadData(transformedData, destination) {
        try {
            switch (destination) {
                case 'localStorage':
                    return this.loadToLocalStorage(transformedData);
                case 'indexedDB':
                    return this.loadToIndexedDB(transformedData);
                case 'memory':
                    return this.loadToMemory(transformedData);
                default:
                    throw new Error(`Unknown destination: ${destination}`);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    // Data fetching implementations
    async fetchWorldBankData(indicator, params) {
        // First try real API, fall back to simulation if it fails
        try {
            return await this.fetchWorldBankDataReal(indicator, params);
        } catch (error) {
            console.warn('Real API fetch failed, using simulated data:', error.message);
            return this.simulateWorldBankResponse(indicator);
        }
    }

    // Real UN SDG API fetch
    async fetchUNSDGData(goal = 1, params = {}) {
        const { un } = this.sources.international;
        const url = `${un.baseUrl}${un.endpoints.data}?goal=${goal}&format=json`;

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return {
                goal,
                data: data,
                lastUpdated: new Date().toISOString(),
                source: 'UN SDG API'
            };
        } catch (error) {
            console.error('UN SDG API fetch error:', error);
            return this.simulateUNSDGResponse(goal);
        }
    }

    async fetchDataGovInData(endpoint, params) {
        // Try to use real API if configured
        if (this.sources.government.dataGovIn.apiKey) {
            try {
                return await this.fetchDataGovInReal(endpoint, params);
            } catch (error) {
                console.warn('Data.gov.in API error, using fallback:', error.message);
            }
        }
        // Fall back to simulated data
        console.log(`Using simulated data for Data.gov.in: ${endpoint}`);
        return this.simulateDataGovInResponse(endpoint);
    }

    async fetchDataGovInReal(endpoint, params) {
        const { dataGovIn } = this.sources.government;
        const url = `${dataGovIn.baseUrl}${endpoint}?api_key=${dataGovIn.apiKey}`;

        const response = await fetch(url, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Data.gov.in API error: ${response.status}`);
        }

        return await response.json();
    }

    async fetchCensusData(endpoint, params) {
        // Simulate census data fetch
        console.log(`Simulating fetch from Census: ${endpoint}`);
        return this.simulateCensusResponse(endpoint);
    }

    // Data transformation utilities
    getTransformer(sourceType) {
        const transformers = {
            worldBank: new WorldBankTransformer(),
            dataGovIn: new DataGovInTransformer(),
            census: new CensusTransformer(),
            nfhs: new NFHSTransformer(),
            composite: new CompositeTransformer()
        };
        
        return transformers[sourceType] || new GenericTransformer();
    }

    validateData(data, schema) {
        // Basic validation
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid data format');
        }
        
        // Schema validation
        if (schema && schema.required) {
            const requiredFields = schema.required || [];
            for (const field of requiredFields) {
                if (!(field in data)) {
                    throw new Error(`Missing required field: ${field}`);
                }
            }
        }
        
        return true;
    }

    async enrichmentLogic(data, sourceType) {
        // Add derived metrics
        if (data.education && Array.isArray(data.education.literacy)) {
            data.education.derived = {
                literacyGrowthRate: this.calculateGrowthRate(data.education.literacy),
                enrollmentTrend: this.calculateTrend(data.education.enrollment)
            };
        }
        return data;
    }

    async enrichData(data, sourceType) {
        // Add metadata
        data._metadata = {
            source: sourceType,
            fetchedAt: new Date().toISOString(),
            quality: this.assessDataQuality(data),
            completeness: this.calculateCompleteness(data)
        };
        
        return await this.enrichmentLogic(data, sourceType);
    }

    // Cache management
    isCacheValid(cacheKey) {
        if (!this.cache.has(cacheKey)) return false;
        
        const lastUpdate = this.lastUpdated.get(cacheKey);
        const now = Date.now();
        const age = now - lastUpdate;
        
        // Use different cache durations based on data type
        const maxAge = cacheKey.includes('realtime') ? this.updateIntervals.realtime :
                     cacheKey.includes('daily') ? this.updateIntervals.daily :
                     this.updateIntervals.weekly;
        
        return age < maxAge;
    }

    clearCache() {
        this.cache.clear();
        this.lastUpdated.clear();
    }

    // Simulation methods for demo purposes
    simulateUNSDGResponse(goal) {
        const mockSDGData = {
            1: { // No Poverty
                goal: 1,
                title: 'No Poverty',
                targets: [
                    { id: '1.1', value: 0.6, description: 'Extreme poverty' },
                    { id: '1.2', value: 17.5, description: 'National poverty line' }
                ]
            },
            4: { // Quality Education
                goal: 4,
                title: 'Quality Education',
                targets: [
                    { id: '4.1', value: 79.5, description: 'Primary completion rate' },
                    { id: '4.2', value: 63.2, description: 'Pre-primary enrollment' }
                ]
            },
            9: { // Industry, Innovation and Infrastructure
                goal: 9,
                title: 'Industry, Innovation and Infrastructure',
                targets: [
                    { id: '9.1', value: 85.3, description: 'Infrastructure development' },
                    { id: '9.2', value: 28.5, description: 'Manufacturing value add' }
                ]
            }
        };

        return mockSDGData[goal] || { goal, title: `Goal ${goal}`, targets: [] };
    }

    simulateWorldBankResponse(indicator) {
        const mockData = {
            'SE.ADT.LITR.ZS': { // Literacy rate
                indicator: { value: 'Literacy rate, adult total (% of people ages 15 and above)' },
                country: { value: 'India' },
                value: 74.04,
                date: '2024'
            },
            'SH.DYN.MORT': { // Infant mortality
                indicator: { value: 'Mortality rate, infant (per 1,000 live births)' },
                country: { value: 'India' },
                value: 30,
                date: '2024'
            },
            'IT.NET.USER.ZS': { // Internet users
                indicator: { value: 'Individuals using the Internet (% of population)' },
                country: { value: 'India' },
                value: 47.5,
                date: '2024'
            }
        };
        
        return mockData[indicator] || { value: null, error: 'Indicator not found' };
    }

    simulateDataGovInResponse(endpoint) {
        const mockResponses = {
            '/education/literacy-rate': {
                data: {
                    total: 74.04,
                    male: 82.14,
                    female: 65.46,
                    rural: 68.91,
                    urban: 84.11,
                    byState: {
                        'Kerala': 94.0,
                        'Mizoram': 91.33,
                        'Tripura': 87.22,
                        'Goa': 88.70,
                        'Himachal Pradesh': 82.80
                    }
                },
                metadata: {
                    source: 'Census 2011 (projected)',
                    lastUpdated: '2024-01-15'
                }
            },
            '/health/healthcare-facilities': {
                data: {
                    primaryHealthCenters: 25743,
                    communityHealthCenters: 5624,
                    subCenters: 158417,
                    hospitals: 25778,
                    coverage: 68.2
                }
            },
            '/telecom/internet-penetration': {
                data: {
                    total: 47.5,
                    urban: 64.8,
                    rural: 37.3,
                    growth: 5.2
                }
            }
        };
        
        return mockResponses[endpoint] || { error: 'Endpoint not found' };
    }

    simulateCensusResponse(endpoint) {
        const mockCensusData = {
            '/demographics': {
                population: 1380004385,
                density: 464,
                sexRatio: 943,
                growthRate: 1.1
            },
            '/education/literacy': {
                overall: 74.04,
                states: {
                    'Uttar Pradesh': 67.68,
                    'Maharashtra': 82.34,
                    'Bihar': 61.8,
                    'West Bengal': 76.26,
                    'Andhra Pradesh': 67.41,
                    'Tamil Nadu': 80.09,
                    'Rajasthan': 66.11,
                    'Karnataka': 75.36
                }
            }
        };
        
        return mockCensusData[endpoint] || { error: 'Census endpoint not found' };
    }

    generateMockData(source, endpoint) {
        console.log(`Generating mock data for ${source}:${endpoint}`);
        
        return {
            data: {
                values: Array.from({length: 5}, (_, i) => ({
                    year: 2020 + i,
                    value: Math.random() * 100
                }))
            },
            metadata: {
                source: 'mock',
                generated: true,
                timestamp: new Date().toISOString()
            }
        };
    }

    // Utility methods
    calculateGrowthRate(values) {
        if (!values || values.length < 2) return 0;
        const start = values[0];
        const end = values[values.length - 1];
        if (start === 0) return 0;
        return ((end - start) / start) * 100;
    }

    calculateTrend(values) {
        if (!values || values.length < 3) return 'insufficient_data';
        
        const recent = values.slice(-3);
        const isIncreasing = recent.every((val, i) => i === 0 || val >= recent[i - 1]);
        const isDecreasing = recent.every((val, i) => i === 0 || val <= recent[i - 1]);
        
        if (isIncreasing) return 'increasing';
        if (isDecreasing) return 'decreasing';
        return 'fluctuating';
    }

    assessDataQuality(data) {
        // Simple quality assessment
        const totalFields = this.countFields(data);
        const nullFields = this.countNullFields(data);
        
        return {
            completeness: totalFields > 0 ? ((totalFields - nullFields) / totalFields) * 100 : 0,
            freshness: this.calculateFreshness(data._metadata?.lastUpdated),
            accuracy: 85 // Would be calculated based on validation rules
        };
    }

    calculateCompleteness(data) {
        const totalFields = this.countFields(data);
        const completedFields = this.countNonNullFields(data);
        return totalFields > 0 ? (completedFields / totalFields) * 100 : 0;
    }

    countFields(obj, depth = 0) {
        if (depth > 3 || !obj) return 0; // Prevent infinite recursion
        
        let count = 0;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                count++;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    count += this.countFields(obj[key], depth + 1);
                }
            }
        }
        return count;
    }

    countNullFields(obj, depth = 0) {
        if (depth > 3 || !obj) return 0;
        
        let count = 0;
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] === null || obj[key] === undefined) {
                    count++;
                } else if (typeof obj[key] === 'object') {
                    count += this.countNullFields(obj[key], depth + 1);
                }
            }
        }
        return count;
    }

    countNonNullFields(obj, depth = 0) {
        return this.countFields(obj, depth) - this.countNullFields(obj, depth);
    }

    calculateFreshness(lastUpdated) {
        if (!lastUpdated) return 0;
        
        const now = new Date();
        const updated = new Date(lastUpdated);
        const ageHours = (now - updated) / (1000 * 60 * 60);
        
        if (ageHours < 1) return 100;
        if (ageHours < 24) return 90;
        if (ageHours < 168) return 70; // 1 week
        return 50;
    }
}

// Data transformer classes
class WorldBankTransformer {
    transform(data, schema) {
        return {
            value: data.value,
            year: data.date,
            country: data.country?.value,
            indicator: data.indicator?.value,
            source: 'World Bank'
        };
    }
}

class DataGovInTransformer {
    transform(data, schema) {
        return {
            ...data.data,
            metadata: data.metadata,
            source: 'Data.gov.in'
        };
    }
}

class CensusTransformer {
    transform(data, schema) {
        return {
            ...data,
            source: 'Census India'
        };
    }
}

class NFHSTransformer {
    transform(data, schema) {
        return {
            ...data,
            source: 'NFHS'
        };
    }
}

class CompositeTransformer {
    transform(data, schema) {
        return {
            ...data,
            transformed: true,
            timestamp: new Date().toISOString()
        };
    }
}

class GenericTransformer {
    transform(data, schema) {
        return {
            ...data,
            transformed: true,
            timestamp: new Date().toISOString()
        };
    }
}

class AutonomousEngine {
    generateProjectedData(baseValue, growthFactor, yearsFromBase) {
        // Deterministic growth logic mirroring the Python implementation
        // baseValue + (growthFactor * yearsFromBase) + some noise
        const projection = baseValue + (growthFactor * yearsFromBase) + ((Math.random() - 0.5) * 0.5);
        return Math.min(99.9, Math.max(0, projection));
    }

    generateHeadlines(currentData, previousData, location) {
        const headlines = [];
        const sectors = {
            literacy: "Education Sector",
            healthcare: "Healthcare Facilities",
            digital: "Digital Infrastructure",
            financial: "Banking & Finance"
        };

        Object.keys(sectors).forEach(key => {
            const diff = currentData[key] - previousData[key];
            if (diff > 0.5) {
                headlines.push({
                    title: `Rapid Growth in ${location}'s ${sectors[key]}`,
                    summary: `${sectors[key]} metrics have surged by ${diff.toFixed(2)}% in the last update cycle.`
                });
            }
        });
        return headlines;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DataSourceManager, AutonomousEngine };
}
