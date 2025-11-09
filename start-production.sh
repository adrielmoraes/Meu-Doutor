#!/bin/bash

# Script de inicialização APENAS para Next.js
# O LiveKit Agent deve rodar em um workflow separado

echo "🚀 Iniciando MediAI Platform (Frontend) em Produção..."
echo "================================================"
echo "📦 Iniciando servidor Next.js na porta 5000..."
echo "================================================"

# Iniciar Next.js com binding correto
exec npm run start -- -p 5000 -H 0.0.0.0