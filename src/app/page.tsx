'use client'

import { useState } from 'react'
import { FaucetInterface } from "../components/FaucetInterface";
import { FaucetInterfaceApi } from "../components/FaucetInterfaceApi";
import { UserList } from "../components/UserList";
import { UserListApi } from "../components/UserListApi";

export default function Home() {
  const [useApi, setUseApi] = useState(true) // Por defecto usar API

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              FaucetToken DApp
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto mb-6">
              Recibe tokens gratuitos del faucet en la red de prueba Sepolia. 
              Conecta tu wallet y reclama 1,000,000 tokens (solo una vez por dirección).
            </p>
            
            {/* Selector de modo */}
            <div className="bg-white rounded-lg shadow-md p-4 max-w-md mx-auto mb-8">
              <h3 className="text-lg font-medium text-gray-800 mb-3">Modo de Operación</h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => setUseApi(true)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    useApi 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🔐 API + SIWE
                </button>
                <button
                  onClick={() => setUseApi(false)}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !useApi 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  ⛓️ Blockchain Directo
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                {useApi ? (
                  <p>Usa la API del backend con autenticación SIWE segura</p>
                ) : (
                  <p>Interactúa directamente con el smart contract</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Componente principal del faucet */}
            <div className="lg:col-span-2">
              {useApi ? (
                <FaucetInterfaceApi />
              ) : (
                <FaucetInterface />
              )}
            </div>

            {/* Lista de usuarios que han usado el faucet */}
            <div className="lg:col-span-1">
              {useApi ? (
                <UserListApi itemsPerPage={5} />
              ) : (
                <UserList itemsPerPage={5} />
              )}
            </div>
          </div>

          {/* Información adicional sobre el proyecto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h2 className="text-lg font-medium text-blue-800 mb-3">
              Información del Proyecto
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-700">
              <div>
                <h3 className="font-medium mb-2">Red de Prueba</h3>
                <ul className="space-y-1">
                  <li>• Red: Sepolia Testnet</li>
                  <li>• Chain ID: 11155111</li>
                  <li>• Contrato: {process.env.NEXT_PUBLIC_CONTRACT_ADDRESS}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-medium mb-2">Funcionalidades</h3>
                <ul className="space-y-1">
                  <li>• Conexión de wallet (MetaMask, etc.)</li>
                  <li>• {useApi ? 'Autenticación SIWE' : 'Interacción directa'}</li>
                  <li>• Reclamar tokens (una vez por dirección)</li>
                  <li>• Ver balance y estado</li>
                  <li>• Lista de usuarios del faucet</li>
                </ul>
              </div>
            </div>
            
            {useApi && (
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-1">Modo API + SIWE</h4>
                <p className="text-xs text-blue-700">
                  En este modo, el frontend se autentica con Sign-In with Ethereum (SIWE) 
                  y utiliza la API del backend para interactuar con el smart contract. 
                  Esto proporciona mayor seguridad y control.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


