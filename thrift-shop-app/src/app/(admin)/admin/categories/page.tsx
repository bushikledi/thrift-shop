/**
 * Admin Categories Page
 * Manage product categories
 */
"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  GripVertical,
  Tag,
  Image as ImageIcon,
  FolderTree,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";
import {
  LoadingSkeleton,
  EmptyState,
  DeleteConfirmation,
} from "@/components/shared";
import type { CategoryResponseDto as Category } from "@/types";

// Validation schema
const categorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug must contain only lowercase letters, numbers, and hyphens"
    ),
  description: z.string().optional(),
  image: z
    .string()
    .optional()
    .refine(
      (val) => !val || val === "" || z.string().url().safeParse(val).success,
      "Image must be a valid URL"
    ),
  parentId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().default(true).optional(),
  sortOrder: z.number().int().min(0).default(0).optional(),
});

type CategoryFormData = z.infer<typeof categorySchema>;

export default function AdminCategoriesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);

  const { data: categories, isLoading } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const { register, handleSubmit: formHandleSubmit, formState: { errors }, reset, control, setValue } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: null,
      isActive: true,
      sortOrder: 0,
    },
  });

  const parentId = useWatch({ control, name: "parentId" });
  const isActive = useWatch({ control, name: "isActive" });

  const categoryList = categories || [];

  // Build category tree for parent selection
  const parentCategories = categoryList.filter((c) => !c.parentId);

  // Stats
  const stats = {
    total: categoryList.length,
    active: categoryList.filter((c) => c.isActive !== false).length,
    withProducts: categoryList.filter((c) => {
      const categoryWithCount = c as Category & { _count?: { products?: number } };
      return (categoryWithCount._count?.products || 0) > 0;
    }).length,
  };

  const handleOpenDialog = (category?: Category) => {
    if (category) {
      setEditCategory(category);
      reset({
        name: category.name,
        slug: category.slug,
        description: category.description || "",
        image: category.image || "",
        parentId: category.parentId || null,
        isActive: category.isActive !== false,
        sortOrder: category.sortOrder || 0,
      });
    } else {
      setEditCategory(null);
      reset({
        name: "",
        slug: "",
        description: "",
        image: "",
        parentId: null,
        isActive: true,
        sortOrder: categoryList.length,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditCategory(null);
    reset();
  };

  const handleSubmit = async (data: CategoryFormData) => {
    try {
      if (editCategory) {
        await updateMutation.mutateAsync({
          id: editCategory.id,
          data: {
            ...data,
            parentId: data.parentId || undefined,
          },
        });
        toast.success("Category updated");
      } else {
        await createMutation.mutateAsync({
          ...data,
          parentId: data.parentId || undefined,
          isActive: data.isActive ?? true,
          sortOrder: data.sortOrder ?? 0,
        });
        toast.success("Category created");
      }
      handleCloseDialog();
    } catch {
      toast.error(
        editCategory ? "Failed to update category" : "Failed to create category"
      );
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;

    try {
      await deleteMutation.mutateAsync(deleteCategory.id);
      toast.success("Category deleted");
      setDeleteCategory(null);
    } catch {
      toast.error("Failed to delete category");
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
      setValue("name", name);
    if (!editCategory) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", slug);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <LoadingSkeleton className="h-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <LoadingSkeleton className="h-[400px]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Manage product categories</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Total Categories</p>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-green-600" />
              <p className="text-sm text-muted-foreground">Active</p>
            </div>
            <p className="text-2xl font-bold">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-muted-foreground">With Products</p>
            </div>
            <p className="text-2xl font-bold">{stats.withProducts}</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      {categoryList.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="No categories yet"
          description="Create your first category to organize products."
          action={{
            label: "Add Category",
            onClick: () => handleOpenDialog(),
          }}
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryList.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {category.image ? (
                        <div
                          className="h-10 w-10 rounded-lg bg-cover bg-center"
                          style={{ backgroundImage: `url(${category.image})` }}
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-sm text-muted-foreground">
                      {category.slug}
                    </code>
                  </TableCell>
                  <TableCell>
                    {category.parentId
                      ? categoryList.find((c) => c.id === category.parentId)
                          ?.name || "-"
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {(category as Category & { _count?: { products?: number } })._count?.products || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        category.isActive !== false ? "default" : "secondary"
                      }
                    >
                      {category.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleOpenDialog(category)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteCategory(category)}
                          disabled={((category as Category & { _count?: { products?: number } })._count?.products || 0) > 0}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Category Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editCategory ? "Edit Category" : "Add Category"}
            </DialogTitle>
            <DialogDescription>
              {editCategory
                ? "Update the category details."
                : "Create a new product category."}
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={formHandleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register("name")}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Category name"
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                {...register("slug")}
                placeholder="category-slug"
              />
              {errors.slug && (
                <p className="text-sm text-destructive mt-1">
                  {errors.slug.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Category description"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                {...register("image")}
                placeholder="https://example.com/image.jpg"
              />
              {errors.image && (
                <p className="text-sm text-destructive mt-1">
                  {errors.image.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="parentId">Parent Category</Label>
              <Select
                value={parentId || "none"}
                onValueChange={(value) => {
                  const newValue = value === "none" ? null : value;
                  setValue("parentId", newValue, { shouldValidate: true });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select parent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top Level)</SelectItem>
                  {parentCategories
                    .filter((c) => c.id !== editCategory?.id)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) =>
                  setValue("isActive", checked)
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseDialog}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editCategory ? "Save Changes" : "Create Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
        itemName={deleteCategory?.name}
        onConfirm={handleDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
