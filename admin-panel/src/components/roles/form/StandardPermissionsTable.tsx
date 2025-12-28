import { Checkbox } from "@/components/elements/Checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/elements/Table";
import { Shield } from "lucide-react";
import { getPermissionTranslation } from "@/core/messages/permissions";
import { useMemo } from "react";
import type { ReactElement } from "react";

interface Permission {
  id: number;
  resource: string;
  action: string;
  display_name: string;
  requires_superadmin?: boolean;
  original_key?: string;
}

interface Resource {
  resource: string;
  display_name: string;
  permissions: Permission[];
}

interface StandardPermissionsTableProps {
  resources: Resource[];
  selectedPermissions: number[];
  isSuperAdmin: boolean;
  logicalPermissionErrors: string[];
  onTogglePermission: (permissionId: number) => void;
  onToggleAllResourcePermissions: (resourcePermissions: Permission[]) => void;
  onToggleAllStandardPermissions: (checked: boolean, permissionIds: number[]) => void;
  isPermissionSelected: (permissionId: number | undefined) => boolean;
  areAllResourcePermissionsSelected: (resourcePermissions: Permission[]) => boolean;
  getActionPermission: (resourcePermissions: Permission[], action: string) => Permission | undefined;
  getResourceIcon: (resourceKey: string) => ReactElement;
  allPermissions?: Permission[];
}

export function StandardPermissionsTable({
  resources,
  selectedPermissions,
  isSuperAdmin,
  logicalPermissionErrors,
  onTogglePermission,
  onToggleAllResourcePermissions,
  onToggleAllStandardPermissions,
  isPermissionSelected,
  areAllResourcePermissionsSelected,
  getActionPermission,
  getResourceIcon,
  allPermissions = [],
}: StandardPermissionsTableProps) {
  // بررسی اینکه آیا admin.manage انتخاب شده است
  const isAdminManageSelected = useMemo(() => {
    const adminManagePerm = allPermissions.find((p: any) => {
      const pKey = (p as any).original_key || `${(p as any).resource || ''}.${(p as any).action || ''}`;
      return pKey === 'admin.manage' || ((p as any).resource === 'admin' && (p as any).action?.toLowerCase() === 'manage');
    });
    return adminManagePerm ? isPermissionSelected(adminManagePerm.id) : false;
  }, [allPermissions, isPermissionSelected, selectedPermissions]);
  if (resources.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                onCheckedChange={(checked) => {
                  const permissionIds = resources.flatMap(
                    (resource) => resource.permissions.map((p) => p.id)
                  );
                  onToggleAllStandardPermissions(checked === true, permissionIds);
                }}
              />
            </TableHead>
            <TableHead>منبع</TableHead>
            <TableHead className="text-center">مشاهده</TableHead>
            <TableHead className="text-center">ایجاد</TableHead>
            <TableHead className="text-center">ویرایش</TableHead>
            <TableHead className="text-center">حذف</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => {
            const viewPerm = getActionPermission(resource.permissions, "view");
            const createPerm = getActionPermission(resource.permissions, "create");
            const editPerm = getActionPermission(resource.permissions, "edit");
            const deletePerm = getActionPermission(resource.permissions, "delete");
            const hasError = logicalPermissionErrors.includes(resource.resource);

            return (
              <TableRow key={resource.resource}>
                <TableCell>
                  <Checkbox
                    checked={areAllResourcePermissionsSelected(resource.permissions)}
                    onCheckedChange={() =>
                      onToggleAllResourcePermissions(resource.permissions)
                    }
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    {getResourceIcon(resource.resource)}
                    {getPermissionTranslation(resource.display_name, "resource")}
                  </div>
                </TableCell>
                <TableCell className="text-center relative">
                  {viewPerm ? (
                    <div className="flex justify-center relative group">
                      <div className="relative">
                        <Checkbox
                          checked={isPermissionSelected(viewPerm.id)}
                          disabled={
                            (!isSuperAdmin && viewPerm.requires_superadmin) ||
                            (resource.resource === 'admin' && isAdminManageSelected)
                          }
                          onCheckedChange={() => {
                            if (
                              (isSuperAdmin || !viewPerm.requires_superadmin) &&
                              !(resource.resource === 'admin' && isAdminManageSelected)
                            ) {
                              onTogglePermission(viewPerm.id);
                            }
                          }}
                          className={
                            hasError
                              ? "border-amber-1 data-[state=unchecked]:bg-amber"
                              : ""
                          }
                        />
                        {hasError && (
                          <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 pointer-events-none">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-1 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-1 border-2 border-white"></span>
                          </span>
                        )}
                      </div>
                      {viewPerm.requires_superadmin && (
                        <div
                          className="absolute -top-2 -right-3 text-amber-500"
                          title="نیازمند دسترسی سوپر ادمین"
                        >
                          <Shield className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center">
                      <span className="text-sm text-font-s">-</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  {resource.resource === 'ticket' ? (
                    <div className="flex justify-center">
                      <span className="text-sm text-font-s">-</span>
                    </div>
                  ) : (
                    <div className="flex justify-center relative group">
                      <Checkbox
                        checked={isPermissionSelected(createPerm?.id)}
                        disabled={
                          (!isSuperAdmin && createPerm?.requires_superadmin) ||
                          (resource.resource === 'admin' && isAdminManageSelected)
                        }
                        onCheckedChange={() => {
                          if (
                            createPerm &&
                            (isSuperAdmin || !createPerm.requires_superadmin) &&
                            !(resource.resource === 'admin' && isAdminManageSelected)
                          ) {
                            onTogglePermission(createPerm.id);
                          }
                        }}
                      />
                      {createPerm?.requires_superadmin && (
                        <div
                          className="absolute -top-2 -right-3 text-amber-500"
                          title="نیازمند دسترسی سوپر ادمین"
                        >
                          <Shield className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center relative group">
                    <Checkbox
                      checked={isPermissionSelected(editPerm?.id)}
                      disabled={
                        (!isSuperAdmin && editPerm?.requires_superadmin) ||
                        (resource.resource === 'admin' && isAdminManageSelected)
                      }
                      onCheckedChange={() => {
                        if (
                          editPerm &&
                          (isSuperAdmin || !editPerm.requires_superadmin) &&
                          !(resource.resource === 'admin' && isAdminManageSelected)
                        ) {
                          onTogglePermission(editPerm.id);
                        }
                      }}
                    />
                    {editPerm?.requires_superadmin && (
                      <div
                        className="absolute -top-2 -right-3 text-amber-500"
                        title="نیازمند دسترسی سوپر ادمین"
                      >
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center relative group">
                    <Checkbox
                      checked={isPermissionSelected(deletePerm?.id)}
                      disabled={
                        (!isSuperAdmin && deletePerm?.requires_superadmin) ||
                        (resource.resource === 'admin' && isAdminManageSelected)
                      }
                      onCheckedChange={() => {
                        if (
                          deletePerm &&
                          (isSuperAdmin || !deletePerm.requires_superadmin) &&
                          !(resource.resource === 'admin' && isAdminManageSelected)
                        ) {
                          onTogglePermission(deletePerm.id);
                        }
                      }}
                    />
                    {deletePerm?.requires_superadmin && (
                      <div
                        className="absolute -top-2 -right-3 text-amber-500"
                        title="نیازمند دسترسی سوپر ادمین"
                      >
                        <Shield className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

