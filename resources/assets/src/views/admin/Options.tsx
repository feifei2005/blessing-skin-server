import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'

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
  recaptcha_sitekey: string
  recaptcha_secretkey: string
  recaptcha_invisible: boolean
}

const Options: React.FC = () => {
  const [data, setData] = useState<GeneralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch
      .get<GeneralData>('/api/admin/options/general')
      .then(setData)
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
            <h3 className="card-title">Site Info</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Site Name</label>
              <input
                className="form-control"
                value={data.site_name}
                onChange={(e) => update('site_name', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input
                className="form-control"
                value={data.site_description}
                onChange={(e) => update('site_description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Site URL</label>
              <input
                className="form-control"
                value={data.site_url}
                onChange={(e) => update('site_url', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Announcement</label>
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
            <h3 className="card-title">Registration</h3>
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
                Register with Player Name
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
                Require Email Verification
              </label>
            </div>
            <div className="form-group">
              <label>Registrations per IP</label>
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
            <h3 className="card-title">Upload</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Max File Size (KB)</label>
              <input
                className="form-control"
                value={data.max_upload_file_size}
                onChange={(e) => update('max_upload_file_size', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Max Texture Width (px)</label>
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
                Allow Downloading Textures
              </label>
            </div>
            <div className="form-group">
              <label>Player Name Rule</label>
              <select
                className="form-control"
                value={data.player_name_rule}
                onChange={(e) => update('player_name_rule', e.target.value)}
              >
                <option value="official">Official (A-Z, 0-9, _)</option>
                <option value="cjk">CJK</option>
                <option value="utf8">UTF-8</option>
                <option value="custom">Custom Regex</option>
              </select>
            </div>
            {data.player_name_rule === 'custom' && (
              <div className="form-group">
                <label>Custom Regex</label>
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
                  <label>Name Length Min</label>
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
                  <label>Name Length Max</label>
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
            <h3 className="card-title">SEO &amp; reCAPTCHA</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Meta Keywords</label>
              <input
                className="form-control"
                value={data.meta_keywords}
                onChange={(e) => update('meta_keywords', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Meta Description</label>
              <input
                className="form-control"
                value={data.meta_description}
                onChange={(e) => update('meta_description', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Meta Extras</label>
              <textarea
                className="form-control"
                rows={2}
                value={data.meta_extras}
                onChange={(e) => update('meta_extras', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>reCAPTCHA Site Key</label>
              <input
                className="form-control"
                value={data.recaptcha_sitekey}
                onChange={(e) => update('recaptcha_sitekey', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>reCAPTCHA Secret Key</label>
              <input
                className="form-control"
                value={data.recaptcha_secretkey}
                onChange={(e) => update('recaptcha_secretkey', e.target.value)}
              />
            </div>
            <div className="form-check mb-2">
              <input
                type="checkbox"
                className="form-check-input"
                checked={data.recaptcha_invisible}
                onChange={(e) =>
                  update('recaptcha_invisible', e.target.checked)
                }
              />
              <label className="form-check-label">Invisible reCAPTCHA</label>
            </div>
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Content Policy</h3>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Content Policy</label>
              <textarea
                className="form-control"
                rows={3}
                value={data.content_policy}
                onChange={(e) => update('content_policy', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Texture Name Regex</label>
              <input
                className="form-control"
                value={data.texture_name_regexp}
                onChange={(e) => update('texture_name_regexp', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Private Texture Status Code</label>
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
                Auto Delete Invalid Textures
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
          Save General Settings
        </button>
      </div>
    </div>
  )
}

export default Options
