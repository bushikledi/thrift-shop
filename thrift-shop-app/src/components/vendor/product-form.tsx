/**
 * Product Form Component
 * Used for creating and editing products
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Upload, X, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { ProductDetailDto, ProductCondition } from "@/types";

// Validation schema
const productSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(20, "Description must be at least 20 characters"),
  price: z.number().min(0.01, "Price must be greater than 0"),
  comparePrice: z.number().positive().optional().nullable(),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  condition: z.enum(["LIKE_NEW", "VERY_GOOD", "GOOD", "FAIR", "POOR"]),
  categoryId: z.string().uuid("Please select a valid category").min(1, "Please select a category"),
  tags: z.array(z.string()).optional(),
  isPublished: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductDetailDto;
  mode: "create" | "edit";
}

const conditions: {
  value: ProductCondition;
  label: string;
  description: string;
}[] = [
  {
    value: "LIKE_NEW",
    label: "Like New",
    description: "Worn once or twice, excellent condition",
  },
  {
    value: "LIKE_NEW",
    label: "Like New",
    description: "Worn once or twice, excellent condition",
  },
  {
    value: "GOOD",
    label: "Good",
    description: "Gently used, minor signs of wear",
  },
  {
    value: "FAIR",
    label: "Fair",
    description: "Visible wear but still functional",
  },
  { value: "POOR", label: "Poor", description: "Heavy wear, may have defects" },
];

export function ProductForm({ product, mode }: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(
    product?.media?.map((m) => m.url) || []
  );
  const [tagInput, setTagInput] = useState("");

  const { data: categoriesData } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const isLoading = createProduct.isPending || updateProduct.isPending;

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      title: product?.title || "",
      description: product?.description || "",
      price: product?.price || 0,
      comparePrice: product?.comparePrice || undefined,
      quantity: product?.quantity || 1,
      condition: product?.condition || "GOOD",
      categoryId: product?.category?.id || "",
      tags: product?.tags || [],
      isPublished: product?.isActive ?? false,
    },
  });

  const tags = useWatch({ control, name: "tags" }) || [];

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setValue("tags", [...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setValue(
      "tags",
      tags.filter((t) => t !== tag)
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // TODO: Implement actual image upload
    // For now, create object URLs
    const newImages = Array.from(files).map((file) =>
      URL.createObjectURL(file)
    );
    setImages([...images, ...newImages]);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const productData = {
        title: data.title,
        description: data.description,
        price: data.price,
        comparePrice: data.comparePrice ?? undefined,
        quantity: data.quantity,
        condition: data.condition,
        categoryId: data.categoryId,
        tags: data.tags,
        isActive: data.isPublished,
        isUnique: true,
      };

      if (mode === "create") {
        await createProduct.mutateAsync(productData);
        toast.success("Product created successfully!");
        router.push("/vendor/products");
      } else if (product) {
        await updateProduct.mutateAsync({ 
          id: product.id, 
          data: {
            ...productData,
            comparePrice: productData.comparePrice ?? undefined,
          }
        });
        toast.success("Product updated successfully!");
        router.push("/vendor/products");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save product"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Add the basic details about your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Vintage Levi's 501 Jeans"
                  {...register("title")}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your product in detail..."
                  rows={5}
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Add up to 8 images. First image will be the cover.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={index}
                    className="group relative aspect-square rounded-lg border bg-muted overflow-hidden"
                  >
                    <Image
                      src={image}
                      alt={`Product ${index + 1}`}
                      fill
                      className="rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 rounded bg-black/50 px-1 text-xs text-white">
                        Cover
                      </span>
                    )}
                  </div>
                ))}

                {images.length < 8 && (
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-muted-foreground transition-colors hover:border-primary hover:text-primary">
                    <Upload className="mb-2 h-6 w-6" />
                    <span className="text-xs">Add Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-7"
                      {...register("price", { valueAsNumber: true })}
                    />
                  </div>
                  {errors.price && (
                    <p className="text-sm text-destructive">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="comparePrice"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Original price"
                      className="pl-7"
                      {...register("comparePrice", { valueAsNumber: true })}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Show a crossed-out original price
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-destructive">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="isPublished"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isPublished"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="isPublished" className="font-normal">
                      Published (visible to customers)
                    </Label>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category: { id: string; name: string }) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.categoryId.message}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Condition */}
          <Card>
            <CardHeader>
              <CardTitle>Condition</CardTitle>
            </CardHeader>
            <CardContent>
              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <div className="space-y-2">
                    {conditions.map((condition) => (
                      <label
                        key={condition.value}
                        className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors ${
                          field.value === condition.value
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted"
                        }`}
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={condition.value}
                          checked={field.value === condition.value}
                          onChange={() => field.onChange(condition.value)}
                          className="mt-1"
                        />
                        <div>
                          <p className="font-medium">{condition.label}</p>
                          <p className="text-sm text-muted-foreground">
                            {condition.description}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
              <CardDescription>
                Add tags to help customers find your product
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddTag}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4 border-t pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {mode === "create" ? "Create Product" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

export default ProductForm;
