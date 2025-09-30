# FaucetToken DApp - Testing Guide 🧪

## 🚀 Quick Start Testing

### 1. Instalación Rápida
```bash
# Clonar e instalar todo
git clone https://github.com/YamiCaviglione/entrega12.git
cd entrega12
npm run install:all
```

### 2. Configurar Variables Mínimas
```bash
# Frontend (.env.local)
NEXT_PUBLIC_PROJECT_ID=tu_project_id_walletconnect
NEXT_PUBLIC_CONTRACT_ADDRESS=0x3e2117c19a921507ead57494bbf29032f33c7412

# Backend (backend/.env)
PRIVATE_KEY=tu_clave_privada_wallet_desarrollo
JWT_SECRET=cualquier_string_aleatorio_largo
```

### 3. Ejecutar y Probar
```bash
# Opción 1: Solo Frontend (modo blockchain directo)
npm run dev
# Ve a: http://localhost:3000

# Opción 2: Frontend + Backend (modo API + SIWE)
npm run dev:all
# Ve a: http://localhost:3000
```

---

## 🎯 Plan de Pruebas Rápido (15 minutos)

### ✅ Fase 1: Verificación Básica (3 min)
1. **Frontend carga**: http://localhost:3000 ✅
2. **Backend responde**: http://localhost:8000/health ✅
3. **Sin errores en consola**: F12 → Console ✅

### ✅ Fase 2: Modo Blockchain Directo (5 min)
1. **Seleccionar "⛓️ Blockchain Directo"**
2. **Conectar wallet en Sepolia**
3. **Verificar datos del usuario**
4. **Reclamar tokens** (si no lo has hecho antes)
5. **Verificar lista de usuarios**

### ✅ Fase 3: Modo API + SIWE (5 min)
1. **Seleccionar "🔐 API + SIWE"**
2. **Conectar wallet**
3. **Autenticar con SIWE** (firmar mensaje)
4. **Reclamar tokens vía API**
5. **Verificar funcionamiento**

### ✅ Fase 4: Casos Edge (2 min)
1. **Intentar doble reclamo** → Debe fallar ❌
2. **Cambiar a red incorrecta** → Debe advertir ⚠️
3. **Desconectar backend** → Frontend debe detectarlo 🔧

---

## 🔧 Troubleshooting Express

### ❌ Problema: "Project ID is not defined"
```bash
# Solución: Agregar a .env.local
NEXT_PUBLIC_PROJECT_ID=tu_project_id_aqui
```

### ❌ Problema: "Backend No Disponible"
```bash
# Verificar backend corriendo
cd backend && npm run dev

# Verificar .env del backend
cat backend/.env  # En Windows: type backend\.env
```

### ❌ Problema: "Insufficient funds for intrinsic transaction cost"
```bash
# Necesitas ETH en Sepolia
# Ve a: https://cloud.google.com/application/web3/faucet/ethereum/sepolia
```

### ❌ Problema: CORS Error
```bash
# Agregar a backend/.env
CORS_ORIGIN=http://localhost:3000
```

---

## 📋 Checklist Final

### Frontend ✅
- [ ] Página carga sin errores
- [ ] Ambos modos funcionan
- [ ] Wallet conecta correctamente
- [ ] Estados de loading aparecen
- [ ] Links a Etherscan funcionan

### Backend (Solo para modo API) ✅
- [ ] `/health` responde OK
- [ ] Autenticación SIWE funciona
- [ ] Reclamo vía API funciona
- [ ] JWT se valida correctamente

### Funcionalidades ✅
- [ ] Reclamo de tokens exitoso
- [ ] No permite doble reclamo
- [ ] Lista de usuarios se actualiza
- [ ] Balances se muestran correctamente

---

## 🎉 Todo Listo!

Si pasaste todos los checkpoints, ¡tu DApp está funcionando perfectamente! 🚀

**Puntos importantes para recordar:**
- ⛽ Necesitas ETH en Sepolia para gas fees
- 🔄 El contrato permite 1 reclamo por dirección
- 🔐 Modo API requiere autenticación SIWE
- ⛓️ Modo directo interactúa directamente con blockchain

**¿Problemas?** Revisa la documentación completa en `DOCUMENTACION.md` 📖