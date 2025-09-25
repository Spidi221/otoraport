// Przelewy24 integration library
import crypto from 'crypto'

export interface PaymentData {
  amount: number // amount in grosze (Polish cents)
  currency: string // 'PLN'
  description: string
  email: string
  client: string
  urlReturn: string
  urlStatus: string
  sessionId: string
}

export interface P24Config {
  merchantId: number
  posId: number
  crc: string
  apiKey: string
  sandbox: boolean
}

export class Przelewy24 {
  private config: P24Config
  private baseUrl: string

  constructor(config: P24Config) {
    this.config = config
    this.baseUrl = config.sandbox 
      ? 'https://sandbox.przelewy24.pl/api/v1'
      : 'https://secure.przelewy24.pl/api/v1'
  }

  /**
   * Generate security sign for transaction registration
   */
  private generateSign(data: PaymentData): string {
    // P24 signature format: sessionId|merchantId|amount|currency|crc
    const signString = `${data.sessionId}|${this.config.merchantId}|${data.amount}|${data.currency}|${this.config.crc}`
    
    return crypto
      .createHash('md5')
      .update(signString, 'utf8')
      .digest('hex')
  }

  /**
   * Register transaction with Przelewy24
   */
  async registerTransaction(data: PaymentData): Promise<{
    success: boolean
    token?: string
    error?: string
    redirectUrl?: string
  }> {
    try {
      const sign = this.generateSign(data)
      
      const payload = {
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: data.sessionId,
        amount: data.amount,
        currency: data.currency,
        description: data.description,
        email: data.email,
        client: data.client,
        urlReturn: data.urlReturn,
        urlStatus: data.urlStatus,
        sign: sign
      }

      const response = await fetch(`${this.baseUrl}/transaction/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.config.posId}:${this.config.apiKey}`).toString('base64')}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok && result.data?.token) {
        const redirectUrl = `https://${this.config.sandbox ? 'sandbox.' : ''}przelewy24.pl/trnRequest/${result.data.token}`
        
        return {
          success: true,
          token: result.data.token,
          redirectUrl
        }
      }

      return {
        success: false,
        error: result.error || 'Transaction registration failed'
      }

    } catch (error) {
      console.error('Przelewy24 registration error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Verify transaction status
   */
  async verifyTransaction(sessionId: string, amount: number, orderId: number): Promise<{
    success: boolean
    verified?: boolean
    error?: string
  }> {
    try {
      // Generate verification sign: sessionId|orderId|amount|currency|crc
      const signString = `${sessionId}|${orderId}|${amount}|PLN|${this.config.crc}`
      
      const sign = crypto
        .createHash('md5')
        .update(signString, 'utf8')
        .digest('hex')

      const payload = {
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId,
        amount,
        currency: 'PLN',
        orderId,
        sign
      }

      const response = await fetch(`${this.baseUrl}/transaction/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(`${this.config.posId}:${this.config.apiKey}`).toString('base64')}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      return {
        success: true,
        verified: response.ok && result.data?.status === 'success'
      }

    } catch (error) {
      console.error('Przelewy24 verification error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      }
    }
  }
}

// Create instance with environment variables
export const przelewy24 = new Przelewy24({
  merchantId: parseInt(process.env.P24_MERCHANT_ID || '0'),
  posId: parseInt(process.env.P24_POS_ID || '0'),
  crc: process.env.P24_CRC || '',
  apiKey: process.env.P24_API_KEY || '',
  sandbox: process.env.NODE_ENV !== 'production'
})