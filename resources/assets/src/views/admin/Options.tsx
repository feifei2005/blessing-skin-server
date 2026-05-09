import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { t } from '@/scripts/i18n'

interface GeneralData {
  site_name: string
  site_description: string
  site_url: string
  register_with_player_name: boolean
  require_verification: boolean
  regs_per_ip: string
  max_upload_file_size: string
  max_texture_width: string
  player_name_rule: string
  custom_player_name_regexp: string
  player_name_length_min: string
  player_name_length_max: string
  auto_del_invalid_texture: boolean
  allow_downloading_texture: boolean
  status_code_for_private: string
  texture_name_regexp: string
  content_policy: string
  announcement: string
  meta_keywords: string
  meta_description: string
  meta_extras: string
  turnstile_sitekey: string
  turnstile_secretkey: string
}

const Options: React.FC = () => {
  const [data, setData] = useState<GeneralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch
      .get<GeneralData>('/api/admin/options/general')
      .then((d) => {
        if (d && d.site_name !== undefined) setData(d)
      })
      .catch((e) => console.warn('[Options] fetch failed:', e))
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof GeneralData, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/options/general',
      data,
    )
    toast[code === 0 ? 'success' : 'error'](message)
    setSaving(false)
  }

  if (loading)
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" />
      </div>
    )
  if (!data)
    return (
      <div className="alert alert-warning">{t('general.failed-to-load')}</div>
    )

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {t('admin.customize.change-color.title')}
            </h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.general.site_name')}</label>
              <input
                className="form-control"
                value={data.site_name}
                onChange={(e) => update('site_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.general.site_description.title')}</label>
              <input
                className="form-control"
                value={data.site_description}
                onChange={(e) => update('site_description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.general.site_url.title')}</label>
              <input
                className="form-control"
                value={data.site_url}
                onChange={(e) => update('site_url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.announ.announcement.description')}</label>
              <textarea
                className="form-control"
                rows={3}
                value={data.announcement}
                onChange={(e) => update('announcement', e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('general.register')}</h3>
          </div>
          <div className="card-body">
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.register_with_player_name}
                onChange={(e) =>
                  update('register_with_player_name', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.general.register_with_player_name.label')}
              </label>
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.require_verification}
                onChange={(e) =>
                  update('require_verification', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.general.require_verification.label')}
              </label>
            </div>
            <div className="form-group">
              <label>{t('options.general.regs_per_ip')}</label>
              <input
                className="form-control"
                value={data.regs_per_ip}
                onChange={(e) => update('regs_per_ip', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('general.skin')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.general.max_upload_file_size.title')}</label>
              <input
                className="form-control"
                value={data.max_upload_file_size}
                onChange={(e) => update('max_upload_file_size', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.general.max_texture_width.title')}</label>
              <input
                className="form-control"
                value={data.max_texture_width}
                onChange={(e) => update('max_texture_width', e.target.value)}
              />
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.allow_downloading_texture}
                onChange={(e) =>
                  update('allow_downloading_texture', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.general.allow_downloading_texture.label')}
              </label>
            </div>
            <div className="form-group">
              <label>{t('options.general.player_name_rule.title')}</label>
              <select
                className="form-control"
                value={data.player_name_rule}
                onChange={(e) => update('player_name_rule', e.target.value)}
              >
                <option value="official">
                  {t('options.general.player_name_rule.official')}
                </option>
                <option value="cjk">
                  {t('options.general.player_name_rule.cjk')}
                </option>
                <option value="utf8">
                  {t('options.general.player_name_rule.utf8')}
                </option>
                <option value="custom">
                  {t('options.general.player_name_rule.custom')}
                </option>
              </select>
            </div>
            {data.player_name_rule === 'custom' && (
              <div className="form-group">
                <label>
                  {t('options.general.custom_player_name_regexp.title')}
                </label>
                <input
                  className="form-control"
                  value={data.custom_player_name_regexp}
                  onChange={(e) =>
                    update('custom_player_name_regexp', e.target.value)
                  }
                />
              </div>
            )}
            <div className="form-row">
              <div className="col">
                <div className="form-group">
                  <label>{t('options.general.player_name_length.min')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={data.player_name_length_min}
                    onChange={(e) =>
                      update('player_name_length_min', e.target.value)
                    }
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label>{t('options.general.player_name_length.max')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={data.player_name_length_max}
                    onChange={(e) =>
                      update('player_name_length_max', e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.turnstile.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.meta.meta_keywords.title')}</label>
              <input
                className="form-control"
                value={data.meta_keywords}
                onChange={(e) => update('meta_keywords', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.meta.meta_description.title')}</label>
              <input
                className="form-control"
                value={data.meta_description}
                onChange={(e) => update('meta_description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.meta.meta_extras.title')}</label>
              <textarea
                className="form-control"
                rows={2}
                value={data.meta_extras}
                onChange={(e) => update('meta_extras', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.turnstile.turnstile_sitekey.title')}</label>
              <input
                className="form-control"
                value={data.turnstile_sitekey}
                onChange={(e) => update('turnstile_sitekey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.turnstile.secret_key')}</label>
              <input
                type="password"
                className="form-control"
                placeholder={t('options.turnstile.secret_key_placeholder')}
                value={data.turnstile_secretkey}
                onChange={(e) => update('turnstile_secretkey', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              {t('options.general.content_policy.title')}
            </h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>{t('options.general.content_policy.title')}</label>
              <textarea
                className="form-control"
                rows={3}
                value={data.content_policy}
                onChange={(e) => update('content_policy', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>{t('options.general.texture_name_regexp.title')}</label>
              <input
                className="form-control"
                value={data.texture_name_regexp}
                onChange={(e) => update('texture_name_regexp', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>
                {t('options.general.status_code_for_private.title')}
              </label>
              <select
                className="form-control"
                value={data.status_code_for_private}
                onChange={(e) =>
                  update('status_code_for_private', e.target.value)
                }
              >
                <option value="403">403 Forbidden</option>
                <option value="404">404 Not Found</option>
              </select>
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.auto_del_invalid_texture}
                onChange={(e) =>
                  update('auto_del_invalid_texture', e.target.checked)
                }
              />
              <label className="form-check-label">
                {t('options.general.auto_del_invalid_texture.label')}
              </label>
            </div>
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

export default Options
