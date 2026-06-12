import React, { useState, useEffect, useMemo } from 'react'
import { FiX, FiZap, FiSearch, FiCheckCircle, FiAlertCircle, FiChevronDown } from 'react-icons/fi'
import { useLeadGenerate } from '../../hooks/useLeadGenerate'
import { Country, State, City } from 'country-state-city'
import Select from 'react-select'

const C = {
    indigo: '#4f46e5', indigoLight: '#eef2ff', indigoBorder: '#a5b4fc',
    red: '#dc2626', redLight: '#fef2f2', redBorder: '#fca5a5',
    emerald: '#047857', emeraldLight: '#ecfdf5', emeraldBorder: '#6ee7b7',
    slate100: '#f1f5f9', slate200: '#e2e8f0', slate300: '#cbd5e1',
    slate400: '#64748b', slate600: '#334155', slate800: '#0f172a',
    white: '#ffffff',
}

const KEYWORD_SUGGESTIONS = [
    'Recruitment Agency UK',
    'Staffing Company London',
    'HR Consulting Firm Manchester',
    'Construction Company Birmingham',
    'Logistics Company Leeds',
    'Manufacturing Firm Sheffield',
    'Recruitment Agency Australia',
    'Staffing Agency Canada',
]

const INDUSTRIES = [
    'Recruitment', 'Staffing', 'Logistics', 'IT / Software',
    'Manufacturing', 'Construction', 'Healthcare', 'Finance',
    'Education', 'Retail', 'Marketing', 'Legal',
]

const COMPANY_SIZES = [
    { label: 'Any Size', value: '' },
    { label: 'Small (1–50)', value: 'small business' },
    { label: 'Medium (50–500)', value: 'mid-size company' },
    { label: 'Enterprise (500+)', value: 'enterprise corporation' },
]

const selectStyles = {
    control: (base, state) => ({
        ...base,
        borderRadius: 9,
        border: `1.5px solid ${state.isFocused ? C.indigo : C.slate300}`,
        boxShadow: state.isFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
        fontSize: 13,
        padding: '1px',
        background: C.white,
        transition: 'all 0.15s',
        '&:hover': {
            borderColor: state.isFocused ? C.indigo : C.slate300
        }
    }),
    option: (base, state) => ({
        ...base,
        fontSize: 13,
        backgroundColor: state.isSelected ? C.indigo : state.isFocused ? C.indigoLight : 'white',
        color: state.isSelected ? 'white' : C.slate800,
        cursor: 'pointer',
    }),
    multiValue: (base) => ({
        ...base,
        background: C.indigoLight,
        borderRadius: 20,
        padding: '1px 8px',
    }),
    multiValueLabel: (base) => ({
        ...base,
        color: C.indigo,
        fontWeight: 700,
        fontSize: 11,
    }),
    multiValueRemove: (base) => ({
        ...base,
        color: C.indigo,
        '&:hover': {
            background: 'none',
            color: C.red,
        }
    }),
    placeholder: (base) => ({
        ...base,
        color: C.slate400,
    })
}

const Spinner = () => (
    <span style={{
        width: 14, height: 14, borderRadius: '50%',
        border: '2.5px solid rgba(255,255,255,0.35)',
        borderTopColor: '#fff',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block', flexShrink: 0,
    }} />
)

const Label = ({ children }) => (
    <label style={{
        display: 'block', fontSize: 12, fontWeight: 700,
        color: C.slate600, marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>
        {children}
    </label>
)

const GenerateLeadsModal = ({ open, onClose, onSuccess }) => {
    const [keyword, setKeyword] = useState('')
    const [limit, setLimit] = useState(10)
    const [keywordFocused, setKeywordFocused] = useState(false)

    const [selectedCountry, setSelectedCountry] = useState(null)
    const [selectedState, setSelectedState] = useState(null)
    const [citySearch, setCitySearch] = useState('')
    const [selectedCities, setSelectedCities] = useState([])
    const [postalCodes, setPostalCodes] = useState('')

    const [selectedIndustries, setSelectedIndustries] = useState([])
    const [companySize, setCompanySize] = useState('')
    const [qualityFilters, setQualityFilters] = useState({
        mustHaveEmail: false,
        mustHaveWebsite: true,
        skipFreeBuilders: true,
    })
    // ── New filter states ──────────────────────────────────────────────────────
    const [domainYearFrom, setDomainYearFrom] = useState('')
    const [domainYearTo, setDomainYearTo] = useState('')
    const [requiredTechs, setRequiredTechs] = useState([])
    const [techDropdownOpen, setTechDropdownOpen] = useState(false)
    const [genuinenessMin, setGenuinenessMin] = useState(0)

    const { generate, loading, result, error, reset } = useLeadGenerate()

    useEffect(() => {
        if (open) {
            setKeyword('')
            setLimit(10)
            setSelectedCountry(null)
            setSelectedState(null)
            setCitySearch('')
            setSelectedCities([])
            setPostalCodes('')
            setSelectedIndustries([])
            setCompanySize('')
            setQualityFilters({ mustHaveEmail: false, mustHaveWebsite: true, skipFreeBuilders: true })
            setDomainYearFrom('')
            setDomainYearTo('')
            setRequiredTechs([])
            setTechDropdownOpen(false)
            setGenuinenessMin(0)
            reset()
        }
    }, [open, reset])

    const countryOptions = useMemo(() =>
        Country.getAllCountries().map(c => ({
            label: `${c.flag} ${c.name}`,
            value: c.name,
            isoCode: c.isoCode
        }))
    , [])

    const stateOptions = useMemo(() => {
        if (!selectedCountry) return []
        return State.getStatesOfCountry(selectedCountry.isoCode).map(s => ({
            label: s.name,
            value: s.name,
            isoCode: s.isoCode
        }))
    }, [selectedCountry])

    const allCitiesInState = useMemo(() => {
        if (!selectedCountry || !selectedState) return []
        return City.getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode)
    }, [selectedCountry, selectedState])

    const cityOptions = useMemo(() => {
        if (allCitiesInState.length === 0) return []
        const searchLower = citySearch.toLowerCase()
        const filtered = allCitiesInState
            .filter(c => c.name.toLowerCase().includes(searchLower))
            .slice(0, 100)
            
        return filtered.map(c => ({
            label: c.name,
            value: c.name
        }))
    }, [allCitiesInState, citySearch])

    const handleCountryChange = (opt) => {
        setSelectedCountry(opt)
        setSelectedState(null)
        setCitySearch('')
        setSelectedCities([])
        setPostalCodes('')
    }

    const handleStateChange = (opt) => {
        setSelectedState(opt)
        setCitySearch('')
        setSelectedCities([])
        setPostalCodes('')
    }

    const handleCitiesChange = (opts) => {
        setSelectedCities(opts || [])
    }

    const getPostalLabel = () => {
        if (!selectedCountry) return 'Postal Code'
        if (selectedCountry.isoCode === 'IN') return 'PIN Code'
        if (selectedCountry.isoCode === 'US') return 'Zip Code'
        return 'Postal Code'
    }

    // Build final keyword from all filters
    const buildFinalKeyword = () => {
        const parts = [keyword.trim()]
        // Only add first selected industry to keyword, not all of them
        if (selectedIndustries.length > 0) parts.push(selectedIndustries[0])
        if (companySize) parts.push(companySize)
        if (selectedCountry) parts.push(selectedCountry.value)
        parts.push('official site')
        return parts.filter(Boolean).join(' ')
    }

    const handleGenerate = async () => {
        const finalKeyword = buildFinalKeyword()
        const res = await generate(finalKeyword, limit, qualityFilters, {
            country: selectedCountry?.value || '',
            cities: selectedCities.map(c => c.value),
            postalCodes: postalCodes.trim(),
            domainYearFrom: domainYearFrom ? parseInt(domainYearFrom) : null,
            domainYearTo: domainYearTo ? parseInt(domainYearTo) : null,
            requiredTechs,
            genuinenessMin,
            source: 'web',
            searchMode: 'fast',
        })
        if (res) await onSuccess?.(res)   // await so parent finishes fetch before anything else
    }

    const toggleIndustry = (ind) => {
        setSelectedIndustries(prev =>
            prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]
        )
    }

    const toggleQuality = (key) => {
        setQualityFilters(prev => ({ ...prev, [key]: !prev[key] }))
    }

    const toggleTech = (tech) => {
        setRequiredTechs(prev =>
            prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
        )
    }

    const GENUINENESS_OPTIONS = [
        { label: 'Any', value: 0 },
        { label: '⚠️ Unverified+', value: 50 },
        { label: '✅ Genuine only', value: 80 },
    ]

    const TECH_OPTIONS = [
        'WordPress', 'Shopify', 'Wix', 'Squarespace', 'Webflow',
        'Next.js', 'React', 'Vue.js', 'Angular',
        'HubSpot', 'Salesforce', 'Zoho', 'Intercom', 'Zendesk',
        'Google Analytics', 'Hotjar', 'WooCommerce',
        'Stripe', 'Bootstrap', 'Tailwind', 'jQuery', 'Calendly',
    ]
    const handleClose = () => {
        if (loading) return
        onClose()
    }

    if (!open) return null

    const isDone = !!result
    const hasError = !!error

    const previewKeyword = buildFinalKeyword()

    return (
        <div
            onClick={handleClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 80,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
                background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)',
                animation: 'fadeIn 0.18s ease',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: C.white, borderRadius: 20, width: '100%', maxWidth: 560,
                    maxHeight: '92vh', overflowY: 'auto',
                    boxShadow: '0 32px 80px rgba(15,23,42,0.28)',
                    overflow: 'hidden', animation: 'modalIn 0.22s ease',
                }}
            >
                {/* ── Header ── */}
                <div style={{
                    padding: '20px 26px 16px', borderBottom: `1px solid ${C.slate200}`,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: C.indigoLight,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <FiZap size={17} color={C.indigo} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: C.slate800 }}>
                                Generate Leads
                            </h2>
                            <p style={{ margin: 0, fontSize: 11, color: C.slate400 }}>
                                AI finds companies, extracts emails & LinkedIn
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        style={{
                            width: 32, height: 32, borderRadius: 8,
                            border: `1px solid ${C.slate200}`, background: C.white,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: loading ? 'not-allowed' : 'pointer', color: C.slate600,
                            opacity: loading ? 0.4 : 1,
                        }}
                    >
                        <FiX size={14} />
                    </button>
                </div>

                {/* ── Body ── */}
                <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', maxHeight: '70vh' }}>

                    {/* ── Success state ── */}
                    {isDone && (
                        <div style={{
                            padding: '16px 18px', borderRadius: 12,
                            background: C.emeraldLight, border: `1px solid ${C.emeraldBorder}`,
                            display: 'flex', alignItems: 'flex-start', gap: 12,
                        }}>
                            <FiCheckCircle size={20} color={C.emerald} style={{ flexShrink: 0, marginTop: 1 }} />
                            <div>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.emerald }}>
                                    {result.inserted} new lead{result.inserted !== 1 ? 's' : ''} added!
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 12, color: '#065f46' }}>
                                    {result.total_from_python} found by AI · {result.inserted} saved · {result.skipped} skipped
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#065f46', opacity: 0.8 }}>
                                    Check the AI Leads table below to see them.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── Error state ── */}
                    {hasError && (
                        <div style={{
                            padding: '14px 16px', borderRadius: 10,
                            background: C.redLight, border: `1px solid ${C.redBorder}`,
                            display: 'flex', alignItems: 'flex-start', gap: 10,
                        }}>
                            <FiAlertCircle size={16} color={C.red} style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ margin: 0, fontSize: 13, color: C.red, fontWeight: 600 }}>{error}</p>
                        </div>
                    )}

                    {!isDone && (
                        <>
                            {/* ── Keyword ── */}
                            <div>
                                <Label>Search Keyword <span style={{ color: C.red }}>*</span></Label>
                                <div style={{ position: 'relative' }}>
                                    <FiSearch size={14} style={{
                                        position: 'absolute', left: 12, top: '50%',
                                        transform: 'translateY(-50%)', color: C.slate400, pointerEvents: 'none',
                                    }} />
                                    <input
                                        type="text"
                                        placeholder='e.g. "Recruitment Agency"'
                                        value={keyword}
                                        onChange={e => setKeyword(e.target.value)}
                                        onFocus={() => setKeywordFocused(true)}
                                        onBlur={() => setKeywordFocused(false)}
                                        onKeyDown={e => e.key === 'Enter' && !loading && keyword.trim() && handleGenerate()}
                                        disabled={loading}
                                        style={{
                                            width: '100%', padding: '10px 13px 10px 36px',
                                            borderRadius: 9, boxSizing: 'border-box',
                                            border: `1.5px solid ${keywordFocused ? C.indigo : C.slate300}`,
                                            boxShadow: keywordFocused ? `0 0 0 3px ${C.indigoLight}` : 'none',
                                            fontSize: 14, color: C.slate800,
                                            background: loading ? C.slate100 : C.white,
                                            outline: 'none', fontFamily: 'inherit',
                                            transition: 'border-color 0.2s, box-shadow 0.2s',
                                        }}
                                    />
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                                    {KEYWORD_SUGGESTIONS.map(s => (
                                        <button key={s} onClick={() => setKeyword(s)} disabled={loading}
                                            style={{
                                                padding: '4px 10px', borderRadius: 20,
                                                border: `1px solid ${keyword === s ? C.indigo : C.slate200}`,
                                                background: keyword === s ? C.indigoLight : C.white,
                                                color: keyword === s ? C.indigo : C.slate400,
                                                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                                                fontFamily: 'inherit', transition: 'all 0.15s',
                                            }}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Location Drill-down ── */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                <div>
                                    <Label>Country / Region</Label>
                                    <Select
                                        options={countryOptions}
                                        value={selectedCountry}
                                        onChange={handleCountryChange}
                                        placeholder="Search country..."
                                        styles={selectStyles}
                                        isDisabled={loading}
                                    />
                                </div>

                                {selectedCountry && (
                                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                        <Label>State / Region</Label>
                                        <Select
                                            options={stateOptions}
                                            value={selectedState}
                                            onChange={handleStateChange}
                                            placeholder="Search state/region..."
                                            styles={selectStyles}
                                            isDisabled={loading}
                                        />
                                    </div>
                                )}

                                {selectedState && (
                                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                        <Label>City / Cities <span style={{ fontSize: 10, color: C.slate400, textTransform: 'none', fontWeight: 500 }}>(multi-select)</span></Label>
                                        <Select
                                            isMulti
                                            options={cityOptions}
                                            value={selectedCities}
                                            onChange={handleCitiesChange}
                                            placeholder="Search city..."
                                            styles={selectStyles}
                                            isDisabled={loading}
                                        />
                                    </div>
                                )}

                                {selectedCities.length > 0 && (
                                    <div style={{ animation: 'fadeIn 0.2s ease' }}>
                                        <Label>{getPostalLabel()} <span style={{ fontSize: 10, color: C.slate400, textTransform: 'none', fontWeight: 500 }}>(comma-separated)</span></Label>
                                        <input
                                            type="text"
                                            placeholder={`e.g. ${selectedCountry.isoCode === 'IN' ? '110001, 110002' : '90210, 90211'}`}
                                            value={postalCodes}
                                            onChange={e => setPostalCodes(e.target.value)}
                                            disabled={loading}
                                            style={{
                                                width: '100%', padding: '10px 13px',
                                                borderRadius: 9, boxSizing: 'border-box',
                                                border: `1.5px solid ${C.slate300}`,
                                                fontSize: 14, color: C.slate800,
                                                background: loading ? C.slate100 : C.white,
                                                outline: 'none', fontFamily: 'inherit',
                                                transition: 'all 0.15s',
                                            }}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* ── Industry Filter ── */}
                            <div>
                                <Label>Industry <span style={{ fontSize: 10, color: C.slate400, textTransform: 'none', fontWeight: 500 }}>(select multiple)</span></Label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {INDUSTRIES.map(ind => {
                                        const selected = selectedIndustries.includes(ind)
                                        return (
                                            <button key={ind} onClick={() => toggleIndustry(ind)} disabled={loading}
                                                style={{
                                                    padding: '5px 11px', borderRadius: 20, cursor: 'pointer',
                                                    border: `1.5px solid ${selected ? C.indigo : C.slate200}`,
                                                    background: selected ? C.indigo : C.white,
                                                    color: selected ? C.white : C.slate600,
                                                    fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                                                    transition: 'all 0.15s',
                                                }}>
                                                {ind}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* ── Company Size ── */}
                            <div>
                                <Label>Company Size</Label>
                                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                    {COMPANY_SIZES.map(s => (
                                        <button key={s.value} onClick={() => setCompanySize(s.value)} disabled={loading}
                                            style={{
                                                flex: 1, padding: '8px 10px', borderRadius: 9, cursor: 'pointer',
                                                border: `1.5px solid ${companySize === s.value ? C.indigo : C.slate200}`,
                                                background: companySize === s.value ? C.indigoLight : C.white,
                                                color: companySize === s.value ? C.indigo : C.slate600,
                                                fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                                                transition: 'all 0.15s', textAlign: 'center',
                                            }}>
                                            {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* ── Quality Filters ── */}
                            <div>
                                <Label>Quality Filters</Label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        { key: 'mustHaveWebsite', label: '🌐 Must have own website', desc: 'Skip leads without a website' },
                                        { key: 'mustHaveEmail', label: '✉ Must have contact email', desc: 'Only return leads with found email' },
                                        { key: 'skipFreeBuilders', label: '🚫 Skip free website builders', desc: 'Skip Wix, Squarespace, Weebly sites' },
                                    ].map(({ key, label, desc }) => (
                                        <div key={key}
                                            onClick={() => !loading && toggleQuality(key)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', borderRadius: 9, cursor: 'pointer',
                                                border: `1.5px solid ${qualityFilters[key] ? C.indigo : C.slate200}`,
                                                background: qualityFilters[key] ? C.indigoLight : C.white,
                                                transition: 'all 0.15s',
                                            }}>
                                            <div style={{
                                                width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                                                border: `2px solid ${qualityFilters[key] ? C.indigo : C.slate300}`,
                                                background: qualityFilters[key] ? C.indigo : C.white,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                {qualityFilters[key] && <span style={{ color: C.white, fontSize: 10, fontWeight: 900 }}>✓</span>}
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: qualityFilters[key] ? C.indigo : C.slate800 }}>{label}</p>
                                                <p style={{ margin: 0, fontSize: 10, color: C.slate400 }}>{desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* ── Domain Year Range ── */}
                            <div>
                                <Label>Website Created (Year Range)</Label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <input
                                        type="number"
                                        placeholder="From e.g. 2010"
                                        value={domainYearFrom}
                                        onChange={e => setDomainYearFrom(e.target.value)}
                                        disabled={loading}
                                        min={1990} max={new Date().getFullYear()}
                                        style={{
                                            flex: 1, padding: '9px 12px', borderRadius: 9,
                                            border: `1.5px solid ${C.slate300}`, fontSize: 13,
                                            color: C.slate800, background: loading ? C.slate100 : C.white,
                                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                        }}
                                    />
                                    <span style={{ fontSize: 12, color: C.slate400, fontWeight: 600 }}>to</span>
                                    <input
                                        type="number"
                                        placeholder="To e.g. 2018"
                                        value={domainYearTo}
                                        onChange={e => setDomainYearTo(e.target.value)}
                                        disabled={loading}
                                        min={1990} max={new Date().getFullYear()}
                                        style={{
                                            flex: 1, padding: '9px 12px', borderRadius: 9,
                                            border: `1.5px solid ${C.slate300}`, fontSize: 13,
                                            color: C.slate800, background: loading ? C.slate100 : C.white,
                                            outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                                        }}
                                    />
                                </div>
                                <p style={{ margin: '5px 0 0', fontSize: 11, color: C.slate400 }}>
                                    Filter leads by when their domain was registered (~60–70% coverage)
                                </p>
                            </div>

                            {/* ── Technology Stack Filter ── */}
                            <div>
                                <Label>Must Use Technology</Label>
                                <div style={{ position: 'relative' }}>
                                    <button
                                        onClick={() => setTechDropdownOpen(o => !o)}
                                        disabled={loading}
                                        style={{
                                            width: '100%', padding: '9px 14px', borderRadius: 9, cursor: 'pointer',
                                            border: `1.5px solid ${requiredTechs.length ? C.indigo : C.slate300}`,
                                            background: requiredTechs.length ? C.indigoLight : C.white,
                                            color: requiredTechs.length ? C.indigo : C.slate400,
                                            fontSize: 12, fontWeight: 700, fontFamily: 'inherit',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}
                                    >
                                        <span>
                                            {requiredTechs.length === 0
                                                ? 'Any technology'
                                                : requiredTechs.join(', ')}
                                        </span>
                                        <span style={{ fontSize: 10 }}>▾</span>
                                    </button>
                                    {techDropdownOpen && (
                                        <div style={{
                                            position: 'absolute', top: '108%', left: 0, right: 0, zIndex: 40,
                                            background: C.white, border: `1px solid ${C.slate200}`,
                                            borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                                            padding: 12, maxHeight: 220, overflowY: 'auto',
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                <span style={{ fontSize: 10, fontWeight: 700, color: C.ink400, textTransform: 'uppercase' }}>
                                                    Select technologies (lead must have at least one)
                                                </span>
                                                {requiredTechs.length > 0 && (
                                                    <button
                                                        onClick={() => setRequiredTechs([])}
                                                        style={{ fontSize: 10, color: C.red, border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                                                    >
                                                        Clear
                                                    </button>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                                                {TECH_OPTIONS.map(t => {
                                                    const active = requiredTechs.includes(t)
                                                    return (
                                                        <button key={t} onClick={() => toggleTech(t)}
                                                            style={{
                                                                padding: '4px 10px', borderRadius: 20, fontSize: 11,
                                                                fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                                                                border: `1.5px solid ${active ? C.indigo : C.slate200}`,
                                                                background: active ? C.indigo : C.white,
                                                                color: active ? C.white : C.slate600,
                                                                transition: 'all 0.12s',
                                                            }}>
                                                            {t}
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <p style={{ margin: '5px 0 0', fontSize: 11, color: C.slate400 }}>
                                    Return leads using any of the selected technologies (~70–80% detection accuracy)
                                </p>
                            </div>

                            {/* ── Genuineness Filter ── */}
                            <div>
                                <Label>Minimum Trust Level</Label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {GENUINENESS_OPTIONS.map(opt => (
                                        <button key={opt.value} onClick={() => setGenuinenessMin(opt.value)} disabled={loading}
                                            style={{
                                                flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer',
                                                border: `1.5px solid ${genuinenessMin === opt.value ? C.indigo : C.slate200}`,
                                                background: genuinenessMin === opt.value ? C.indigoLight : C.white,
                                                color: genuinenessMin === opt.value ? C.indigo : C.slate600,
                                                fontSize: 11, fontWeight: 800, fontFamily: 'inherit',
                                                transition: 'all 0.15s', textAlign: 'center',
                                            }}>
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ margin: '5px 0 0', fontSize: 11, color: C.slate400 }}>
                                    Filter out spam/suspicious leads before saving
                                </p>
                            </div>

                            {/* ── Filter strictness warning ── */}
                            {(requiredTechs.length > 0 && (domainYearFrom || domainYearTo)) && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 9,
                                    background: '#fffbeb', border: `1px solid #fcd34d`,
                                    display: 'flex', alignItems: 'flex-start', gap: 8,
                                }}>
                                    <span style={{ fontSize: 14 }}>⚠️</span>
                                    <div>
                                        <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
                                            Filters may be too strict
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#b45309' }}>
                                            Using both Tech Stack + Year Range together can return 0 results.
                                            Try one filter at a time.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ── Search Preview ── */}
                            {previewKeyword && (
                                <div style={{
                                    padding: '10px 14px', borderRadius: 9,
                                    background: '#f8f7ff', border: `1px solid ${C.slate200}`,
                                }}>
                                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: C.slate400, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Search Query Preview</p>
                                    <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 700, color: C.slate800 }}>"{previewKeyword}"</p>
                                </div>
                            )}

                            {/* ── Max Results ── */}
                            <div>
                                <Label>Max Results</Label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[5, 10, 20, 30].map(n => (
                                        <button key={n} onClick={() => setLimit(n)} disabled={loading}
                                            style={{
                                                flex: 1, padding: '9px 0', borderRadius: 8, cursor: 'pointer',
                                                border: `1.5px solid ${limit === n ? C.indigo : C.slate200}`,
                                                background: limit === n ? C.indigoLight : C.white,
                                                color: limit === n ? C.indigo : C.slate600,
                                                fontSize: 13, fontWeight: 800, fontFamily: 'inherit',
                                                transition: 'all 0.15s',
                                            }}>
                                            {n}
                                        </button>
                                    ))}
                                </div>
                                <p style={{ margin: '6px 0 0', fontSize: 11, color: C.slate400 }}>
                                    Higher numbers take longer (~{limit * 3}–{limit * 6}s). Start with 5–10.
                                </p>
                            </div>

                            {/* ── Loading ── */}
                            {loading && (
                                <div style={{
                                    padding: '14px 16px', borderRadius: 10,
                                    background: C.indigoLight, border: `1px solid ${C.indigoBorder}`,
                                    display: 'flex', alignItems: 'center', gap: 12,
                                }}>
                                    <div style={{
                                        width: 18, height: 18, borderRadius: '50%',
                                        border: `2.5px solid ${C.indigoBorder}`,
                                        borderTopColor: C.indigo,
                                        animation: 'spin 0.8s linear infinite', flexShrink: 0,
                                    }} />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.indigo }}>
                                            AI is searching for companies...
                                        </p>
                                        <p style={{ margin: '2px 0 0', fontSize: 11, color: '#4338ca' }}>
                                            Query: "{previewKeyword}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* ── Footer ── */}
                <div style={{ display: 'flex', gap: 10, padding: '0 26px 22px' }}>
                    {isDone ? (
                        <button onClick={handleClose} className="action-btn"
                            style={{
                                flex: 1, padding: '11px 0', borderRadius: 10,
                                border: 'none', background: C.indigo,
                                fontSize: 14, fontWeight: 800, color: C.white,
                                cursor: 'pointer', fontFamily: 'inherit',
                                boxShadow: '0 4px 14px rgba(79,70,229,0.35)',
                            }}>
                            Loading leads...
                        </button>
                    ) : (
                        <>
                            <button onClick={handleClose} disabled={loading}
                                style={{
                                    flex: 1, padding: '11px 0', borderRadius: 10,
                                    border: `1px solid ${C.slate300}`, background: C.white,
                                    fontSize: 14, fontWeight: 700, color: C.slate600,
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit', opacity: loading ? 0.5 : 1,
                                }}>
                                Cancel
                            </button>
                            <button onClick={handleGenerate} disabled={loading || !keyword.trim()}
                                className="action-btn"
                                style={{
                                    flex: 2, padding: '11px 0', borderRadius: 10, border: 'none',
                                    background: loading || !keyword.trim() ? C.slate300 : C.indigo,
                                    fontSize: 14, fontWeight: 800, color: C.white,
                                    cursor: loading || !keyword.trim() ? 'not-allowed' : 'pointer',
                                    fontFamily: 'inherit',
                                    boxShadow: loading || !keyword.trim() ? 'none' : '0 4px 14px rgba(79,70,229,0.35)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                }}>
                                {loading ? <Spinner /> : <FiZap size={14} />}
                                {loading ? 'Searching...' : 'Generate Leads'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default GenerateLeadsModal