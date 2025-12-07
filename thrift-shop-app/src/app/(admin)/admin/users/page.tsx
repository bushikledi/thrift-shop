/**
 * Admin Users Page
 * Manage platform users
 */
"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  Shield,
  ShieldCheck,
  Store,
  User,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useAdminUsers,
  useAdminUpdateUser,
  useAdminDeleteUser,
} from "@/hooks/useAdmin";
import { useDebounce } from "@/hooks/useDebounce";
import { Pagination, TableSkeleton, EmptyUsers } from "@/components/shared";
import type { UserProfileResponseDto, UserRole } from "@/types";

const PAGE_SIZE = 10;

const roleOptions = [
  { value: "all", label: "All Roles" },
  { value: "ADMIN", label: "Admin" },
  { value: "VENDOR", label: "Vendor" },
  { value: "CUSTOMER", label: "Customer" },
];

const roleConfig: Record<
  UserRole,
  {
    label: string;
    variant: "default" | "secondary" | "outline";
    icon: React.ElementType;
  }
> = {
  ADMIN: {
    label: "Admin",
    variant: "default",
    icon: ShieldCheck,
  },
  VENDOR: {
    label: "Vendor",
    variant: "secondary",
    icon: Store,
  },
  CUSTOMER: {
    label: "Customer",
    variant: "outline",
    icon: User,
  },
};

export default function AdminUsersPage() {
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [role, setRole] = useState(searchParams.get("role") || "all");
  const [page, setPage] = useState(
    parseInt(searchParams.get("page") || "1", 10)
  );
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [deleteUser, setDeleteUser] = useState<UserProfileResponseDto | null>(
    null
  );
  const [viewUser, setViewUser] = useState<UserProfileResponseDto | null>(null);
  const [roleChangeUser, setRoleChangeUser] = useState<{
    user: UserProfileResponseDto;
    newRole: UserRole;
  } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, refetch, isFetching } = useAdminUsers({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: role !== "all" ? (role as UserRole) : undefined,
  });

  const updateUserMutation = useAdminUpdateUser();
  const deleteUserMutation = useAdminDeleteUser();

  const users = useMemo(() => {
    if (Array.isArray(data)) return data;
    return (
      (
        data as unknown as {
          data?: UserProfileResponseDto[];
        }
      )?.data || []
    );
  }, [data]);

  const { totalPages, totalItems } = useMemo(() => {
    const meta = (data as { meta?: { totalPages?: number; total?: number } })
      ?.meta;
    return {
      totalPages: meta?.totalPages || 1,
      totalItems: meta?.total || users.length,
    };
  }, [data, users.length]);

  // Stats
  const stats = useMemo(() => {
    const admins = users.filter(
      (u: UserProfileResponseDto) => u.role === "ADMIN"
    ).length;
    const vendors = users.filter(
      (u: UserProfileResponseDto) => u.role === "VENDOR"
    ).length;
    const customers = users.filter(
      (u: UserProfileResponseDto) => u.role === "CUSTOMER"
    ).length;
    const verified = users.filter(
      (u: UserProfileResponseDto) => u.emailVerified
    ).length;
    return { admins, vendors, customers, verified, total: users.length };
  }, [users]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(users.map((u: UserProfileResponseDto) => u.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
    } else {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteUser) return;

    try {
      await deleteUserMutation.mutateAsync(deleteUser.id);
      setDeleteUser(null);
      setSelectedUsers(selectedUsers.filter((id) => id !== deleteUser.id));
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser) return;

    try {
      await updateUserMutation.mutateAsync({
        id: roleChangeUser.user.id,
        data: { role: roleChangeUser.newRole },
      });
      setRoleChangeUser(null);
    } catch {
      // Error is handled by the mutation
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) return;

    try {
      await Promise.all(
        selectedUsers.map((id) => deleteUserMutation.mutateAsync(id))
      );
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} users deleted`);
    } catch {
      toast.error("Failed to delete some users");
    }
  };

  const handleRefresh = () => {
    refetch();
    toast.success("Users refreshed");
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRoleFilter = (value: string) => {
    setRole(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage platform users and their permissions
          </p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={isFetching}>
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              {stats.verified} verified
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
            <ShieldCheck className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
            <p className="text-xs text-muted-foreground">Platform managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendors</CardTitle>
            <Store className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendors}</div>
            <p className="text-xs text-muted-foreground">Active sellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customers</CardTitle>
            <User className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.customers}</div>
            <p className="text-xs text-muted-foreground">Registered buyers</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={role} onValueChange={handleRoleFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedUsers.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedUsers.length} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleteUserMutation.isPending}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
            </Button>
          </div>
        )}
      </div>

      {/* Users Table */}
      {isLoading ? (
        <TableSkeleton rows={PAGE_SIZE} columns={6} />
      ) : users.length === 0 ? (
        <EmptyUsers />
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        selectedUsers.length === users.length &&
                        users.length > 0
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user: UserProfileResponseDto) => {
                  const roleInfo = roleConfig[user.role as UserRole];
                  const RoleIcon = roleInfo?.icon || User;

                  return (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setViewUser(user)}
                    >
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) =>
                            handleSelectUser(user.id, checked as boolean)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.avatar || undefined} />
                            <AvatarFallback>
                              {user.name?.[0] || user.email?.[0] || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {user.name || "No name"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Badge
                          variant={roleInfo?.variant || "outline"}
                          className="gap-1"
                        >
                          <RoleIcon className="h-3 w-3" />
                          {roleInfo?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.emailVerified ? (
                          <Badge
                            variant="default"
                            className="gap-1 bg-green-500 hover:bg-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 text-amber-600 border-amber-300"
                          >
                            <XCircle className="h-3 w-3" />
                            Unverified
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.createdAt
                          ? format(new Date(user.createdAt), "MMM d, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setViewUser(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setRoleChangeUser({
                                  user,
                                  newRole:
                                    user.role === "ADMIN"
                                      ? "CUSTOMER"
                                      : user.role === "VENDOR"
                                      ? "CUSTOMER"
                                      : "VENDOR",
                                })
                              }
                            >
                              <Shield className="mr-2 h-4 w-4" />
                              Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteUser(user)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete User
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {(page - 1) * PAGE_SIZE + 1} to{" "}
                {Math.min(page * PAGE_SIZE, totalItems)} of {totalItems} users
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

      {/* User Details Sheet */}
      <Sheet open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>
              View and manage user information
            </SheetDescription>
          </SheetHeader>

          {viewUser && (
            <div className="mt-6 space-y-6">
              {/* User Avatar and Basic Info */}
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={viewUser.avatar || undefined} />
                  <AvatarFallback className="text-2xl">
                    {viewUser.name?.[0] || viewUser.email?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">
                    {viewUser.name || "No name"}
                  </h3>
                  <p className="text-muted-foreground">{viewUser.email}</p>
                  <Badge
                    variant={roleConfig[viewUser.role as UserRole]?.variant}
                    className="mt-2 gap-1"
                  >
                    {(() => {
                      const Icon =
                        roleConfig[viewUser.role as UserRole]?.icon || User;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {roleConfig[viewUser.role as UserRole]?.label ||
                      viewUser.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* User Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium">Information</h4>
                <div className="grid gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{viewUser.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span>{viewUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone</span>
                    <span>{viewUser.phone || "Not provided"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Email Verified
                    </span>
                    <span>
                      {viewUser.emailVerified ? (
                        <Badge variant="default" className="bg-green-500">
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline">No</Badge>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Joined</span>
                    <span>
                      {viewUser.createdAt
                        ? format(new Date(viewUser.createdAt), "PPP")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Vendor Info (if applicable) */}
              {viewUser.vendor && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Vendor Information</h4>
                    <div className="grid gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Store Name
                        </span>
                        <span>{viewUser.vendor.displayName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Verified</span>
                        <span>
                          {viewUser.vendor.verified ? (
                            <Badge variant="default" className="bg-green-500">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline">No</Badge>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <Separator />

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setViewUser(null);
                    setRoleChangeUser({
                      user: viewUser,
                      newRole:
                        viewUser.role === "ADMIN"
                          ? "CUSTOMER"
                          : viewUser.role === "VENDOR"
                          ? "CUSTOMER"
                          : "VENDOR",
                    });
                  }}
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Change Role
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setViewUser(null);
                    setDeleteUser(viewUser);
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Role Change Dialog */}
      <Dialog
        open={!!roleChangeUser}
        onOpenChange={() => setRoleChangeUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Change the role for{" "}
              {roleChangeUser?.user.name || roleChangeUser?.user.email}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Select
              value={roleChangeUser?.newRole}
              onValueChange={(value) =>
                setRoleChangeUser((prev) =>
                  prev ? { ...prev, newRole: value as UserRole } : null
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-red-500" />
                    Admin
                  </div>
                </SelectItem>
                <SelectItem value="VENDOR">
                  <div className="flex items-center gap-2">
                    <Store className="h-4 w-4 text-blue-500" />
                    Vendor
                  </div>
                </SelectItem>
                <SelectItem value="CUSTOMER">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    Customer
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoleChangeUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleChange}
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={() => setDeleteUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-medium">
                {deleteUser?.name || deleteUser?.email}
              </span>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deleteUserMutation.isPending}
            >
              {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
