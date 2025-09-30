# 📖 FaucetToken DApp - Documentación Completa

## 🎯 Descripción del Proyecto

Este proyecto implementa una aplicación Web3 completa que permite a los usuarios reclamar tokens gratuitos de un faucet en la red de prueba Sepolia. El proyecto incluye:

- **Frontend React/Next.js** con conexión Web3
- **Backend Express/Node.js** con autenticación SIWE (Sign-In with Ethereum)
- **Dos modos de operación**: Blockchain directo y API + SIWE
- **Smart Contract**: FaucetToken desplegado en Sepolia

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│  Modo 1: Blockchain Directo    │  Modo 2: API + SIWE       │
│  ├── Wagmi/Viem               │  ├── SIWE Authentication    │
│  ├── Web3Modal                │  ├── JWT Tokens             │
│  └── Smart Contract ──────────┼──┤  └── API Calls            │
│                               │  │                          │
└───────────────────────────────┼──┼──────────────────────────┘
                                │  │
                                │  ▼
                        ┌───────────────────────┐
                        │   BACKEND (Express)   │
                        ├───────────────────────┤
                        │ ├── SIWE Auth         │
                        │ ├── JWT Middleware    │
                        │ ├── Rate Limiting     │
                        │ ├── Error Handling    │
                        │ └── Contract Service  │
                        └───────────────────────┘
                                │
                                ▼
                        ┌───────────────────────┐
                        │  SEPOLIA BLOCKCHAIN   │
                        ├───────────────────────┤
                        │   FaucetToken         │
                        │   0x3e2117c19a921...  │
                        └───────────────────────┘
```

---

## 📋 Requisitos Previos

### 🛠️ Software Necesario
- **Node.js** v18+ y npm
- **Git** para clonar el repositorio
- **MetaMask** u otra wallet compatible
- **ETH en Sepolia** para gas fees (obtén desde el faucet oficial)

### 🌐 Servicios Externos
1. **WalletConnect Project ID**:
   - Ve a [WalletConnect Cloud](https://cloud.walletconnect.com)
   - Crea una cuenta y proyecto
   - Obtén tu PROJECT_ID

2. **Wallet con ETH en Sepolia**:
   - Faucet oficial: [Google Cloud Faucet](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
   - Configura Sepolia en tu wallet (Chain ID: 11155111)

---

## 🚀 Instalación y Configuración

### 1. 📥 Clonar el Repositorio
```bash
git clone https://github.com/YamiCaviglione/entrega12.git
cd entrega12
```

### 2. 📦 Instalar Dependencias
```bash
# Instalar dependencias del frontend y backend
npm run install:all

# O si prefieres hacerlo manualmente:
npm install
cd backend && npm install && cd ..
```

### 3. ⚙️ Configurar Variables de Entorno

#### 🎨 Frontend (.env.local)
```bash
# Crea el archivo .env.local en la raíz del proyecto
cp .env.local.example .env.local
```

Edita `.env.local`:
```env
# WalletConnect Project ID (REQUERIDO)
NEXT_PUBLIC_PROJECT_ID=tu_project_id_aqui

# Dirección del contrato FaucetToken en Sepolia
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3e2117c19a921507ead57494bbf29032f33c7412

# RPC URL para Sepolia
NEXT_PUBLIC_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# URL del backend (para modo API)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 🔧 Backend (backend/.env)
```bash
# Crea el archivo .env en la carpeta backend
cd backend
cp .env.example .env
```

Edita `backend/.env`:
```env
# Puerto del servidor
PORT=8000

# Clave privada para interactuar con el smart contract (REQUERIDO)
# ⚠️ IMPORTANTE: Usa una wallet de desarrollo, NUNCA tu wallet principal
PRIVATE_KEY=tu_clave_privada_aqui

# Secret para JWT (REQUERIDO) - Genera uno aleatorio
JWT_SECRET=tu_jwt_secret_super_secreto_aqui

# RPC URL para Sepolia
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Dirección del contrato FaucetToken
CONTRACT_ADDRESS=0x3e2117c19a921507ead57494bbf29032f33c7412

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000

# Chain ID de Sepolia
CHAIN_ID=11155111

# Configuración de JWT
JWT_EXPIRES_IN=24h
```

### 4. 🔐 Generar Secrets Seguros

#### JWT Secret:
```bash
# En Windows (PowerShell)
[System.Web.Security.Membership]::GeneratePassword(32, 0)

# En Linux/Mac
openssl rand -hex 32

# O usa cualquier generador online de strings aleatorios
```

#### Clave Privada:
```bash
# Exporta la clave privada de una wallet de desarrollo desde MetaMask
# ⚠️ NUNCA uses tu wallet principal para desarrollo
```

---

## 🎮 Modos de Ejecución

### 🚀 Modo 1: Solo Frontend (Blockchain Directo)
```bash
# Ejecutar solo el frontend
npm run dev

# Acceder en: http://localhost:3000
```

### 🔐 Modo 2: Frontend + Backend (API + SIWE)
```bash
# Ejecutar frontend y backend simultáneamente
npm run dev:all

# O ejecutar por separado:
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run backend:dev
```

---

## 🧪 Guía de Pruebas Completa

### 🔍 1. Verificación Inicial

#### Verificar que el Frontend está funcionando:
1. Ve a http://localhost:3000
2. Deberías ver la página principal con el selector de modo
3. Verifica que no hay errores en la consola del navegador

#### Verificar que el Backend está funcionando (si usas modo API):
1. Ve a http://localhost:8000
2. Deberías ver la respuesta JSON de bienvenida
3. Ve a http://localhost:8000/health - debe mostrar status "OK"
4. Ve a http://localhost:8000/info - debe mostrar información del servidor

### 🎯 2. Pruebas del Modo Blockchain Directo

#### 2.1 Conectar Wallet
1. Selecciona "⛓️ Blockchain Directo" en la página principal
2. Haz clic en "Conectar Wallet"
3. Conecta tu wallet (asegúrate de estar en Sepolia)
4. Verifica que aparece tu dirección en pantalla

#### 2.2 Verificar Estado del Faucet
1. Una vez conectado, observa la información mostrada:
   - Tu balance actual de FaucetTokens
   - Estado del faucet (Disponible/Ya reclamado)
   - Información del contrato

#### 2.3 Reclamar Tokens (Primera vez)
1. Si no has reclamado antes, verás el botón "Reclamar 1,000,000.00 FTK"
2. Haz clic en el botón
3. Confirma la transacción en tu wallet
4. Espera la confirmación (puede tomar 1-2 minutos)
5. Verifica que:
   - Aparece el hash de transacción
   - Tu balance se actualiza
   - El estado cambia a "Ya reclamado"

#### 2.4 Verificar Lista de Usuarios
1. En el panel derecho, verifica que aparece la lista de usuarios
2. Tu dirección debería aparecer después del reclamo exitoso

### 🔐 3. Pruebas del Modo API + SIWE

#### 3.1 Verificar Backend
1. Selecciona "🔐 API + SIWE" en la página principal
2. Verifica que aparece "✅ Backend conectado"
3. Si aparece "🔧 Backend No Disponible", verifica que el backend esté corriendo

#### 3.2 Conectar Wallet
1. Haz clic en "Conectar Wallet"
2. Conecta tu wallet en Sepolia
3. Deberías ver "Autenticación Requerida"

#### 3.3 Autenticación SIWE
1. Haz clic en "🔐 Autenticar con SIWE"
2. En tu wallet, verás un mensaje para firmar (NO es una transacción)
3. Firma el mensaje
4. Verifica que aparece "✅ Autenticado" en la interfaz

#### 3.4 Reclamar Tokens vía API
1. Una vez autenticado, verás tu balance y estado
2. Si no has reclamado antes, haz clic en "Reclamar"
3. La transacción se ejecuta desde el backend
4. Verifica que recibes el hash de transacción

### 🔍 4. Pruebas de Error y Edge Cases

#### 4.1 Red Incorrecta
1. Cambia tu wallet a otra red (ej: Mainnet)
2. Intenta conectar - debería mostrar error de red

#### 4.2 Doble Reclamo
1. Intenta reclamar tokens dos veces con la misma dirección
2. Debería mostrar "Ya has reclamado tokens anteriormente"

#### 4.3 Sin Autenticación (Modo API)
1. En modo API, intenta acceder sin autenticar
2. Debería requerir autenticación SIWE

#### 4.4 Backend Offline (Modo API)
1. Detén el backend (Ctrl+C en la terminal)
2. Refresca el frontend en modo API
3. Debería mostrar "Backend No Disponible"

### 📱 5. Pruebas de UI/UX

#### 5.1 Responsive Design
1. Prueba en diferentes tamaños de pantalla
2. Verifica que la interfaz se adapta correctamente

#### 5.2 Estados de Loading
1. Observa los indicadores de carga durante:
   - Conexión de wallet
   - Reclamo de tokens
   - Autenticación SIWE
   - Carga de datos

#### 5.3 Paginación de Usuarios
1. Verifica que la lista de usuarios tiene paginación
2. Prueba navegar entre páginas

---

## 🛠️ Resolución de Problemas

### ❌ Problemas Comunes

#### "Project ID is not defined"
```bash
# Solución: Configurar NEXT_PUBLIC_PROJECT_ID en .env.local
NEXT_PUBLIC_PROJECT_ID=tu_project_id_de_walletconnect
```

#### "Backend No Disponible"
```bash
# Verificar que el backend esté corriendo
cd backend
npm run dev

# Verificar variables de entorno en backend/.env
# Especialmente PRIVATE_KEY y JWT_SECRET
```

#### "Error al reclamar tokens"
```bash
# Verificar que tienes ETH en Sepolia para gas
# Verificar que la clave privada del backend tiene ETH
# Verificar que el contrato funciona en Etherscan
```

#### Errors de CORS
```bash
# Verificar CORS_ORIGIN en backend/.env
CORS_ORIGIN=http://localhost:3000
```

### 🔧 Comandos de Debugging

#### Ver logs del backend:
```bash
cd backend
npm run dev
# Los logs aparecerán en la consola
```

#### Verificar configuración:
```bash
# Frontend
npm run dev
# Abrir DevTools del navegador y verificar console

# Backend
curl http://localhost:8000/health
curl http://localhost:8000/info
```

#### Verificar conectividad del contrato:
```bash
# Ve a Etherscan Sepolia:
# https://sepolia.etherscan.io/address/0x3e2117c19a921507ead57494bbf29032f33c7412
```

---

## 📊 Endpoints de la API

### 🔓 Públicos (No requieren autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/` | Información de la API |
| GET | `/health` | Health check |
| GET | `/info` | Información del servidor |
| POST | `/auth/message` | Generar mensaje SIWE |
| POST | `/auth/signin` | Autenticación SIWE |
| GET | `/faucet/info` | Información del faucet |
| GET | `/faucet/users` | Lista de usuarios |

### 🔐 Protegidos (Requieren JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/faucet/claim` | Reclamar tokens |
| GET | `/faucet/status/:address` | Estado del faucet |
| GET | `/auth/verify` | Verificar token |

### 📝 Ejemplos de Uso

#### Generar mensaje SIWE:
```bash
curl -X POST http://localhost:8000/auth/message \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b8D5c6Ba4C7B4c1d8a"}'
```

#### Reclamar tokens:
```bash
curl -X POST http://localhost:8000/faucet/claim \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TU_JWT_TOKEN_AQUI"
```

---

## 🎯 Checklist de Pruebas

### ✅ Frontend
- [ ] Página carga sin errores
- [ ] Selector de modo funciona
- [ ] Web3Modal se abre correctamente
- [ ] Conexión de wallet exitosa
- [ ] Información del usuario se muestra
- [ ] Estados de loading aparecen
- [ ] Manejo de errores funciona

### ✅ Modo Blockchain Directo
- [ ] Conexión directa al contrato
- [ ] Reclamo de tokens funciona
- [ ] Balance se actualiza
- [ ] Lista de usuarios se carga
- [ ] Paginación funciona

### ✅ Modo API + SIWE
- [ ] Backend responde en /health
- [ ] Autenticación SIWE funciona
- [ ] JWT se genera correctamente
- [ ] Reclamo vía API funciona
- [ ] Endpoints protegidos requieren auth

### ✅ Funcionalidades Generales
- [ ] No se puede reclamar dos veces
- [ ] Detección de red incorrecta
- [ ] Responsive design
- [ ] Links a Etherscan funcionan
- [ ] Manejo de errores robusto

---

## 📖 Recursos Adicionales

### 🔗 Enlaces Útiles
- **Contrato en Sepolia**: https://sepolia.etherscan.io/address/0x3e2117c19a921507ead57494bbf29032f33c7412
- **Faucet ETH Sepolia**: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
- **WalletConnect**: https://cloud.walletconnect.com
- **Wagmi Docs**: https://wagmi.sh
- **SIWE Docs**: https://docs.login.xyz

### 🏷️ Información del Contrato
- **Dirección**: `0x3e2117c19a921507ead57494bbf29032f33c7412`
- **Red**: Sepolia Testnet (Chain ID: 11155111)
- **Función principal**: `claimTokens()` - Permite reclamar 1,000,000 tokens
- **Tokens por reclamo**: 1,000,000 FTK (con 18 decimales)

### 🎓 Tecnologías Utilizadas
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Web3**: Wagmi v2, Viem, Web3Modal v3
- **Backend**: Express.js, TypeScript, SIWE, JWT
- **Blockchain**: Ethereum Sepolia, Ethers.js

---

## 🎉 ¡Listo para Probar!

Con esta documentación deberías poder:
1. ✅ Configurar completamente el proyecto
2. ✅ Ejecutar ambos modos de operación
3. ✅ Probar todas las funcionalidades
4. ✅ Resolver problemas comunes
5. ✅ Entender la arquitectura completa

**¡Disfruta probando tu DApp de FaucetToken!** 🚀