import { useEffect, useState } from "react";
import { roleApi } from "@/api/admins/roles/roles";
import type { Role } from "@/types/auth/permission";
import { showError } from "@/core/toast";

export function useAdminRolesOptions() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [rolesError, setRolesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      setRolesError(null);
      try {
        const fetchedRoles = await roleApi.getAllRoles();
        setRoles(fetchedRoles);
      } catch (error) {
        setRolesError("بارگذاری نقش‌ها ناموفق بود.");
        showError(error, { customMessage: "بارگذاری نقش‌ها ناموفق بود" });
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  return {
    roles,
    loadingRoles,
    rolesError,
  };
}
