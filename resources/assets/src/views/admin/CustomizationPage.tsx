import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { t } from '@/scripts/i18n'

interface CustomizeData {
  home_pic_url: string
  favicon_url: string
  transparent_navbar: boolean
  hide_intro: boolean
  fixed_bg: boolean
  copyright_prefer: string
  copyright_text: string
  custom_css: string
  custom_js: string
  extra: { navbar: string; sidebar: string }
  colors: { navbar: string[]; sidebar: string[] }
}

const CustomizationPage: React.FC = () => {
  const [data, setData] = useState<CustomizeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch
      .get<CustomizeData>('/api/admin/options/customize')
      .then((d) => {
        if (d && d.colors) setData(d)
      })
      .finally(() => setLoading(false))
  }, [])

  const update = (field: string, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleSave = async (action?: string) => {
    if (!data) return
    setSaving(true)
    const body: Record<string, any> = {
      home_pic_url: data.home_pic_url,
      favicon_url: data.favicon_url,
      transparent_navbar: data.transparent_navbar,
      hide_intro: data.hide_intro,
      fixed_bg: data.fixed_bg,
      copyright_prefer: data.copyright_prefer,
      copyright_text: data.copyright_text,
      custom_css: data.custom_css,
      custom_js: data.custom_js,
    }
    if (action === 'color') {
      body.action = 'color'
      body.navbar = data.extra.navbar
      body.sidebar = data.extra.sidebar
    }
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/options/customize',
      body,
    )
    toast[code === 0 ? 'success' : 'error'](message)
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" />
      </div>
    )
  }
  if (!data) return <div className="alert alert-warning">Failed to load.</div>

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.homepage.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.homepage.home_pic_url.title')}</label>
              <input
                className="form-control"
                value={data.home_pic_url}
                onChange={(e) => update('home_pic_url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.homepage.favicon_url.title')}</label>
              <input
                className="form-control"
                value={data.favicon_url}
                onChange={(e) => update('favicon_url', e.target.value)}
              />
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.transparent_navbar}
                onChange={(e) => update('transparent_navbar', e.target.checked)}
              />
              <label className="form-check-label">
                {t('options.homepage.transparent_navbar.label')}
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.hide_intro}
                onChange={(e) => update('hide_intro', e.target.checked)}
              />
              <label className="form-check-label">
                {t('options.homepage.hide_intro.label')}
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.fixed_bg}
                onChange={(e) => update('fixed_bg', e.target.checked)}
              />
              <label className="form-check-label">
                {t('options.homepage.fixed_bg.label')}
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {t('admin.customize.change-color.title')}
            </h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.homepage.copyright_prefer.title')}</label>
              <select
                className="form-control"
                value={data.copyright_prefer}
                onChange={(e) => update('copyright_prefer', e.target.value)}
              >
                <option value="0">Powered by Blessing Skin</option>
                <option value="1">Powered by Blessing Skin Server</option>
                <option value="2">
                  Proudly powered by Blessing Skin Server
                </option>
                <option value="3">由 Blessing Skin Server 强力驱动</option>
                <option value="4">采用 Blessing Skin Server 搭建</option>
                <option value="5">使用 Blessing Skin Server 稳定运行</option>
                <option value="6">自豪地采用 Blessing Skin Server</option>
              </select>
            </div>
            <div className="form-group">
              <label>{t('options.homepage.copyright_text.title')}</label>
              <textarea
                className="form-control"
                rows={3}
                value={data.copyright_text}
                onChange={(e) => update('copyright_text', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.customJsCss.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.customJsCss.custom_css')}</label>
              <textarea
                className="form-control"
                rows={4}
                value={data.custom_css}
                onChange={(e) => update('custom_css', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.customJsCss.custom_js')}</label>
              <textarea
                className="form-control"
                rows={4}
                value={data.custom_js}
                onChange={(e) => update('custom_js', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('admin.customize.colors.navbar')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('admin.customize.colors.navbar')}</label>
              <select
                className="form-control"
                value={data.extra.navbar}
                onChange={(e) =>
                  setData({
                    ...data,
                    extra: { ...data.extra, navbar: e.target.value },
                  })
                }
              >
                {data.colors.navbar.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>{t('admin.customize.colors.sidebar')}</label>
              <select
                className="form-control"
                value={data.extra.sidebar}
                onChange={(e) =>
                  setData({
                    ...data,
                    extra: { ...data.extra, sidebar: e.target.value },
                  })
                }
              >
                {data.colors.sidebar.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-primary mt-2"
              disabled={saving}
              onClick={() => handleSave('color')}
            >
              {t('general.submit')}
            </button>
          </div>
        </div>
      </div>

      <div className="col-12">
        <button
          className="btn btn-success"
          disabled={saving}
          onClick={() => handleSave()}
        >
          {saving ? <i className="fas fa-spinner fa-spin mr-1" /> : null}
          {t('general.submit')}
        </button>
      </div>
    </div>
  )
}

export default CustomizationPage
