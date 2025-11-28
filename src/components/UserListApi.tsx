import { useState, useEffect } from 'react'
import { useApiFaucet } from '../hooks/useApiFaucet'
import { FormatUtils } from '../types'

interface UserListApiProps {
  itemsPerPage?: number
}

export function UserListApi({ itemsPerPage = 10 }: UserListApiProps) {
  const { users, isLoading, error, refreshUsers } = useApiFaucet()
  const [currentPage, setCurrentPage] = useState(1)

  // Cargar usuarios cuando cambia la página
  useEffect(() => {
    refreshUsers(currentPage, itemsPerPage)
  }, [currentPage, itemsPerPage, refreshUsers])

  const handlePreviousPage = () => {
    if (users.pagination && currentPage > 1) {
      setCurrentPage(prev => prev - 1)
    }
  }

  const handleNextPage = () => {
    if (users.pagination && currentPage < users.pagination.totalPages) {
      setCurrentPage(prev => prev + 1)
    }
  }

  const handlePageClick = (page: number) => {
    setCurrentPage(page)
  }

  const handleRefresh = () => {
    setCurrentPage(1)
    refreshUsers(1, itemsPerPage)
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Lista de Usuarios del Faucet (API)
          </h3>
          <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
            <p className="text-red-700 mb-4">Error al cargar la lista de usuarios</p>
            <p className="text-red-600 text-sm mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-800">
          Lista de Usuarios del Faucet (API)
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isLoading.users}
          className="text-blue-600 hover:text-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading.users ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cargando...
            </span>
          ) : (
            '🔄 Actualizar'
          )}
        </button>
      </div>

      {/* Estadísticas */}
      {users.pagination && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">{users.pagination.totalUsers}</p>
              <p className="text-sm text-gray-600">Total Usuarios</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{users.pagination.totalPages}</p>
              <p className="text-sm text-gray-600">Páginas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{users.pagination.currentPage}</p>
              <p className="text-sm text-gray-600">Página Actual</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de usuarios */}
      {isLoading.users ? (
        <div className="space-y-3">
          {Array.from({ length: itemsPerPage }).map((_, index) => (
            <div key={index} className="animate-pulse bg-gray-100 h-12 rounded-lg"></div>
          ))}
        </div>
      ) : users.list.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Aún no hay usuarios que hayan interactuado con el faucet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.list.map((address, index) => {
            const formattedAddress = FormatUtils.formatAddress(address)
            const globalIndex = users.pagination 
              ? (users.pagination.currentPage - 1) * users.pagination.usersPerPage + index + 1
              : index + 1
            
            return (
              <div
                key={address}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                    {globalIndex}
                  </span>
                  <div>
                    <p className="font-mono text-sm text-gray-800">
                      {formattedAddress.display}
                    </p>
                    <p className="text-xs text-gray-500">
                      Usuario #{globalIndex}
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigator.clipboard.writeText(address)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Copiar dirección"
                  >
                    📋
                  </button>
                  <a
                    href={`https://sepolia.etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    title="Ver en Etherscan"
                  >
                    🔗
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Paginación */}
      {users.pagination && users.pagination.totalPages > 1 && !isLoading.users && (
        <div className="mt-6 flex justify-center items-center space-x-2">
          <button
            onClick={handlePreviousPage}
            disabled={users.pagination.currentPage === 1}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Anterior
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(users.pagination.totalPages, 5) }, (_, index) => {
              let pageNumber
              if (users.pagination!.totalPages <= 5) {
                pageNumber = index + 1
              } else if (users.pagination!.currentPage <= 3) {
                pageNumber = index + 1
              } else if (users.pagination!.currentPage >= users.pagination!.totalPages - 2) {
                pageNumber = users.pagination!.totalPages - 4 + index
              } else {
                pageNumber = users.pagination!.currentPage - 2 + index
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageClick(pageNumber)}
                  className={`px-3 py-2 text-sm rounded-lg transition-colors ${ 
                    pageNumber === users.pagination!.currentPage
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>

          <button
            onClick={handleNextPage}
            disabled={users.pagination.currentPage === users.pagination.totalPages}
            className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Información adicional */}
      {users.pagination && users.pagination.totalUsers > 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Mostrando {users.list.length} de {users.pagination.totalUsers} usuarios
          {users.pagination.totalPages > 1 && (
            <span> - Página {users.pagination.currentPage} de {users.pagination.totalPages}</span>
          )}
        </div>
      )}
    </div>
  )
}

