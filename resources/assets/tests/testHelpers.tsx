import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'

interface RouterRenderOptions extends RenderOptions {
  route?: string
  path?: string
}

export function renderWithRouter(
  ui: React.ReactElement,
  { route = '/', path, ...options }: RouterRenderOptions = {},
) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      {path ? <Route path={path}>{ui}</Route> : ui}
    </MemoryRouter>,
    options,
  )
}
