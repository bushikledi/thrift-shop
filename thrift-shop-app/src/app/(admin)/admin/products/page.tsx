/**
 * Admin Products Page
 * Manage and moderate platform products
 */
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  MoreHorizontal,
  Star,
  StarOff,
  Eye,
  EyeOff,
  ExternalLink,
  Trash2,
  Flag,
  Package,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useAdminProducts,
  useAdminToggleProductFeatured,
  useAdminToggleProductActive,
} from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  TableSkeleton,
  EmptyState,
  DeleteConfirmation,
} from "@/components/shared";
import type { ProductListItemDto as Product } from "@/types";

const PAGE_SIZE = 15;

const conditionOptions = [
  { value: "all", label: "All Conditions" },
  { value: "new", label: "New" },
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const sortOptions = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "viewCount:desc", label: "Most Viewed" },
];

export default function AdminProductsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [category, setCategory] = useState(
    searchParams.get("category") || "all"
  );
  const [condition, setCondition] = useState(
    searchParams.get("condition") || "all"
  );
  const [sort, setSort] = useState(
    searchParams.get("sort") || "createdAt:desc"
  );
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [includeInactive, setIncludeInactive] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteProduct, setDeleteProduct] = useState<Product | null>(null);
  const [flagProduct, setFlagProduct] = useState<Product | null>(null);
  const [flagReason, setFlagReason] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const { data, isLoading } = useAdminProducts({
    page,
    limit: PAGE_SIZE,
    includeInactive,
  });

  const toggleFeaturedMutation = useAdminToggleProductFeatured();
  const toggleActiveMutation = useAdminToggleProductActive();

  const products = Array.isArray(data)
    ? data
    : (
        data as unknown as {
          data?: Product[];
          meta?: { totalPages?: number; total?: number };
        }
      )?.data || [];
  const totalPages =
    (data as { meta?: { totalPages?: number } })?.meta?.totalPages || 1;
  const totalItems =
    (data as { meta?: { total?: number } })?.meta?.total || products.length;

  // Filter products locally (if API doesn't support all filters)
  const filteredProducts = products.filter((product: Product) => {
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      if (!product.title?.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    if (category !== "all" && product.category?.id !== category) {
      return false;
    }
    if (condition !== "all" && product.condition !== condition) {
      return false;
    }
    return true;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(filteredProducts.map((p: Product) => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, productId]);
    } else {
      setSelectedProducts(selectedProducts.filter((id) => id !== productId));
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    try {
      await toggleFeaturedMutation.mutateAsync(product.id);
    } catch {
      toast.error("Failed to toggle featured status");
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleActiveMutation.mutateAsync(product.id);
    } catch {
      toast.error("Failed to toggle active status");
    }
  };

  const handleFlagProduct = async () => {
    if (!flagProduct || !flagReason.trim()) return;

    try {
      // This would call an API to flag the product
      toast.success("Product flagged for review");
      setFlagProduct(null);
      setFlagReason("");
    } catch {
      toast.error("Failed to flag product");
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      // This would call an API to delete the product
      toast.success("Product deleted");
      setDeleteProduct(null);
    } catch {
      toast.error("Failed to delete product");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">
            Manage and moderate platform products
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="include-inactive"
            checked={includeInactive}
            onCheckedChange={setIncludeInactive}
          />
          <Label htmlFor="include-inactive" className="text-sm">
            Include Inactive
          </Label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={condition} onValueChange={setCondition}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            {conditionOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-muted p-3">
          <span className="text-sm font-medium">
            {selectedProducts.length} selected
          </span>
          <Button variant="outline" size="sm">
            <Star className="mr-2 h-4 w-4" />
            Feature
          </Button>
          <Button variant="outline" size="sm">
            <EyeOff className="mr-2 h-4 w-4" />
            Deactivate
          </Button>
          <Button variant="outline" size="sm" className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      )}

      {/* Products Table */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={8} />
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="No products match your search criteria."
        />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProducts.length === filteredProducts.length &&
                        filteredProducts.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => (
                  <TableRow
                    key={product.id}
                    className={cn(!product.isActive && "opacity-60")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.includes(product.id)}
                        onCheckedChange={(checked) =>
                          handleSelectProduct(product.id, checked as boolean)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 overflow-hidden rounded-lg bg-muted">
                          {product.media?.[0]?.url ? (
                            <Image
                              src={product.media[0].url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center">
                              <Package className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">
                            {product.title}
                          </p>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {product.condition?.replace("_", " ")}
                            </Badge>
                            {product.isFeatured && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-yellow-100 text-yellow-800"
                              >
                                <Star className="mr-1 h-3 w-3" />
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/admin/vendors?id=${product.vendor?.id}`}
                        className="text-primary hover:underline"
                      >
                        {product.vendor?.displayName || "Unknown"}
                      </Link>
                    </TableCell>
                    <TableCell>{product.category?.name || "-"}</TableCell>
                    <TableCell className="font-medium">
                      ${Number(product.price || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={product.isActive ? "default" : "secondary"}
                      >
                        {product.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">0</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <a
                              href={`/products/${product.slug || product.id}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              View Product
                            </a>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleToggleFeatured(product)}
                          >
                            {product.isFeatured ? (
                              <>
                                <StarOff className="mr-2 h-4 w-4" />
                                Remove Featured
                              </>
                            ) : (
                              <>
                                <Star className="mr-2 h-4 w-4" />
                                Mark Featured
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleActive(product)}
                          >
                            {product.isActive ? (
                              <>
                                <EyeOff className="mr-2 h-4 w-4" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <Eye className="mr-2 h-4 w-4" />
                                Activate
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setFlagProduct(product)}
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            Flag for Review
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteProduct(product)}
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems}{" "}
                products
              </p>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}

      {/* Flag Product Dialog */}
      <Dialog open={!!flagProduct} onOpenChange={() => setFlagProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Product for Review</DialogTitle>
            <DialogDescription>
              Flag &ldquo;{flagProduct?.title}&rdquo; for moderation review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-reason">Reason for Flagging</Label>
              <Textarea
                id="flag-reason"
                placeholder="Describe the issue with this product..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleFlagProduct} disabled={!flagReason.trim()}>
              <Flag className="mr-2 h-4 w-4" />
              Flag Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
        itemName={deleteProduct?.title}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}
