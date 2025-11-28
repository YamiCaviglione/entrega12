import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_CONFIG } from '../config/faucetContract'
import { FaucetError } from '../types'

/**
 * Hook para verificar si una dirección ya ha reclamado tokens del faucet
 * @param address - Dirección de la wallet a verificar
 */
export function useHasAddressClaimed(address?: string) {
  const { data, error, isLoading, refetch } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'hasAddressClaimed',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address, // Solo ejecutar si hay una dirección
      refetchOnWindowFocus: false,
      staleTime: 30000, // Cache por 30 segundos
    },
  })

  return {
    hasClaimed: data as boolean,
    error,
    isLoading,
    refetch
  }
}

/**
 * Hook para obtener la lista de usuarios que han interactuado con el faucet
 */
export function useFaucetUsers() {
  const { data, error, isLoading, refetch } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getFaucetUsers',
    query: {
      refetchOnWindowFocus: false,
      staleTime: 60000, // Cache por 1 minuto
    },
  })

  return {
    users: (data as string[]) || [],
    error,
    isLoading,
    refetch
  }
}

/**
 * Hook para obtener el balance de tokens de una dirección
 * @param address - Dirección de la wallet
 */
export function useTokenBalance(address?: string) {
  const { data, error, isLoading, refetch } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'balanceOf',
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
      refetchOnWindowFocus: false,
      staleTime: 15000, // Cache por 15 segundos
    },
  })

  return {
    balance: (data as bigint) || 0n,
    error,
    isLoading,
    refetch
  }
}

/**
 * Hook para obtener la cantidad de tokens que se pueden reclamar del faucet
 */
export function useFaucetAmount() {
  const { data, error, isLoading } = useReadContract({
    ...CONTRACT_CONFIG,
    functionName: 'getFaucetAmount',
    query: {
      refetchOnWindowFocus: false,
      staleTime: 300000, // Cache por 5 minutos (este valor no cambia frecuentemente)
    },
  })

  return {
    faucetAmount: (data as bigint) || 0n,
    error,
    isLoading
  }
}

/**
 * Hook para reclamar tokens del faucet
 * Incluye manejo completo del estado de la transacción
 */
export function useClaimTokens() {
  const {
    writeContract,
    data: hash,
    error: writeError,
    isPending: isWritePending
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    error: confirmError
  } = useWaitForTransactionReceipt({
    hash,
  })

  const claimTokens = async () => {
    try {
      writeContract({
        ...CONTRACT_CONFIG,
        functionName: 'claimTokens',
      })
    } catch (error) {
      console.error('Error claiming tokens:', error)
      throw new Error(FaucetError.CONTRACT_ERROR)
    }
  }

  // Determinar el estado general de la operación
  const isLoading = isWritePending || isConfirming
  const error = writeError || confirmError
  
  return {
    claimTokens,
    hash,
    isLoading,
    isWritePending,
    isConfirming,
    isConfirmed,
    error
  }
}
