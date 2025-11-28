import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount, useDisconnect } from 'wagmi'
import { useFaucetState } from '../hooks/useFaucetState'
import { FormatUtils } from '../types'
import { CONTRACT_CONFIG } from '../config/faucetContract'

export function FaucetInterface() {
  const { open } = useWeb3Modal()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()
  const {
    faucetState,
    loadingStates,
    claimTokens,
    refreshData,
    canClaim,
    isAnyLoading,
    transactionHash,
    isTransactionConfirmed,
    clearError
  } = useFaucetState()

  // Formatear datos para mostrar
  const formattedBalance = FormatUtils.formatBalance(faucetState.userBalance)
  const formattedFaucetAmount = FormatUtils.formatBalance(faucetState.faucetAmount)
  const formattedAddress = address ? FormatUtils.formatAddress(address) : null

  const handleConnect = () => {
    open()
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const handleClaim = async () => {
    clearError()
    await claimTokens()
  }

  if (!isConnected) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            FaucetToken DApp
          </h2>
          <p className="text-gray-600 mb-6">
            Conecta tu wallet para reclamar tokens gratuitos
          </p>
          <button
            onClick={handleConnect}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Conectar Wallet
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
      {/* Header con información de la wallet */}
      <div className="border-b pb-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">FaucetToken DApp</h2>
            <p className="text-sm text-gray-600 mt-1">
              Wallet: {formattedAddress?.display}
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
          {loadingStates.fetchingBalance ? (
            <div className="animate-pulse bg-gray-300 h-6 w-24 rounded"></div>
          ) : (
            <p className="text-xl font-bold text-green-600">
              {formattedBalance.displayValue}
            </p>
          )}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Estado del Faucet</h3>
          {loadingStates.checkingStatus ? (
            <div className="animate-pulse bg-gray-300 h-6 w-20 rounded"></div>
          ) : (
            <p className={`text-xl font-bold ${
              faucetState.hasClaimed ? 'text-red-600' : 'text-green-600'
            }`}>
              {faucetState.hasClaimed ? 'Ya reclamado' : 'Disponible'}
            </p>
          )}
        </div>
      </div>

      {/* Información del faucet */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-medium text-blue-800 mb-2">
          Información del Faucet
        </h3>
        <div className="space-y-2 text-sm text-blue-700">
          <p>
            <span className="font-medium">Tokens por reclamo:</span> {formattedFaucetAmount.displayValue}
          </p>
          <p>
            <span className="font-medium">Usuarios totales:</span> {faucetState.faucetUsers.length}
          </p>
          <p>
            <span className="font-medium">Contrato:</span> {CONTRACT_CONFIG.address}
          </p>
        </div>
      </div>

      {/* Botón de reclamo */}
      <div className="mb-6">
        {faucetState.hasClaimed ? (
          <div className="text-center">
            <p className="text-orange-600 font-medium mb-3">
              Ya has reclamado tus tokens. Solo se permite un reclamo por dirección.
            </p>
            <button
              onClick={refreshData}
              disabled={isAnyLoading}
              className="bg-gray-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {isAnyLoading ? 'Actualizando...' : 'Actualizar Datos'}
            </button>
          </div>
        ) : (
          <div className="text-center">
            <button
              onClick={handleClaim}
              disabled={!canClaim || loadingStates.claiming}
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingStates.claiming ? (
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
      {faucetState.error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-red-800 font-medium">Error</h4>
              <p className="text-red-700 mt-1">{faucetState.error}</p>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Información de transacción */}
      {transactionHash && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6">
          <h4 className="text-blue-800 font-medium mb-2">Transacción Enviada</h4>
          <p className="text-blue-700 text-sm mb-2">
            Hash: {FormatUtils.formatTxHash(transactionHash)}
          </p>
          {isTransactionConfirmed ? (
            <p className="text-green-600 font-medium">✅ Transacción confirmada</p>
          ) : (
            <p className="text-yellow-600 font-medium">⏳ Esperando confirmación...</p>
          )}
          <a
            href={`https://sepolia.etherscan.io/tx/${transactionHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 text-sm underline"
          >
            Ver en Etherscan
          </a>
        </div>
      )}

      {/* Acciones adicionales */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={refreshData}
          disabled={isAnyLoading}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
        >
          🔄 Actualizar
        </button>
      </div>
    </div>
  )
}

export default FaucetInterface

