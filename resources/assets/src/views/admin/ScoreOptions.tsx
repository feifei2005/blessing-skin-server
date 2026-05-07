import React, { useState, useEffect } from 'react'
import * as fetch from '@/scripts/net'
import { toast } from '@/scripts/notify'

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

  if (loading) {
    return (
      <div className="d-flex justify-content-center">
        <div className="spinner-border" />
      </div>
    )
  }
  if (!data) return <div className="alert alert-warning">Failed to load.</div>

  const numberField = (label: string, field: keyof ScoreData) => (
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

  const checkboxField = (label: string, field: keyof ScoreData) => (
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
            <h3 className="card-title">Score Rates</h3>
          </div>
          <div className="card-body">
            {numberField('Score per Storage', 'score_per_storage')}
            {numberField(
              'Private Score per Storage',
              'private_score_per_storage',
            )}
            {numberField('Score per Closet Item', 'score_per_closet_item')}
            {numberField('Score per Player', 'score_per_player')}
            {numberField('User Initial Score', 'user_initial_score')}
            {checkboxField('Return Score on Deletion', 'return_score')}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Report &amp; Sign</h3>
          </div>
          <div className="card-body">
            {numberField('Reporter Score Mod.', 'reporter_score_modification')}
            {numberField('Reporter Reward Score', 'reporter_reward_score')}
            <div className="form-row">
              <div className="col">
                <div className="form-group">
                  <label>Sign Score (From)</label>
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
                  <label>Sign Score (To)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={data.sign_score_to}
                    onChange={(e) => update('sign_score_to', e.target.value)}
                  />
                </div>
              </div>
            </div>
            {numberField('Sign Gap Time', 'sign_gap_time')}
            {checkboxField('Sign After Zero', 'sign_after_zero')}
          </div>
        </div>
      </div>

      <div className="col-md-6">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Sharing</h3>
          </div>
          <div className="card-body">
            {numberField('Score Award per Texture', 'score_award_per_texture')}
            {checkboxField(
              'Take Back Scores After Deletion',
              'take_back_scores_after_deletion',
            )}
            {numberField('Score per Like', 'score_award_per_like')}
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
          Save Score Settings
        </button>
      </div>
    </div>
  )
}

export default ScoreOptions
