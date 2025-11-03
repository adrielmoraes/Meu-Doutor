"""
Patient Data Access Functions
Provides async functions to fetch patient information from database.
"""

import os
import asyncpg
from typing import Dict, List, Optional
from datetime import datetime


async def get_db_connection():
    """Create database connection using DATABASE_URL from environment."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable not set')
    
    return await asyncpg.connect(database_url)


async def get_patient_info(patient_id: str) -> Dict:
    """
    Get patient basic information.
    
    Args:
        patient_id: The patient's unique identifier
        
    Returns:
        Dictionary with patient information
    """
    conn = await get_db_connection()
    try:
        patient = await conn.fetchrow(
            """
            SELECT id, name, age, gender, city, state, status, 
                   reported_symptoms, last_visit, created_at
            FROM patients
            WHERE id = $1
            """,
            patient_id
        )
        
        if not patient:
            return {"error": "Patient not found"}
        
        return {
            "id": patient['id'],
            "name": patient['name'],
            "age": patient['age'],
            "gender": patient['gender'],
            "location": f"{patient['city']}, {patient['state']}",
            "status": patient['status'],
            "reported_symptoms": patient['reported_symptoms'],
            "last_visit": patient['last_visit'].isoformat() if patient['last_visit'] else None
        }
    finally:
        await conn.close()


async def get_patient_exams(patient_id: str, limit: int = 10) -> List[Dict]:
    """
    Get patient exam history.
    
    Args:
        patient_id: The patient's unique identifier
        limit: Maximum number of exams to return (default: 10)
        
    Returns:
        List of exam dictionaries
    """
    conn = await get_db_connection()
    try:
        exams = await conn.fetch(
            """
            SELECT id, type, date, results, status, 
                   preliminary_diagnosis, ai_explanation,
                   doctor_notes, final_explanation
            FROM exams
            WHERE patient_id = $1
            ORDER BY date DESC
            LIMIT $2
            """,
            patient_id, limit
        )
        
        return [
            {
                "id": exam['id'],
                "type": exam['type'],
                "date": exam['date'].isoformat(),
                "results": exam['results'],
                "status": exam['status'],
                "diagnosis": exam['preliminary_diagnosis'],
                "explanation": exam['ai_explanation'] or exam['final_explanation']
            }
            for exam in exams
        ]
    finally:
        await conn.close()


async def get_consultation_history(patient_id: str, limit: int = 5) -> List[Dict]:
    """
    Get patient consultation history.
    
    Args:
        patient_id: The patient's unique identifier
        limit: Maximum number of consultations to return (default: 5)
        
    Returns:
        List of consultation dictionaries
    """
    conn = await get_db_connection()
    try:
        consultations = await conn.fetch(
            """
            SELECT id, type, date, transcription, summary, 
                   main_concerns, ai_recommendations
            FROM consultations
            WHERE patient_id = $1
            ORDER BY date DESC
            LIMIT $2
            """,
            patient_id, limit
        )
        
        return [
            {
                "id": consultation['id'],
                "type": consultation['type'],
                "date": consultation['date'].isoformat(),
                "summary": consultation['summary'],
                "concerns": consultation['main_concerns'],
                "recommendations": consultation['ai_recommendations']
            }
            for consultation in consultations
        ]
    finally:
        await conn.close()


async def get_patient_full_context(patient_id: str) -> str:
    """
    Get complete patient context as formatted text for LLM.
    
    Args:
        patient_id: The patient's unique identifier
        
    Returns:
        Formatted string with complete patient context
    """
    # Get all data in parallel
    patient_info, exams, consultations = await asyncio.gather(
        get_patient_info(patient_id),
        get_patient_exams(patient_id),
        get_consultation_history(patient_id)
    )
    
    # Format as readable text
    context = f"""INFORMAÇÕES DO PACIENTE:
Nome: {patient_info.get('name', 'N/A')}
Idade: {patient_info.get('age', 'N/A')} anos
Gênero: {patient_info.get('gender', 'N/A')}
Localização: {patient_info.get('location', 'N/A')}
Status: {patient_info.get('status', 'N/A')}
Sintomas Relatados: {patient_info.get('reported_symptoms', 'Nenhum')}
Última Visita: {patient_info.get('last_visit', 'Primeira consulta')}

"""
    
    if exams:
        context += "HISTÓRICO DE EXAMES:\n"
        for i, exam in enumerate(exams[:5], 1):
            context += f"{i}. {exam['type']} ({exam['date']}):\n"
            context += f"   Status: {exam['status']}\n"
            if exam['diagnosis']:
                context += f"   Diagnóstico: {exam['diagnosis']}\n"
            if exam['explanation']:
                context += f"   Explicação: {exam['explanation'][:200]}...\n"
        context += "\n"
    
    if consultations:
        context += "HISTÓRICO DE CONSULTAS:\n"
        for i, consult in enumerate(consultations[:3], 1):
            context += f"{i}. {consult['type']} ({consult['date']}):\n"
            if consult['summary']:
                context += f"   Resumo: {consult['summary'][:150]}...\n"
        context += "\n"
    
    return context
