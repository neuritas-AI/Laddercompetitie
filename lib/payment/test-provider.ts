import type { PaymentProvider, PaymentParams, PaymentResult } from './types'

export class TestPaymentProvider implements PaymentProvider {
  readonly name = 'test' as const

  async processPayment(params: PaymentParams): Promise<PaymentResult> {
    // Simuleert een betaling — vervang later door Stripe/Mollie provider
    await new Promise(resolve => setTimeout(resolve, 800))

    return {
      success: true,
      paymentId: `test_${params.competitionId}_${Date.now()}`,
      provider: 'test',
    }
  }
}
