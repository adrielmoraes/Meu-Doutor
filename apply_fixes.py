import re

# Arquivo 1: update-wellness-plan.ts
file1_path = r"c:\Users\ADRIEL\Desktop\MediAI\AppMediAI\Meu-Doutor\src\ai\flows\update-wellness-plan.ts"

with open(file1_path, 'r', encoding='utf-8') as f:
    content1 = f.read()

# Correção 1: Expandir lista de ícones
old_icons = "const validIcons = ['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell'];"
new_icons = """const validIcons = ['Droplet', 'Clock', 'Coffee', 'Bed', 'Dumbbell', 
                            'Apple', 'Heart', 'Sun', 'Moon', 'Activity', 
                            'Utensils', 'Brain', 'Smile', 'Wind', 'Leaf'];"""

content1 = content1.replace(old_icons, new_icons)

# Correção 2: Atualizar validações de prepTime (sem adicionar função helper)
content1 = content1.replace(
    "meal.breakfastRecipe.prepTime.toLowerCase().includes('minute')",
    "(meal.breakfastRecipe.prepTime.toLowerCase().includes('minute') || meal.breakfastRecipe.prepTime.toLowerCase().includes('minuto'))"
)
content1 = content1.replace(
    "meal.lunchRecipe.prepTime.toLowerCase().includes('minute')",
    "(meal.lunchRecipe.prepTime.toLowerCase().includes('minute') || meal.lunchRecipe.prepTime.toLowerCase().includes('minuto'))"
)
content1 = content1.replace(
    "meal.dinnerRecipe.prepTime.toLowerCase().includes('minute')",
    "(meal.dinnerRecipe.prepTime.toLowerCase().includes('minute') || meal.dinnerRecipe.prepTime.toLowerCase().includes('minuto'))"
)

# Atualizar mensagens de erro
content1 = content1.replace(
    "Expected format like '20 minutos'.",
    "Expected format like '20 minutos' or '20 minutes'."
)

with open(file1_path, 'w', encoding='utf-8') as f:
    f.write(content1)

print("Arquivo 1 corrigido: update-wellness-plan.ts")

# Arquivo 2: actions.ts
file2_path = r"c:\Users\ADRIEL\Desktop\MediAI\AppMediAI\Meu-Doutor\src\components\patient\actions.ts"

with open(file2_path, 'r', encoding='utf-8') as f:
    content2 = f.read()

# Correção 3: Melhorar logging
old_catch = """console.error('[saveExamAnalysisAction] Failed to update wellness plan:', error);"""

new_catch = """console.error('[saveExamAnalysisAction] Failed to update wellness plan:', error);
            console.error('[saveExamAnalysisAction] Error details:', {
                message: error.message,
                stack: error.stack,
                patientId,
            });
            // Note: Error is logged but not thrown to avoid blocking exam save"""

content2 = content2.replace(old_catch, new_catch)

with open(file2_path, 'w', encoding='utf-8') as f:
    f.write(content2)

print("Arquivo 2 corrigido: actions.ts")
print("Todas as 3 correcoes aplicadas com sucesso!")
