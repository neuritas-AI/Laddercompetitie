import type { PaymentProvider, PaymentProviderName } from './types'
import { TestPaymentProvider } from './test-provider'

const providers: Record<PaymentProviderName, () => PaymentProvider> = {
  test: () => new TestPaymentProvider(),
  stripe: () => {
    throw new Error('Stripe provider is nog niet geconfigureerd.')
  },
  mollie: () => {
    throw new Error('Mollie provider is nog niet geconfigureerd.')
  },
}

export function getPaymentProvider(name: PaymentProviderName = 'test'): PaymentProvider {
  return providers[name]()
}

export type { PaymentProvider, PaymentParams, PaymentResult, PaymentProviderName } from './types'
