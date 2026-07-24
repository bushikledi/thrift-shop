/**
 * Vendor Products Page
 * Manage product listings
 */
"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Copy,
  Archive,
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
import { cn, formatCurrency } from "@/lib/utils";
import {
  useDeleteProduct,
  useUpdateProduct,
  useCreateProduct,
} from "@/hooks/useProducts";
import { useMyVendorProducts } from "@/hooks/useVendors";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  TableSkeleton,
  EmptyVendorProducts,
  DeleteConfirmation,
} from "@/components/shared";
import type { ProductCondition, ProductListItemDto } from "@/types";

const PAGE_SIZE = 10;

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const conditionLabels: Record<ProductCondition, string> = {
  LIKE_NEW: "Like New",
  VERY_GOOD: "Very Good",
  GOOD: "Good",
  FAIR: "Fair",
  POOR: "Poor",
};

export default function VendorProductsPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteProduct, setDeleteProduct] = useState<ProductListItemDto | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  // Vendor-scoped listing (only this vendor's products, including inactive/
  // archived ones) — the generic product list returned the whole catalog, so
  // acting on a row failed with "you can only delete your own products".
  const { data, isLoading } = useMyVendorProducts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    includeInactive: true,
  });

  const deleteProductMutation = useDeleteProduct();
  const updateProductMutation = useUpdateProduct();
  const createProductMutation = useCreateProduct();

  const handleToggleArchive = async (product: ProductListItemDto) => {
    try {
      await updateProductMutation.mutateAsync({
        id: product.id,
        data: { isActive: !product.isActive },
      });
      toast.success(product.isActive ? "Product archived" : "Product restored");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update product"
      );
    }
  };

  const handleDuplicate = async (product: ProductListItemDto) => {
    try {
      await createProductMutation.mutateAsync({
        title: `${product.title} (Copy)`,
        price: Number(product.price),
        comparePrice: product.comparePrice
          ? Number(product.comparePrice)
          : undefined,
        quantity: product.quantity,
        condition: product.condition,
        categoryId: product.category?.id,
        isUnique: true,
        // Start the copy as an inactive draft so it isn't sold accidentally.
        isActive: false,
      });
      toast.success("Product duplicated as a draft");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to duplicate product"
      );
    }
  };

  const products = data?.data || [];
  const totalPages = data?.meta?.totalPages || 1;
  const totalItems = data?.meta?.total || 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map((p: ProductListItemDto) => p.id));
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

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      toast.success("Product deleted");
      setDeleteProduct(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product"
      );
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      await Promise.all(
        selectedProducts.map((id) => deleteProductMutation.mutateAsync(id))
      );
      toast.success(`${selectedProducts.length} products deleted`);
      setSelectedProducts([]);
    } catch {
      toast.error("Failed to delete some products");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
        <Button asChild>
          <Link href="/vendor/products/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Product
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProducts.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteProductMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Products Table */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={6} />
      ) : products.length === 0 ? (
        <EmptyVendorProducts />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedProducts.length === products.length &&
                        products.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product: ProductListItemDto) => (
                  <TableRow key={product.id}>
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
                        <div className="relative h-12 w-12 overflow-hidden rounded-md bg-muted">
                          {product.media?.[0]?.url ? (
                            <Image
                              src={product.media[0].url}
                              alt={product.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              No img
                            </div>
                          )}
                        </div>
                        <div>
                          <Link
                            href={`/vendor/products/${product.slug}/edit`}
                            className="font-medium hover:text-primary"
                          >
                            {product.title}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            ID: {product.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {conditionLabels[
                          product.condition as ProductCondition
                        ] || product.condition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <span className="font-medium">
                          {formatCurrency(product.price)}
                        </span>
                        {product.comparePrice &&
                          product.comparePrice > product.price && (
                            <span className="ml-2 text-sm text-muted-foreground line-through">
                              {formatCurrency(product.comparePrice)}
                            </span>
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "font-medium",
                          product.quantity === 0 && "text-destructive",
                          product.quantity > 0 &&
                            product.quantity <= 5 &&
                            "text-orange-500"
                        )}
                      >
                        {product.quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          product.isActive
                            ? "default"
                            : "secondary"
                        }
                      >
                        {product.isActive ? "Active" : "Inactive"}
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
                          <DropdownMenuItem asChild>
                            <Link href={`/products/${product.slug}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/vendor/products/${product.slug}/edit`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDuplicate(product)}
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleArchive(product)}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            {product.isActive ? "Archive" : "Restore"}
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

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteProduct}
        onOpenChange={() => setDeleteProduct(null)}
        itemName={deleteProduct?.title}
        onConfirm={handleDeleteProduct}
        isLoading={deleteProductMutation.isPending}
      />
    </div>
  );
}
