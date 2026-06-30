export type PaymentProviderName = 'test' | 'stripe' | 'mollie'

export interface PaymentParams {
  amount: number
  userId: string
  competitionId: string
  description: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  provider: PaymentProviderName
  error?: string
}

export interface PaymentProvider {
  readonly name: PaymentProviderName
  processPayment(params: PaymentParams): Promise<PaymentResult>
}
