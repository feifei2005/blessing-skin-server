import React from 'react'
import type { TurnstileProps } from '@marsidev/react-turnstile'

export const mockTurnstile = {
  getResponsePromise: jest.fn().mockResolvedValue('token'),
  reset: jest.fn(),
}

const Turnstile = React.forwardRef((props: TurnstileProps, ref) => {
  React.useImperativeHandle(ref, () => mockTurnstile)

  return <div data-testid="turnstile-mock" />
})

export { Turnstile }
