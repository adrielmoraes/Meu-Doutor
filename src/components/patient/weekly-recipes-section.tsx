'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChefHat, Clock, Utensils } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface Recipe {
  id: string;
  title: string;
  mealType: 'cafe-da-manha' | 'almoco' | 'jantar' | 'lanche';
  ingredients: string[];
  instructions: string;
  dayOfWeek: string;
}

interface WeeklyRecipesSectionProps {
  recipes: Recipe[];
}

const mealTypeLabels: Record<Recipe['mealType'], string> = {
  'cafe-da-manha': 'Café da Manhã',
  'almoco': 'Almoço',
  'jantar': 'Jantar',
  'lanche': 'Lanche',
};

const mealTypeColors: Record<Recipe['mealType'], string> = {
  'cafe-da-manha': 'from-amber-500/20 to-orange-500/20 border-amber-500/30',
  'almoco': 'from-green-500/20 to-emerald-500/20 border-green-500/30',
  'jantar': 'from-blue-500/20 to-indigo-500/20 border-blue-500/30',
  'lanche': 'from-purple-500/20 to-pink-500/20 border-purple-500/30',
};

const mealTypeBadgeColors: Record<Recipe['mealType'], string> = {
  'cafe-da-manha': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'almoco': 'bg-green-500/20 text-green-300 border-green-500/30',
  'jantar': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'lanche': 'bg-purple-500/20 text-purple-300 border-purple-500/30',
};

export default function WeeklyRecipesSection({ recipes }: WeeklyRecipesSectionProps) {
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  if (!recipes || recipes.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-cyan-500/20">
        <CardContent className="p-6 text-center">
          <ChefHat className="h-12 w-12 mx-auto mb-3 text-cyan-400/50" />
          <p className="text-slate-400">
            Suas receitas semanais aparecerão aqui após a geração do plano.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((recipe) => (
          <Card
            key={recipe.id}
            className={`bg-gradient-to-br ${mealTypeColors[recipe.mealType]} backdrop-blur-xl border cursor-pointer hover:scale-105 transition-transform duration-200`}
            onClick={() => setSelectedRecipe(recipe)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                    <ChefHat className="h-5 w-5 text-cyan-400" />
                    {recipe.title}
                  </CardTitle>
                  <p className="text-sm text-slate-400 mt-1">{recipe.dayOfWeek}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Badge className={`${mealTypeBadgeColors[recipe.mealType]} border`}>
                {mealTypeLabels[recipe.mealType]}
              </Badge>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Utensils className="h-4 w-4 text-cyan-400" />
                <span>{recipe.ingredients.length} ingredientes</span>
              </div>
              <p className="text-xs text-cyan-300 mt-2">Clique para ver a receita completa</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recipe Details Dialog */}
      <Dialog open={!!selectedRecipe} onOpenChange={(open) => !open && setSelectedRecipe(null)}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-500/30 text-slate-100 max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedRecipe && (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2 bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
                  <ChefHat className="h-6 w-6 text-cyan-400" />
                  {selectedRecipe.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-3 mt-2">
                  <Badge className={`${mealTypeBadgeColors[selectedRecipe.mealType]} border`}>
                    {mealTypeLabels[selectedRecipe.mealType]}
                  </Badge>
                  <span className="text-slate-400">{selectedRecipe.dayOfWeek}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Ingredients Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-cyan-300">
                    <Utensils className="h-5 w-5" />
                    Ingredientes
                  </h3>
                  <ul className="space-y-2">
                    {selectedRecipe.ingredients.map((ingredient, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 text-slate-200"
                      >
                        <span className="text-cyan-400 mt-1">•</span>
                        <span>{ingredient}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Instructions Section */}
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-300">
                    <Clock className="h-5 w-5" />
                    Modo de Preparo
                  </h3>
                  <div className="whitespace-pre-line text-slate-200 leading-relaxed bg-slate-800/50 p-4 rounded-lg border border-cyan-500/20">
                    {selectedRecipe.instructions}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
