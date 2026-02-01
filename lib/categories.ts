import { type TabCategory } from "./storage";

export const CATEGORY_OPTIONS: { value: TabCategory; label: string }[] = [
  { value: "Groceries", label: "Groceries" },
  { value: "FoodDelivery", label: "Food Delivery" },
  { value: "Utilities", label: "Utilities" },
  { value: "Rent", label: "Rent" },
  { value: "Other", label: "Other" },
];

export function formatCategory(category: TabCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? category;
}
