import { useState, useCallback, useEffect } from 'react'
import { useAccount, useSignMessage } from 'wagmi'
import { apiService, type ApiResponse, type AuthTokens } from '../services/apiService'

export interface SiweAuthState {
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  address: string | null
  token: string | null
}

export interface SiweAuthActions {
  signIn: () => Promise<boolean>
  signOut: () => void
  clearError: () => void
  checkAuthStatus: () => Promise<boolean>
}

/**
 * Hook para manejar la autenticación SIWE (Sign-In with Ethereum)
 */
export function useSiweAuth(): SiweAuthState & SiweAuthActions {
  const { address, isConnected } = useAccount()
  const { signMessageAsync } = useSignMessage()

  const [authState, setAuthState] = useState<SiweAuthState>({
    isAuthenticated: false,
    isLoading: false,
    error: null,
    address: null,
    token: null
  })

  /**
   * Verifica el estado de autenticación actual
   */
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    const token = apiService.getAuthToken()
    const tokenAddress = apiService.getAddressFromToken()

    if (!token || !tokenAddress) {
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        address: null,
        token: null
      }))
      return false
    }

    // Verificar que el token sea válido con el servidor
    try {
      const response = await apiService.verifyToken()
      
      if (response.success) {
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: true,
          address: tokenAddress,
          token,
          error: null
        }))
        return true
      } else {
        // Token inválido, limpiar
        apiService.logout()
        setAuthState(prev => ({
          ...prev,
          isAuthenticated: false,
          address: null,
          token: null,
          error: 'Sesión expirada'
        }))
        return false
      }
    } catch (error) {
      console.error('Error verificando token:', error)
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        error: 'Error verificando autenticación'
      }))
      return false
    }
  }, [])

  /**
   * Proceso completo de autenticación SIWE
   */
  const signIn = useCallback(async (): Promise<boolean> => {
    if (!address || !isConnected) {
      setAuthState(prev => ({
        ...prev,
        error: 'Wallet no conectada'
      }))
      return false
    }

    setAuthState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }))

    try {
      console.log('🔐 Iniciando proceso de autenticación SIWE...')

      // Paso 1: Solicitar mensaje SIWE del backend
      console.log('📝 Solicitando mensaje SIWE...')
      const messageResponse = await apiService.requestSiweMessage(address)

      if (!messageResponse.success || !messageResponse.data) {
        throw new Error(messageResponse.error || 'Error solicitando mensaje SIWE')
      }

      const { message } = messageResponse.data

      // Paso 2: Firmar el mensaje con la wallet
      console.log('✍️ Firmando mensaje SIWE...')
      const signature = await signMessageAsync({ message })

      // Paso 3: Enviar firma al backend para autenticación
      console.log('🔓 Autenticando con el backend...')
      const authResponse = await apiService.authenticateWithSiwe({
        message,
        signature
      })

      if (!authResponse.success || !authResponse.data) {
        throw new Error(authResponse.error || 'Error en autenticación')
      }

      console.log('✅ Autenticación SIWE exitosa!')

      setAuthState(prev => ({
        ...prev,
        isAuthenticated: true,
        isLoading: false,
        address: authResponse.data!.address,
        token: authResponse.data!.token,
        error: null
      }))

      return true

    } catch (error: any) {
      console.error('❌ Error en autenticación SIWE:', error)
      
      let errorMessage = 'Error en autenticación'
      
      if (error.message.includes('User rejected')) {
        errorMessage = 'Firma rechazada por el usuario'
      } else if (error.message.includes('nonce')) {
        errorMessage = 'Error de nonce. Intenta de nuevo.'
      } else if (error.message.includes('firma')) {
        errorMessage = 'Error en la verificación de firma'
      } else if (error.message.includes('red') || error.message.includes('network')) {
        errorMessage = 'Error de conexión. Verifica tu red.'
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false
      }))

      return false
    }
  }, [address, isConnected, signMessageAsync])

  /**
   * Cerrar sesión
   */
  const signOut = useCallback(() => {
    console.log('🚪 Cerrando sesión SIWE...')
    apiService.logout()
    
    setAuthState(prev => ({
      ...prev,
      isAuthenticated: false,
      address: null,
      token: null,
      error: null
    }))
  }, [])

  /**
   * Limpiar error
   */
  const clearError = useCallback(() => {
    setAuthState(prev => ({
      ...prev,
      error: null
    }))
  }, [])

  // Verificar autenticación cuando cambia la dirección conectada
  useEffect(() => {
    if (isConnected && address) {
      checkAuthStatus()
    } else {
      // Si no hay wallet conectada, limpiar autenticación
      setAuthState(prev => ({
        ...prev,
        isAuthenticated: false,
        address: null,
        token: null
      }))
    }
  }, [address, isConnected, checkAuthStatus])

  // Verificar autenticación al cargar la página
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

  return {
    ...authState,
    signIn,
    signOut,
    clearError,
    checkAuthStatus
  }
}
