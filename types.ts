
export interface ProductAnalysis {
  id: string; // Unique identifier (barcode or generated)
  barcode?: string;
  productName: string;
  imageUrl: string;
  score: number;
  recommendation: string;
  organizedData: {
    [key: string]: string | number;
  };
  sources?: Array<{
    title: string;
    uri: string;
  }>;
}

export interface HealthGoals {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export interface UserProfile {
    goals: HealthGoals;
}


export interface Meal {
  name: string;
  recipe: string;
  nutrition: {
    calories: string;
    protein: string;
    fat: string;
    carbohydrates: string;
  };
}

export interface DailyPlan {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
  };
}

export interface ShoppingListItem {
    item: string;
    quantity: string;
    category: string;
}

export interface WeeklyPlan {
  weeklyPlan: DailyPlan[];
  shoppingList: ShoppingListItem[];
}