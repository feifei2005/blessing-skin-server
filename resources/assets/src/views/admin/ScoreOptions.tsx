import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'
import { t } from '@/scripts/i18n'

interface ScoreData {
  score_per_storage: number
  private_score_per_storage: number
  score_per_closet_item: number
  return_score: boolean
  score_per_player: number
  user_initial_score: number
  reporter_score_modification: number
  reporter_reward_score: number
  sign_score_from: string
  sign_score_to: string
  sign_gap_time: number
  sign_after_zero: boolean
  score_award_per_texture: number
  take_back_scores_after_deletion: boolean
  score_award_per_like: number
}

const ScoreOptions: React.FC = () => {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch
      .get<ScoreData>('/api/admin/options/score')
      .then((d) => {
        if (d && d.score_per_storage !== undefined) setData(d)
      })
      .catch((e) => console.warn('[ScoreOptions] fetch failed:', e))
      .finally(() => setLoading(false))
  }, [])

  const update = (field: keyof ScoreData, value: any) => {
    if (!data) return
    setData({ ...data, [field]: value })
  }

  const handleSave = async () => {
    if (!data) return
    setSaving(true)
    const { code, message } = await fetch.post<fetch.ResponseBody>(
      '/api/admin/options/score',
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

  const nf = (label: string, field: keyof ScoreData) => (
    <div className="form-group">
      <label>{label}</label>
      <input
        type="number"
        className="form-control"
        value={data[field] as number}
        onChange={(e) => update(field, Number(e.target.value))}
      />
    </div>
  )
  const cbf = (label: string, field: keyof ScoreData) => (
    <div className="form-check mb-2">
      <input
        type="checkbox"
        className="form-check-input"
        checked={data[field] as boolean}
        onChange={(e) => update(field, e.target.checked)}
      />
      <label className="form-check-label">{label}</label>
    </div>
  )

  return (
    <div className="row">
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.rate.title')}</h3>
          </div>
          <div className="card-body">
            {nf(t('options.rate.score_per_storage.title'), 'score_per_storage')}
            {nf(
              t('options.rate.private_score_per_storage.title'),
              'private_score_per_storage',
            )}
            {nf(
              t('options.rate.score_per_closet_item.title'),
              'score_per_closet_item',
            )}
            {nf(t('options.rate.score_per_player.title'), 'score_per_player')}
            {nf(t('options.rate.user_initial_score'), 'user_initial_score')}
            {cbf(t('options.rate.return_score.label'), 'return_score')}
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.report.title')}</h3>
          </div>
          <div className="card-body">
            {nf(
              t('options.report.reporter_score_modification.title'),
              'reporter_score_modification',
            )}
            {nf(
              t('options.report.reporter_reward_score.title'),
              'reporter_reward_score',
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.sign.title')}</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="col">
                <div className="form-group">
                  <label>{t('options.sign.sign_score.addon1')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={data.sign_score_from}
                    onChange={(e) => update('sign_score_from', e.target.value)}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label>{t('options.sign.sign_score.addon2')}</label>
                  <input
                    type="number"
                    className="form-control"
                    value={data.sign_score_to}
                    onChange={(e) => update('sign_score_to', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {nf(t('options.sign.sign_gap_time.title'), 'sign_gap_time')}
            {cbf(t('options.sign.sign_after_zero.label'), 'sign_after_zero')}
          </div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">{t('options.sharing.title')}</h3>
          </div>
          <div className="card-body">
            {nf(
              t('options.sharing.score_award_per_texture.title'),
              'score_award_per_texture',
            )}
            {cbf(
              t('options.sharing.take_back_scores_after_deletion.label'),
              'take_back_scores_after_deletion',
            )}
            {nf(
              t('options.sharing.score_award_per_like.title'),
              'score_award_per_like',
            )}
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

export default ScoreOptions
