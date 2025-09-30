// Servicio para comunicarse con la API del backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  message?: string
}

export interface AuthTokens {
  token: string
  address: string
}

export interface SiweAuthData {
  message: string
  signature: string
}

export interface FaucetStatus {
  hasClaimed: boolean
  balance: string
  users: string[]
  faucetAmount: string
}

export interface ClaimResult {
  txHash: string
  success: boolean
  message?: string
}

class ApiService {
  private baseUrl: string
  private authToken: string | null = null

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
    
    // Cargar token del localStorage si existe
    if (typeof window !== 'undefined') {
      this.authToken = localStorage.getItem('faucet_auth_token')
    }
  }

  /**
   * Configura el token de autenticación
   */
  setAuthToken(token: string | null) {
    this.authToken = token
    
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('faucet_auth_token', token)
      } else {
        localStorage.removeItem('faucet_auth_token')
      }
    }
  }

  /**
   * Obtiene el token de autenticación actual
   */
  getAuthToken(): string | null {
    return this.authToken
  }

  /**
   * Realiza una petición HTTP
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Agregar token de autenticación si existe
    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`
    }

    try {
      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`)
      
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()

      if (!response.ok) {
        console.error(`❌ API Error ${response.status}:`, data)
        return {
          success: false,
          error: data.error || `HTTP ${response.status}`,
          code: data.code
        }
      }

      console.log(`✅ API Success: ${options.method || 'GET'} ${url}`)
      return data

    } catch (error: any) {
      console.error(`❌ Network Error:`, error)
      return {
        success: false,
        error: 'Error de conexión con el servidor',
        code: 'NETWORK_ERROR'
      }
    }
  }

  /**
   * Verifica si el servidor está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.request('/health')
      return response.success
    } catch {
      return false
    }
  }

  // --- Métodos de Autenticación ---

  /**
   * Solicita un mensaje SIWE para firmar
   */
  async requestSiweMessage(address: string): Promise<ApiResponse<{ message: string, nonce: string }>> {
    return this.request('/auth/message', {
      method: 'POST',
      body: JSON.stringify({ address })
    })
  }

  /**
   * Autentica con firma SIWE y obtiene JWT token
   */
  async authenticateWithSiwe(authData: SiweAuthData): Promise<ApiResponse<AuthTokens>> {
    const response = await this.request<AuthTokens>('/auth/signin', {
      method: 'POST',
      body: JSON.stringify(authData)
    })

    // Si la autenticación es exitosa, guardar el token
    if (response.success && response.data) {
      this.setAuthToken(response.data.token)
    }

    return response
  }

  /**
   * Verifica si el token actual es válido
   */
  async verifyToken(): Promise<ApiResponse<any>> {
    return this.request('/auth/verify')
  }

  /**
   * Cierra sesión (elimina token)
   */
  logout() {
    this.setAuthToken(null)
    console.log('🚪 Sesión cerrada')
  }

  // --- Métodos del Faucet ---

  /**
   * Reclama tokens del faucet
   */
  async claimTokens(): Promise<ApiResponse<ClaimResult>> {
    return this.request('/faucet/claim', {
      method: 'POST'
    })
  }

  /**
   * Obtiene el estado del faucet para una dirección
   */
  async getFaucetStatus(address: string): Promise<ApiResponse<FaucetStatus>> {
    return this.request(`/faucet/status/${address}`)
  }

  /**
   * Obtiene información general del faucet
   */
  async getFaucetInfo(): Promise<ApiResponse<{
    contractAddress: string
    chainId: number
    faucetAmount: string
    totalUsers: number
    serverWallet: string
    serverBalance: string
  }>> {
    return this.request('/faucet/info')
  }

  /**
   * Obtiene la lista de usuarios del faucet
   */
  async getFaucetUsers(page: number = 1, limit: number = 50): Promise<ApiResponse<{
    users: string[]
    pagination: {
      currentPage: number
      totalPages: number
      totalUsers: number
      usersPerPage: number
    }
  }>> {
    return this.request(`/faucet/users?page=${page}&limit=${limit}`)
  }

  // --- Métodos de utilidad ---

  /**
   * Verifica si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    return !!this.authToken
  }

  /**
   * Extrae la dirección del token JWT (sin verificar)
   */
  getAddressFromToken(): string | null {
    if (!this.authToken) return null

    try {
      const payload = JSON.parse(atob(this.authToken.split('.')[1]))
      return payload.address || null
    } catch {
      return null
    }
  }
}

// Instancia singleton del servicio API
export const apiService = new ApiService()

// Hook para usar el servicio API en componentes React
export function useApiService() {
  return apiService
}
