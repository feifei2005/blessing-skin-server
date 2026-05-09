import React, { Component, ErrorInfo, ReactNode } from 'react'
import { t } from '@/scripts/i18n'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * 全局错误边界组件
 * 捕获子组件树中的渲染错误，防止整个应用白屏崩溃
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] 捕获到渲染错误:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mt-5">
          <div className="alert alert-danger">
            <h4 className="alert-heading">
              {t('general.fatalError') || '发生了错误'}
            </h4>
            <p>{this.state.error?.message}</p>
            <hr />
            <button
              className="btn btn-outline-danger"
              onClick={this.handleReload}
            >
              {t('general.confirm') || '刷新页面'}
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
