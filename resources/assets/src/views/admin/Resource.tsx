import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { t } from '@/scripts/i18n'

interface ResourceData {
  force_ssl: boolean
  auto_detect_asset_url: boolean
  cache_expire_time: string
  cdn_address: string
  enable_avatar_cache: boolean
  enable_preview_cache: boolean
}

const Resource: React.FC = () => {
  const [data, setData] = useState<ResourceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [clearing, setClearing] = useState(false)

  useEffect(() => {
    fetch
      .get<ResourceData>('/api/admin/options/resource')
      .then((d) => {
        if (d && d.force_ssl !== undefined) setData(d)
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof ResourceData, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/options/resource',
      data,
    )
    toast[code === 0 ? 'success' : 'error'](message)
    setSaving(false)
  }

  const handleClearCache = async () => {
    setClearing(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/options/resource/clear-cache',
    )
    toast[code === 0 ? 'success' : 'error'](message)
    setClearing(false)
  }

  if (loading)
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" />
      </div>
    )
  if (!data) return <div className="alert alert-warning">Failed to load.</div>

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.resources.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.force_ssl}
                onChange={(e) => update('force_ssl', e.target.checked)}
              />
              <label className="form-check-label">
                {t('options.resources.force_ssl.label')}
              </label>
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.auto_detect_asset_url}
                onChange={(e) =>
                  update('auto_detect_asset_url', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.resources.auto_detect_asset_url.label')}
              </label>
            </div>
            <div className="form-group">
              <label>{t('options.resources.cache_expire_time.title')}</label>
              <input
                className="form-control"
                value={data.cache_expire_time}
                onChange={(e) => update('cache_expire_time', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.resources.cdn_address.title')}</label>
              <input
                className="form-control"
                value={data.cdn_address}
                onChange={(e) => update('cdn_address', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.cache.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.enable_avatar_cache}
                onChange={(e) =>
                  update('enable_avatar_cache', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.cache.enable_avatar_cache.label')}
              </label>
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.enable_preview_cache}
                onChange={(e) =>
                  update('enable_preview_cache', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.cache.enable_preview_cache.label')}
              </label>
            </div>
            <button
              className="btn btn-warning mt-3"
              disabled={clearing}
              onClick={handleClearCache}
            >
              {clearing ? <i className="fas fa-spinner fa-spin mr-1" /> : null}
              {t('options.cache.clear')}
            </button>
          </div>
        </div>
      </div>
      <div className="col-12">
        <button
          className="btn btn-success"
          disabled={saving}
          onClick={handleSave}
        >
          {saving ? <i className="fas fa-spinner fa-spin mr-1" /> : null}
          {t('general.submit')}
        </button>
      </div>
    </div>
  )
}

export default Resource
