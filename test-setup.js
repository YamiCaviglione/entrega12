#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 FaucetToken DApp - Test Suite');
console.log('================================\n');

let passed = 0;
let failed = 0;

function test(name, testFn) {
  try {
    console.log(`🔍 Probando: ${name}`);
    testFn();
    console.log(`✅ ${name} - PASÓ\n`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name} - FALLÓ`);
    console.log(`   Error: ${error.message}\n`);
    failed++;
  }
}

// Test 1: Verificar estructura de archivos
test('Estructura de archivos del proyecto', () => {
  const requiredFiles = [
    'package.json',
    'next.config.ts',
    'tsconfig.json',
    'src/app/page.tsx',
    'src/components/FaucetInterface.tsx',
    'src/components/FaucetInterfaceApi.tsx',
    'src/components/UserList.tsx',
    'src/components/UserListApi.tsx',
    'src/hooks/useSiweAuth.ts',
    'src/hooks/useApiFaucet.ts',
    'src/config/wagmi.ts',
    'backend/package.json',
    'backend/src/index.ts',
    'backend/src/routes/auth.ts',
    'backend/src/routes/faucet.ts',
    'DOCUMENTACION.md',
    'TESTING.md',
    '.env.local.example',
    'backend/.env.example'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Archivo faltante: ${file}`);
    }
  }
});

// Test 2: Verificar dependencias del frontend
test('Dependencias del frontend', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    '@web3modal/wagmi',
    'wagmi',
    'viem',
    'react',
    'next',
    'ethers'
  ];

  for (const dep of requiredDeps) {
    if (!packageJson.dependencies[dep]) {
      throw new Error(`Dependencia faltante: ${dep}`);
    }
  }
});

// Test 3: Verificar dependencias del backend
test('Dependencias del backend', () => {
  const backendPackageJson = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
  const requiredDeps = [
    'express',
    'cors',
    'helmet',
    'morgan',
    'jsonwebtoken',
    'siwe',
    'ethers',
    'dotenv'
  ];

  for (const dep of requiredDeps) {
    if (!backendPackageJson.dependencies[dep]) {
      throw new Error(`Dependencia del backend faltante: ${dep}`);
    }
  }
});

// Test 4: Verificar scripts en package.json
test('Scripts de npm', () => {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredScripts = [
    'dev',
    'build',
    'backend:dev',
    'dev:all',
    'install:all'
  ];

  for (const script of requiredScripts) {
    if (!packageJson.scripts[script]) {
      throw new Error(`Script faltante: ${script}`);
    }
  }
});

// Test 5: Verificar configuración de TypeScript
test('Configuración de TypeScript', () => {
  const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  if (!tsconfig.compilerOptions) {
    throw new Error('compilerOptions faltante en tsconfig.json');
  }
  
  if (!tsconfig.compilerOptions.strict) {
    throw new Error('Modo strict no está habilitado');
  }
});

// Test 6: Verificar archivos de ejemplo
test('Archivos de configuración de ejemplo', () => {
  const frontendExample = fs.readFileSync('.env.local.example', 'utf8');
  const backendExample = fs.readFileSync('backend/.env.example', 'utf8');
  
  if (!frontendExample.includes('NEXT_PUBLIC_PROJECT_ID')) {
    throw new Error('PROJECT_ID faltante en .env.local.example');
  }
  
  if (!backendExample.includes('PRIVATE_KEY')) {
    throw new Error('PRIVATE_KEY faltante en backend/.env.example');
  }
});

// Test 7: Verificar que los componentes tienen exports correctos
test('Exports de componentes', () => {
  const faucetInterface = fs.readFileSync('src/components/FaucetInterface.tsx', 'utf8');
  const faucetInterfaceApi = fs.readFileSync('src/components/FaucetInterfaceApi.tsx', 'utf8');
  
  if (!faucetInterface.includes('export default')) {
    throw new Error('FaucetInterface.tsx no tiene export default');
  }
  
  if (!faucetInterfaceApi.includes('export default')) {
    throw new Error('FaucetInterfaceApi.tsx no tiene export default');
  }
});

// Test 8: Verificar rutas del backend
test('Rutas del backend', () => {
  const authRoutes = fs.readFileSync('backend/src/routes/auth.ts', 'utf8');
  const faucetRoutes = fs.readFileSync('backend/src/routes/faucet.ts', 'utf8');
  
  if (!authRoutes.includes('/message') || !authRoutes.includes('/signin')) {
    throw new Error('Rutas de auth incompletas');
  }
  
  if (!faucetRoutes.includes('/claim') || !faucetRoutes.includes('/status')) {
    throw new Error('Rutas de faucet incompletas');
  }
});

// Resumen final
console.log('📊 RESUMEN DE PRUEBAS');
console.log('====================');
console.log(`✅ Pruebas pasadas: ${passed}`);
console.log(`❌ Pruebas fallidas: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 ¡TODAS LAS PRUEBAS PASARON!');
  console.log('✅ El proyecto está listo para usar');
  console.log('\n📖 Próximos pasos:');
  console.log('1. Copiar .env.local.example a .env.local y configurar');
  console.log('2. Copiar backend/.env.example a backend/.env y configurar');
  console.log('3. Ejecutar: npm run install:all');
  console.log('4. Ejecutar: npm run dev:all');
  console.log('5. Abrir: http://localhost:3000');
} else {
  console.log('\n❌ Algunas pruebas fallaron');
  console.log('🔧 Revisa los errores y arregla los problemas antes de continuar');
  process.exit(1);
}