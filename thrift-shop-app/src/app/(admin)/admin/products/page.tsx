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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  useAdminProducts,
  useAdminToggleProductFeatured,
  useAdminToggleProductActive,
  useAdminFlagProduct,
  useAdminUnflagProduct,
  useAdminDeleteProduct,
} from "@/hooks/useAdmin";
import { useCategories } from "@/hooks/useCategories";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Pagination,
  TableSkeleton,
  EmptyState,
  DeleteConfirmation,
} from "@/components/shared";
import type {
  ProductListItemDto as Product,
  ProductCondition,
} from "@/types";
import { FieldError } from "@/components/forms/field-error";

const PAGE_SIZE = 15;

// Mirrors FlagProductDto on the API (@MinLength(3) / @MaxLength(500)).
const FLAG_REASON_MIN = 3;
const FLAG_REASON_MAX = 500;

/**
 * Moderation fields the admin product list returns but the generated
 * ProductListItemDto does not yet describe.
 */
type ModeratedProduct = Product & {
  viewCount?: number | null;
  flaggedAt?: string | null;
  flagReason?: string | null;
  description?: string | null;
  quantity?: number | null;
};

const asModerated = (product: Product) => product as ModeratedProduct;

// Values must be the ProductCondition enum the API stores. They used to be
// lowercase — and included a "New" that does not exist — so the filter could
// never match a single row.
const conditionOptions = [
  { value: "all", label: "All Conditions" },
  { value: "LIKE_NEW", label: "Like New" },
  { value: "VERY_GOOD", label: "Very Good" },
  { value: "GOOD", label: "Good" },
  { value: "FAIR", label: "Fair" },
  { value: "POOR", label: "Poor" },
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
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [flagAttempted, setFlagAttempted] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  // Every filter goes to the API. Filtering the fifteen rows already on screen
  // made search and the category/condition selects look like they did nothing,
  // and left the pagination total describing a different set than the table.
  const [sortBy, sortOrder] = sort.split(":") as [
    "createdAt" | "price" | "viewCount" | "title",
    "asc" | "desc",
  ];

  const { data, isLoading } = useAdminProducts({
    page,
    limit: PAGE_SIZE,
    includeInactive,
    search: debouncedSearch || undefined,
    categoryId: category !== "all" ? category : undefined,
    condition:
      condition !== "all" ? (condition as ProductCondition) : undefined,
    sortBy,
    sortOrder,
  });

  const toggleFeaturedMutation = useAdminToggleProductFeatured();
  const toggleActiveMutation = useAdminToggleProductActive();
  const flagProductMutation = useAdminFlagProduct();
  const unflagProductMutation = useAdminUnflagProduct();
  const deleteProductMutation = useAdminDeleteProduct();

  const trimmedFlagReason = flagReason.trim();
  const flagReasonValid =
    trimmedFlagReason.length >= FLAG_REASON_MIN &&
    trimmedFlagReason.length <= FLAG_REASON_MAX;
  // Deliberately not driven by blur: closing the dropdown that opened this
  // dialog restores focus to its trigger, which blurred the textarea and
  // flagged an untouched field as invalid the moment the dialog appeared.
  const showFlagReasonError =
    !flagReasonValid && (flagAttempted || trimmedFlagReason.length > 0);

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

  // The API has already applied search, category, condition and sort.
  const filteredProducts = products;

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
    if (!flagProduct || !flagReasonValid) {
      setFlagAttempted(true);
      return;
    }

    try {
      await flagProductMutation.mutateAsync({
        id: flagProduct.id,
        reason: flagReason.trim(),
      });
      setFlagProduct(null);
      setFlagReason("");
      setFlagAttempted(false);
    } catch {
      // The mutation surfaces the error; keep the dialog open so the admin
      // can retry without retyping the reason.
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      await deleteProductMutation.mutateAsync(deleteProduct.id);
      setDeleteProduct(null);
    } catch {
      // Deleting a product that appears in orders fails with 409; the error
      // toast explains it, so leave the dialog open.
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
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
        <Select
          value={category}
          onValueChange={(v) => {
            setCategory(v);
            setPage(1);
          }}
        >
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
        <Select
          value={condition}
          onValueChange={(v) => {
            setCondition(v);
            setPage(1);
          }}
        >
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
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v);
            setPage(1);
          }}
        >
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
                      {/* Flagging deactivates the listing, so a flagged
                          product used to read as a plain "Inactive" with no
                          hint that a moderator had pulled it. */}
                      {asModerated(product).flaggedAt ? (
                        <Badge
                          variant="outline"
                          className="gap-1 border-destructive text-destructive"
                        >
                          <Flag className="h-3 w-3" />
                          Flagged
                        </Badge>
                      ) : (
                        <Badge
                          variant={product.isActive ? "default" : "secondary"}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground tabular-nums">
                      {asModerated(product).viewCount ?? 0}
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
                            onClick={() => setViewProduct(product)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
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
                          {(product as { flaggedAt?: string | null })
                            .flaggedAt ? (
                            <DropdownMenuItem
                              onClick={() =>
                                unflagProductMutation.mutate(product.id)
                              }
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              Clear Flag &amp; Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => {
                              setFlagReason("");
                              setFlagAttempted(false);
                              setFlagProduct(product);
                            }}
                            >
                              <Flag className="mr-2 h-4 w-4" />
                              Flag for Review
                            </DropdownMenuItem>
                          )}
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
      <Dialog open={!!flagProduct} onOpenChange={(open) => { if (!open) setFlagProduct(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Product for Review</DialogTitle>
            <DialogDescription>
              Flag &ldquo;{flagProduct?.title}&rdquo; for moderation review.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="flag-reason">Reason for Flagging</Label>
              <Textarea
                id="flag-reason"
                placeholder="Describe the issue with this product..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                rows={4}
                maxLength={FLAG_REASON_MAX}
                aria-invalid={showFlagReasonError}
              />
              <div className="flex items-start justify-between gap-4">
                {/* The server enforces 3–500 characters. Mirroring it here is
                    what turns a silent 400 into something the admin can act
                    on before submitting. */}
                <FieldError
                  error={
                    showFlagReasonError
                      ? {
                          message: `Give a reason of at least ${FLAG_REASON_MIN} characters so other admins know why.`,
                        }
                      : undefined
                  }
                />
                <span
                  className={cn(
                    "ml-auto shrink-0 text-xs tabular-nums text-muted-foreground",
                    flagReason.length >= FLAG_REASON_MAX && "text-destructive"
                  )}
                >
                  {flagReason.length}/{FLAG_REASON_MAX}
                </span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Flagging hides the listing from the storefront right away. It
              stays hidden until an admin clears the flag, which restores it.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFlagProduct(null)}>
              Cancel
            </Button>
            <Button onClick={handleFlagProduct} disabled={!flagReasonValid}>
              <Flag className="mr-2 h-4 w-4" />
              Flag Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Details Drawer.
          Deliberately not a link to /products/[slug]: the storefront page puts
          "Add to cart" and wishlist actions in front of a moderator, which is
          not what "view" should mean here. */}
      <Sheet
        open={!!viewProduct}
        onOpenChange={(open) => {
          if (!open) setViewProduct(null);
        }}
      >
        <SheetContent className="flex h-full flex-col overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Product Details</SheetTitle>
            <SheetDescription>
              Review this listing without leaving the admin panel
            </SheetDescription>
          </SheetHeader>

          {viewProduct && (
            <div className="mt-6 space-y-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                {viewProduct.media?.[0]?.url ? (
                  <Image
                    src={viewProduct.media[0].url}
                    alt={viewProduct.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>

              {viewProduct.media && viewProduct.media.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {viewProduct.media.slice(1, 6).map((m) => (
                    <div
                      key={m.id}
                      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-muted"
                    >
                      <Image
                        src={m.url}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h3 className="text-xl font-semibold">{viewProduct.title}</h3>
                <p className="mt-1 text-2xl font-bold">
                  ${Number(viewProduct.price || 0).toFixed(2)}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {asModerated(viewProduct).flaggedAt ? (
                    <Badge
                      variant="outline"
                      className="gap-1 border-destructive text-destructive"
                    >
                      <Flag className="h-3 w-3" />
                      Flagged
                    </Badge>
                  ) : (
                    <Badge
                      variant={viewProduct.isActive ? "default" : "secondary"}
                    >
                      {viewProduct.isActive ? "Active" : "Inactive"}
                    </Badge>
                  )}
                  {viewProduct.isFeatured && (
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-yellow-100 text-yellow-800"
                    >
                      <Star className="h-3 w-3" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className="capitalize">
                    {viewProduct.condition?.replace("_", " ")}
                  </Badge>
                </div>
              </div>

              {asModerated(viewProduct).flaggedAt && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <Flag className="h-4 w-4" />
                    Flagged for review
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {asModerated(viewProduct).flagReason ||
                      "No reason recorded."}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Hidden from the storefront since{" "}
                    {new Date(
                      asModerated(viewProduct).flaggedAt as string
                    ).toLocaleString()}
                    . Clearing the flag makes it visible again.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      unflagProductMutation.mutate(viewProduct.id);
                      setViewProduct(null);
                    }}
                  >
                    <Flag className="mr-2 h-4 w-4" />
                    Clear Flag &amp; Restore
                  </Button>
                </div>
              )}

              <Separator />

              <div className="grid gap-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Vendor</span>
                  <Link
                    href={`/admin/vendors?id=${viewProduct.vendor?.id}`}
                    className="text-primary hover:underline"
                  >
                    {viewProduct.vendor?.displayName || "Unknown"}
                  </Link>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Category</span>
                  <span>{viewProduct.category?.name || "Uncategorized"}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">In stock</span>
                  <span>{asModerated(viewProduct).quantity ?? 0}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Slug</span>
                  <span className="truncate font-mono text-xs">
                    {viewProduct.slug}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Product ID</span>
                  <span className="truncate font-mono text-xs">
                    {viewProduct.id}
                  </span>
                </div>
              </div>

              {asModerated(viewProduct).description && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Description</h4>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {asModerated(viewProduct).description}
                    </p>
                  </div>
                </>
              )}

              <Separator />

              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleToggleFeatured(viewProduct)}
                >
                  {viewProduct.isFeatured ? (
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
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleToggleActive(viewProduct)}
                >
                  {viewProduct.isActive ? (
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
                </Button>
                {/* Opening the storefront page stays available, but as an
                    explicit opt-in rather than what "view" does by default. */}
                <Button variant="ghost" asChild>
                  <a
                    href={`/products/${viewProduct.slug || viewProduct.id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open storefront page
                  </a>
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <DeleteConfirmation
        open={!!deleteProduct}
        onOpenChange={(open) => { if (!open) setDeleteProduct(null); }}
        itemName={deleteProduct?.title}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}
