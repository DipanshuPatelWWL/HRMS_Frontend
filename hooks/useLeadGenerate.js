import { useState, useCallback } from 'react'
import { generateLeads } from '../services/intelligenceApi'

export const useLeadGenerate = () => {
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)
    const [error, setError] = useState('')

    const generate = useCallback(async (keyword, limit = 20, qualityFilters = {}, filters = {}) => {
        if (!keyword.trim()) { setError('Keyword is required'); return null }
        setLoading(true)
        setError('')
        setResult(null)
        try {
            const { data } = await generateLeads({
                keyword: keyword.trim(),
                limit,
                source: filters.source || 'web',
                location: filters.location || '',
                search_mode: filters.searchMode || 'fast',
                country: filters.country || '',
                cities: filters.cities || [],
                postalCodes: filters.postalCodes || '',
                domainYearFrom: filters.domainYearFrom || null,
                domainYearTo: filters.domainYearTo || null,
                requiredTechs: filters.requiredTechs || [],
                genuinenessMin: filters.genuinenessMin || 0,
            })
            setResult(data)
            return data
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to generate leads'
            setError(msg)
            return null
        } finally {
            setLoading(false)
        }
    }, [])

    const reset = useCallback(() => { 
        setResult(null)
        setError('') 
    }, [])

    return { generate, loading, result, error, reset }
}