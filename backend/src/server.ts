import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { config, validateConfig } from './config'
import { errorHandler, notFoundHandler, validateContentType } from './middleware/errorHandler'
import { contractService } from './utils/contractService'
import authRoutes from './routes/auth'
import faucetRoutes from './routes/faucet'

// Validar configuración antes de iniciar
validateConfig()

const app = express()

// Configuración de middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}))

// Configuración de CORS
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}))

// Middleware de parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging de requests
app.use(morgan('combined'))

// Validación de Content-Type
app.use(validateContentType)

// Rutas de health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    },
    message: 'Servidor funcionando correctamente'
  })
})

// Endpoint de información del servidor
app.get('/info', async (req, res) => {
  try {
    const serverInfo = await contractService.getServerWalletInfo()
    
    res.json({
      success: true,
      data: {
        server: 'FaucetToken Backend',
        version: '1.0.0',
        chainId: config.chainId,
        contractAddress: config.contractAddress,
        serverWallet: serverInfo.address,
        serverBalance: serverInfo.balance,
        environment: process.env.NODE_ENV || 'development'
      },
      message: 'Información del servidor'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error obteniendo información del servidor'
    })
  }
})

// Rutas de la API
app.use('/auth', authRoutes)
app.use('/faucet', faucetRoutes)

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'FaucetToken Backend API',
      version: '1.0.0',
      endpoints: {
        auth: '/auth',
        faucet: '/faucet',
        health: '/health',
        info: '/info'
      }
    },
    message: 'Bienvenido a la API del FaucetToken'
  })
})

// Middleware de manejo de errores (debe ir al final)
app.use(notFoundHandler)
app.use(errorHandler)

// Función para iniciar el servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor FaucetToken Backend...')
    
    // Verificar conexión al contrato
    const contractConnected = await contractService.testConnection()
    if (!contractConnected) {
      console.error('❌ No se pudo conectar al contrato. Verifica la configuración.')
      process.exit(1)
    }

    // Obtener información del wallet del servidor
    const serverInfo = await contractService.getServerWalletInfo()
    console.log(`💼 Wallet del servidor: ${serverInfo.address}`)
    console.log(`💰 Balance del servidor: ${serverInfo.balance} ETH`)

    // Iniciar servidor
    const server = app.listen(config.port, () => {
      console.log(`\n✅ Servidor iniciado exitosamente!`)
      console.log(`🌐 URL: http://localhost:${config.port}`)
      console.log(`🔗 Contrato: ${config.contractAddress}`)
      console.log(`⛓️  Chain ID: ${config.chainId}`)
      console.log(`🔐 CORS Origin: ${config.corsOrigin}`)
      console.log('\n📚 Endpoints disponibles:')
      console.log('   GET  /              - Información de la API')
      console.log('   GET  /health        - Health check')
      console.log('   GET  /info          - Información del servidor')
      console.log('   POST /auth/message  - Generar mensaje SIWE')
      console.log('   POST /auth/signin   - Autenticación SIWE')
      console.log('   GET  /auth/verify   - Verificar token JWT')
      console.log('   POST /faucet/claim  - Reclamar tokens (protegido)')
      console.log('   GET  /faucet/status/:address - Estado del faucet (protegido)')
      console.log('   GET  /faucet/info   - Información general del faucet')
      console.log('   GET  /faucet/users  - Lista de usuarios del faucet')
      console.log('\n🎯 Backend listo para recibir requests!')
    })

    // Manejo de cierre graceful
    process.on('SIGTERM', () => {
      console.log('📡 Recibida señal SIGTERM. Cerrando servidor...')
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente')
        process.exit(0)
      })
    })

    process.on('SIGINT', () => {
      console.log('\n📡 Recibida señal SIGINT. Cerrando servidor...')
      server.close(() => {
        console.log('✅ Servidor cerrado correctamente')
        process.exit(0)
      })
    })

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error)
    process.exit(1)
  }
}

// Solo iniciar el servidor si este archivo es ejecutado directamente
if (require.main === module) {
  startServer()
}

export { app, startServer }