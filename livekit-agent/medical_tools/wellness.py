"""
Wellness Plan Functions
Provides functions to access and manage patient wellness plans.
"""

import os
import asyncpg
from typing import Dict, Optional


async def get_db_connection():
    """Create database connection using DATABASE_URL from environment."""
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError('DATABASE_URL environment variable not set')
    
    return await asyncpg.connect(database_url)


async def get_wellness_plan(patient_id: str) -> Optional[Dict]:
    """
    Get patient's wellness plan.
    
    Args:
        patient_id: The patient's unique identifier
        
    Returns:
        Dictionary with wellness plan or None
    """
    conn = await get_db_connection()
    try:
        patient = await conn.fetchrow(
            """
            SELECT wellness_plan
            FROM patients
            WHERE id = $1
            """,
            patient_id
        )
        
        if not patient or not patient['wellness_plan']:
            return None
        
        return patient['wellness_plan']
    finally:
        await conn.close()


async def update_wellness_plan(patient_id: str, wellness_plan: Dict) -> bool:
    """
    Update patient's wellness plan.
    
    Args:
        patient_id: The patient's unique identifier
        wellness_plan: New wellness plan data
        
    Returns:
        True if successful, False otherwise
    """
    conn = await get_db_connection()
    try:
        import json
        
        await conn.execute(
            """
            UPDATE patients
            SET wellness_plan = $1,
                updated_at = NOW()
            WHERE id = $2
            """,
            json.dumps(wellness_plan),
            patient_id
        )
        
        return True
    except Exception as e:
        print(f"Error updating wellness plan: {e}")
        return False
    finally:
        await conn.close()


async def get_wellness_summary(patient_id: str) -> str:
    """
    Get wellness plan as formatted text for LLM.
    
    Args:
        patient_id: The patient's unique identifier
        
    Returns:
        Formatted wellness plan summary
    """
    plan = await get_wellness_plan(patient_id)
    
    if not plan:
        return "Nenhum plano de bem-estar configurado ainda."
    
    summary = "PLANO DE BEM-ESTAR ATUAL:\n\n"
    
    if plan.get('dietaryPlan'):
        summary += f"Dieta: {plan['dietaryPlan'][:200]}...\n\n"
    
    if plan.get('exercisePlan'):
        summary += f"Exercícios: {plan['exercisePlan'][:200]}...\n\n"
    
    if plan.get('mentalWellnessPlan'):
        summary += f"Bem-estar Mental: {plan['mentalWellnessPlan'][:200]}...\n\n"
    
    if plan.get('dailyReminders'):
        summary += "Lembretes Diários:\n"
        for reminder in plan['dailyReminders'][:3]:
            summary += f"- {reminder.get('title', '')}: {reminder.get('description', '')}\n"
    
    return summary
