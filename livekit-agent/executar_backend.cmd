@echo off
setlocal
cd /d "%~dp0"
title MediAI Backend Agent

echo ==========================================
echo MediAI LiveKit Agent Launcher
echo ==========================================
echo(

echo [1/5] Verificando instalacao do Python
python --version
if %errorlevel% neq 0 (
    echo(
    echo [ERRO] Python nao encontrado ou nao esta no PATH
    echo Instale Python 3.10+ e selecione Add Python to PATH
    echo(
    pause
    exit /b 1
)

echo(
echo [2/5] Verificando ambiente virtual
if not exist venv (
    echo [INFO] Criando ambiente virtual venv
    python -m venv venv
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao criar ambiente virtual
        pause
        exit /b 1
    )
)
if exist venv (
    echo [INFO] Ambiente virtual encontrado
)

echo(
echo [3/5] Verificando configuracao .env
if not exist .env (
    echo(
    echo [AVISO] Arquivo .env nao encontrado
    echo O agente precisa das chaves de API para funcionar
    echo Crie o arquivo .env na pasta:
    echo %~dp0
    echo(
    echo Variaveis tipicas:
    echo LIVEKIT_URL=...
    echo LIVEKIT_API_KEY=...
    echo LIVEKIT_API_SECRET=...
    echo GEMINI_API_KEY=...
    echo(
    echo Pressione qualquer tecla para continuar mesmo assim
    pause
)
if exist .env (
    echo [INFO] Arquivo .env encontrado
)

echo(
echo [4/5] Ativando ambiente e instalando dependencias
call venv\Scripts\activate
if %errorlevel% neq 0 (
    echo [ERRO] Falha ao ativar ambiente virtual
    pause
    exit /b 1
)

echo [INFO] Instalando bibliotecas, pode demorar na primeira vez
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERRO] Falha na instalacao das dependencias via pip
    pause
    exit /b 1
)

echo(
echo [5/5] Iniciando agente MediAI
echo Pressione Ctrl+C para parar o servidor
echo(
python agent.py start

if %errorlevel% neq 0 (
    echo(
    echo [ERRO] O agente parou com erro, codigo %errorlevel%
    echo Verifique as mensagens acima para identificar o problema
)
if %errorlevel% equ 0 (
    echo(
    echo [INFO] O agente foi encerrado normalmente
)

echo(
pause
endlocal
