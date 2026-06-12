import API from '../src/services/api'

// ─── Lead Generation ──────────────────────────────────────────────────────────
export const generateLeads = ({
    keyword,
    limit = 20,
    source = 'web',
    location = '',
    search_mode = 'fast',
    country = '',
    cities = [],
    postalCodes = '',
    domainYearFrom = null,
    domainYearTo = null,
    requiredTechs = [],
    genuinenessMin = 0,
}) =>
    API.post('/intelligence/leads/generate', {
        keyword,
        limit,
        source,
        location,
        search_mode,
        country,
        cities,
        postalCodes,
        domain_year_from: domainYearFrom,
        domain_year_to: domainYearTo,
        required_techs: requiredTechs,
        genuineness_min: genuinenessMin,
    }, { timeout: 120000 })

// ─── Leads CRUD ───────────────────────────────────────────────────────────────
export const getLeads = (params = {}) =>
    API.get('/intelligence/leads', { params })

export const getLeadById = (id) =>
    API.get(`/intelligence/leads/${id}`)

export const createLead = (data) =>
    API.post('/intelligence/leads', data)

export const updateLead = (id, data) =>
    API.patch(`/intelligence/leads/${id}`, data)

export const deleteLead = (id) =>
    API.delete(`/intelligence/leads/${id}`)

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getIntelligenceStats = () =>
    API.get('/intelligence/stats')