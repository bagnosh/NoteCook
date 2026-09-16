export type Ingredient = {
  amount: string;
  unit: string;
  name: string;
};

export type Recipe = {
  id: string;
  title: string;
  categories: string[];
  ingredients: Ingredient[];
  tools: string[];
  steps: string[];
  photo: string | null;
  notes: string;
  favourite: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Category = {
  id: string;
  name: string;
};