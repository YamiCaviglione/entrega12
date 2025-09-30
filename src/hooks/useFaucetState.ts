import { useAccount } from 'wagmi'
import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  useHasAddressClaimed, 
  useFaucetUsers, 
  useTokenBalance, 
  useFaucetAmount,
  useClaimTokens 
} from './useFaucetContract'
import { FaucetState, LoadingStates, FaucetError } from '../types'

/**
 * Hook principal que maneja todo el estado del faucet
 * Combina todos los hooks individuales y proporciona una interfaz unificada
 */
export function useFaucetState() {
  const { address, isConnected } = useAccount()
  
  // Estados individuales del contrato
  const { hasClaimed, refetch: refetchClaimed } = useHasAddressClaimed(address)
  const { users, refetch: refetchUsers } = useFaucetUsers()
  const { balance, refetch: refetchBalance } = useTokenBalance(address)
  const { faucetAmount } = useFaucetAmount()
  const { 
    claimTokens, 
    hash, 
    isLoading: isClaimLoading, 
    isConfirmed,
    error: claimError 
  } = useClaimTokens()

  // Estados de carga específicos
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    claiming: false,
    checkingStatus: false,
    fetchingUsers: false,
    fetchingBalance: false,
  })

  // Estado consolidado del faucet
  const [faucetState, setFaucetState] = useState<FaucetState>({
    isConnected: false,
    userAddress: null,
    userBalance: 0n,
    hasClaimed: false,
    isLoading: false,
    error: null,
    faucetAmount: 0n,
    faucetUsers: [],
  })

  // Función para actualizar todos los datos
  const refreshData = useCallback(async () => {
    if (!address) return

    setLoadingStates(prev => ({ 
      ...prev, 
      checkingStatus: true, 
      fetchingUsers: true, 
      fetchingBalance: true 
    }))

    try {
      await Promise.all([
        refetchClaimed(),
        refetchUsers(),
        refetchBalance(),
      ])
    } catch (error) {
      console.error('Error refreshing data:', error)
      setFaucetState(prev => ({ 
        ...prev, 
        error: 'Error al actualizar los datos' 
      }))
    } finally {
      setLoadingStates(prev => ({ 
        ...prev, 
        checkingStatus: false, 
        fetchingUsers: false, 
        fetchingBalance: false 
      }))
    }
  }, [address, refetchClaimed, refetchUsers, refetchBalance])

  // Función para reclamar tokens con manejo de errores
  const handleClaimTokens = useCallback(async () => {
    if (!address) {
      setFaucetState(prev => ({ 
        ...prev, 
        error: 'Wallet no conectada' 
      }))
      return
    }

    if (hasClaimed) {
      setFaucetState(prev => ({ 
        ...prev, 
        error: 'Ya has reclamado tokens anteriormente' 
      }))
      return
    }

    setLoadingStates(prev => ({ ...prev, claiming: true }))
    setFaucetState(prev => ({ ...prev, error: null }))

    try {
      await claimTokens()
    } catch (error) {
      console.error('Error claiming tokens:', error)
      setFaucetState(prev => ({ 
        ...prev, 
        error: 'Error al reclamar tokens' 
      }))
    } finally {
      setLoadingStates(prev => ({ ...prev, claiming: false }))
    }
  }, [address, hasClaimed, claimTokens])

  // Calcular isLoading usando useMemo para evitar loops
  const isLoading = useMemo(() => 
    Object.values(loadingStates).some(Boolean), 
    [loadingStates]
  )

  // Efecto para actualizar el estado cuando cambian los datos principales (sin isLoading para evitar loops)
  useEffect(() => {
    setFaucetState(prev => ({
      ...prev,
      isConnected,
      userAddress: address || null,
      userBalance: balance,
      hasClaimed: hasClaimed || false,
      faucetAmount: faucetAmount,
      faucetUsers: users,
    }))
  }, [isConnected, address, balance, hasClaimed, faucetAmount, users])

  // Efecto separado para actualizar solo isLoading
  useEffect(() => {
    setFaucetState(prev => ({
      ...prev,
      isLoading,
    }))
  }, [isLoading])

  // Efecto para refrescar datos cuando se confirma una transacción
  useEffect(() => {
    if (isConfirmed) {
      // Esperar un poco antes de refrescar para que la blockchain se actualice
      setTimeout(() => {
        refreshData()
      }, 2000)
    }
  }, [isConfirmed, refreshData])

  // Efecto para limpiar errores cuando cambia el usuario
  useEffect(() => {
    setFaucetState(prev => ({ ...prev, error: null }))
  }, [address])

  // Utilidades adicionales
  const canClaim = isConnected && address && !hasClaimed && !loadingStates.claiming
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  return {
    // Estado principal
    faucetState,
    loadingStates,
    
    // Acciones
    claimTokens: handleClaimTokens,
    refreshData,
    
    // Estados útiles
    canClaim,
    isAnyLoading,
    
    // Datos de transacción
    transactionHash: hash,
    isTransactionConfirmed: isConfirmed,
    
    // Errores
    claimError,
    
    // Funciones de utilidad
    clearError: () => setFaucetState(prev => ({ ...prev, error: null })),
  }
}
