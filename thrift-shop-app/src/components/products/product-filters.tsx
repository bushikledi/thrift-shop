/**
 * Product Filters Component
 * Sidebar filters for the shop page
 */
"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { CategoryResponseDto, ProductCondition } from "@/types";

interface ProductFiltersProps {
  categories: CategoryResponseDto[];
  categoryId: string;
  onCategoryChange: (value: string) => void;
  condition: ProductCondition | "";
  onConditionChange: (value: ProductCondition | "") => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  onClearFilters: () => void;
}

const conditions: { value: ProductCondition; label: string }[] = [
  { value: "LIKE_NEW", label: "Like new" },
  { value: "VERY_GOOD", label: "Very good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
];

interface FilterSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function FilterSection({
  title,
  defaultOpen = true,
  children,
}: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="border-b pb-4"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 text-sm font-medium hover:text-primary">
        {title}
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export function ProductFilters({
  categories,
  categoryId,
  onCategoryChange,
  condition,
  onConditionChange,
  minPrice,
  maxPrice,
  onPriceChange,
  onClearFilters,
}: ProductFiltersProps) {
  const [localMinPrice, setLocalMinPrice] = useState(minPrice);
  const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice);

  const handlePriceApply = () => {
    onPriceChange(localMinPrice, localMaxPrice);
  };

  const hasFilters = categoryId || condition || minPrice || maxPrice;

  return (
    <div className="space-y-4">
      {/* Categories */}
      <FilterSection title="Category">
        <RadioGroup value={categoryId} onValueChange={onCategoryChange}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="" id="category-all" />
            <Label
              htmlFor="category-all"
              className="text-sm font-normal cursor-pointer"
            >
              All categories
            </Label>
          </div>
          {categories.map((category) => (
            <div key={category.id} className="flex items-center space-x-2">
              <RadioGroupItem
                value={category.id}
                id={`category-${category.id}`}
              />
              <Label
                htmlFor={`category-${category.id}`}
                className="text-sm font-normal cursor-pointer"
              >
                {category.name}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condition">
        <RadioGroup
          value={condition}
          onValueChange={(value) =>
            onConditionChange(value as ProductCondition | "")
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="" id="condition-all" />
            <Label
              htmlFor="condition-all"
              className="text-sm font-normal cursor-pointer"
            >
              Any condition
            </Label>
          </div>
          {conditions.map((cond) => (
            <div key={cond.value} className="flex items-center space-x-2">
              <RadioGroupItem
                value={cond.value}
                id={`condition-${cond.value}`}
              />
              <Label
                htmlFor={`condition-${cond.value}`}
                className="text-sm font-normal cursor-pointer"
              >
                {cond.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label
                htmlFor="min-price"
                className="text-xs text-muted-foreground"
              >
                Min
              </Label>
              <Input
                id="min-price"
                type="number"
                placeholder="$0"
                min="0"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label
                htmlFor="max-price"
                className="text-xs text-muted-foreground"
              >
                Max
              </Label>
              <Input
                id="max-price"
                type="number"
                placeholder="$∞"
                min="0"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full"
            onClick={handlePriceApply}
          >
            Apply Price
          </Button>
        </div>
      </FilterSection>

      {/* Clear Filters */}
      {hasFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onClearFilters}
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}

export default ProductFilters;
