import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useSiweAuth } from '../hooks/useSiweAuth'
import { useApiFaucet, useBackendHealth } from '../hooks/useApiFaucet'
import { FormatUtils } from '../types'

export function FaucetInterfaceApi() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const { isOnline: backendOnline, checkHealth } = useBackendHealth()
  
  // Autenticación SIWE
  const {
    isAuthenticated: isSiweAuthenticated,
    isLoading: siweLoading,
    error: siweError,
    signIn: siweSignIn,
    signOut: siweSignOut,
    clearError: clearSiweError
  } = useSiweAuth()

  // Estado del faucet vía API
  const {
    faucetInfo,
    userStatus,
    lastClaimResult,
    isLoading,
    error: faucetError,
    claimTokens,
    clearError: clearFaucetError,
    refreshAll
  } = useApiFaucet()

  // Formatear datos para mostrar
  const formattedBalance = userStatus?.balance 
    ? FormatUtils.formatBalance(BigInt(Math.floor(parseFloat(userStatus.balance) * 1e18)))
    : { displayValue: '0.00 FTK' }
    
  const formattedFaucetAmount = faucetInfo?.faucetAmount
    ? FormatUtils.formatBalance(BigInt(Math.floor(parseFloat(faucetInfo.faucetAmount) * 1e18)))
    : { displayValue: '0 FTK' }
    
  const formattedAddress = address ? FormatUtils.formatAddress(address) : null

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    siweSignOut()
    disconnect()
  }

  const handleSiweAuth = async () => {
    clearSiweError()
    await siweSignIn()
  }

  const handleClaim = async () => {
    clearFaucetError()
    await claimTokens()
  }

  // Estado del backend
  if (backendOnline === false) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            🔧 Backend No Disponible
          </h2>
          <p className="text-gray-600 mb-6">
            El servidor del faucet no está disponible en este momento.
          </p>
          <button
            onClick={checkHealth}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            🔄 Verificar Conexión
          </button>
        </div>
      </div>
    )
  }

  // Estado no conectado
  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            FaucetToken DApp (API Mode)
          </h2>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet y autentica con SIWE para reclamar tokens gratuitos
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Conectar Wallet
          </button>
          {backendOnline && (
            <p className="text-green-600 text-sm mt-3">✅ Backend conectado</p>
          )}
        </div>
      </div>
    )
  }

  // Estado conectado pero no autenticado con SIWE
  if (!isSiweAuthenticated) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Autenticación Requerida
          </h2>
          <p className="text-gray-600 mb-4">
            Wallet conectada: {formattedAddress?.display}
          </p>
          <p className="text-gray-600 mb-6">
            Debes autenticarte con Sign-In with Ethereum (SIWE) para acceder al faucet.
          </p>
          
          {siweError && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-4">
              <p className="text-red-700 text-sm">{siweError}</p>
              <button
                onClick={clearSiweError}
                className="text-red-600 hover:text-red-800 text-xs mt-2"
              >
                ✕ Cerrar
              </button>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleSiweAuth}
              disabled={siweLoading}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 w-full"
            >
              {siweLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Autenticando...
                </span>
              ) : (
                '🔐 Autenticar con SIWE'
              )}
            </button>
            
            <button
              onClick={handleDisconnect}
              className="text-gray-600 hover:text-gray-700 text-sm font-medium w-full"
            >
              Desconectar Wallet
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Estado autenticado y funcionando
  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* Header con información de la wallet */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">FaucetToken DApp (API)</h2>
            <p className="text-sm text-gray-600 mt-1">
              Wallet: {formattedAddress?.display}
              <span className="ml-2 text-green-600">✅ Autenticado</span>
            </p>
          </div>
          <button
            onClick={handleDisconnect}
            className="text-red-600 hover:text-red-700 text-sm font-medium"
          >
            Desconectar
          </button>
        </div>
      </div>

      {/* Información del usuario */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tu Balance</h3>
          {isLoading.status ? (
            <div className="animate-pulse bg-gray-300 h-6 w-24 rounded"></div>
          ) : (
            <p className="text-xl font-bold text-green-600">
              {formattedBalance.displayValue}
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Estado del Faucet</h3>
          {isLoading.status ? (
            <div className="animate-pulse bg-gray-300 h-6 w-20 rounded"></div>
          ) : (
            <p className={`text-xl font-bold ${
              userStatus?.hasClaimed ? 'text-red-600' : 'text-green-600'
            }`}>
              {userStatus?.hasClaimed ? 'Ya reclamado' : 'Disponible'}
            </p>
          )}
        </div>
      </div>

      {/* Información del faucet */}
      {faucetInfo && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium text-blue-800 mb-2">
            Información del Faucet
          </h3>
          <div className="space-y-2 text-sm text-blue-700">
            <p>
              <span className="font-medium">Tokens por reclamo:</span> {formattedFaucetAmount.displayValue}
            </p>
            <p>
              <span className="font-medium">Usuarios totales:</span> {faucetInfo.totalUsers}
            </p>
            <p>
              <span className="font-medium">Contrato:</span> {faucetInfo.contractAddress}
            </p>
          </div>
        </div>
      )}

      {/* Botón de reclamo */}
      <div className="mb-6">
        {userStatus?.hasClaimed ? (
          <div className="text-center">
            <p className="text-orange-600 font-medium mb-3">
              Ya has reclamado tus tokens. Solo se permite un reclamo por dirección.
            </p>
            <button
              onClick={refreshAll}
              disabled={Object.values(isLoading).some(Boolean)}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {Object.values(isLoading).some(Boolean) ? 'Actualizando...' : 'Actualizar Datos'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleClaim}
              disabled={isLoading.claiming}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading.claiming ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Reclamando...
                </span>
              ) : (
                `Reclamar ${formattedFaucetAmount.displayValue}`
              )}
            </button>
          </div>
        )}
      </div>

      {/* Manejo de errores */}
      {(faucetError || siweError) && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-700 mt-1">{faucetError || siweError}</p>
            </div>
            <button
              onClick={() => {
                clearFaucetError()
                clearSiweError()
              }}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Resultado del último reclamo */}
      {lastClaimResult && (
        <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-6">
          <h4 className="text-green-800 font-medium mb-2">🎉 Tokens Reclamados Exitosamente</h4>
          <p className="text-green-700 text-sm mb-2">
            Hash: {FormatUtils.formatTxHash(lastClaimResult.txHash)}
          </p>
          <a
            href={`https://sepolia.etherscan.io/tx/${lastClaimResult.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:text-green-800 text-sm underline"
          >
            Ver en Etherscan
          </a>
        </div>
      )}

      {/* Acciones adicionales */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={refreshAll}
          disabled={Object.values(isLoading).some(Boolean)}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
        >
          🔄 Actualizar
        </button>
      </div>
    </div>
  )
}

export default FaucetInterfaceApi

