'use client';

/**
 * Fully client-side hook for filtering navigation items based on RBAC
 *
 * This hook uses Supabase to check user authentication and permissions.
 * For now, we return all items as Supabase doesn't have built-in organization support.
 * You can extend this to check user metadata or custom permissions.
 *
 * Performance:
 * - All checks are synchronous (no server calls)
 * - Instant filtering
 * - No loading states
 * - No UI flashing
 *
 * Note: For actual security (API routes, server actions), always use server-side checks.
 * This is only for UI visibility.
 */

import { useMemo, useEffect, useState } from 'react';
import { createSupabaseClient } from '@/lib/supabase/client';
import type { NavItem } from '@/types';
import type { User } from '@supabase/supabase-js';

/**
 * Hook to filter navigation items based on RBAC (fully client-side)
 *
 * @param items - Array of navigation items to filter
 * @returns Filtered items
 */
export function useFilteredNavItems(items: NavItem[]) {
  const [user, setUser] = useState<User | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user }
      } = await supabase.auth.getUser();
      setUser(user);
    };

    getUser();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  // Memoize context and permissions
  // Note: Supabase doesn't have built-in organizations/permissions like Clerk
  // You can extend this by storing permissions in user_metadata or a separate table
  const accessContext = useMemo(() => {
    // For now, we'll return a simplified context
    // You can extend this to check user_metadata for permissions/roles
    const userMetadata = user?.user_metadata || {};
    const permissions = userMetadata.permissions || [];
    const role = userMetadata.role;

    return {
      user: user ?? undefined,
      permissions: permissions as string[],
      role: role ?? undefined,
      hasOrg: false // Supabase doesn't have built-in organizations
    };
  }, [user?.id, user?.user_metadata]);

  // Filter items synchronously (all client-side)
  // Note: Since Supabase doesn't have built-in organizations, we'll show all items
  // that don't require an organization. Items requiring orgs will be hidden.
  // You can extend this by implementing custom permission checks via user_metadata
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // No access restrictions - show to everyone
        if (!item.access) {
          return true;
        }

        // Hide items that require an organization (Supabase doesn't have built-in orgs)
        if (item.access.requireOrg) {
          return false;
        }

        // Check permission (if user has permissions in metadata)
        if (item.access.permission) {
          if (accessContext.permissions.length === 0) {
            // No permissions defined, show item (can be restricted later)
            return true;
          }
          if (!accessContext.permissions.includes(item.access.permission)) {
            return false;
          }
        }

        // Check role (if user has role in metadata)
        if (item.access.role) {
          if (!accessContext.role) {
            // No role defined, hide item
            return false;
          }
          if (accessContext.role !== item.access.role) {
            return false;
          }
        }

        // Plan/feature checks - show for now, page-level protection should handle it
        if (item.access.plan || item.access.feature) {
          // For navigation visibility, we'll show it
          // Page-level protection should handle actual access control
          return true;
        }

        return true;
      })
      .map((item) => {
        // Recursively filter child items
        if (item.items && item.items.length > 0) {
          const filteredChildren = item.items.filter((childItem) => {
            // No access restrictions
            if (!childItem.access) {
              return true;
            }

            // Hide items that require an organization
            if (childItem.access.requireOrg) {
              return false;
            }

            // Check permission
            if (childItem.access.permission) {
              if (accessContext.permissions.length === 0) {
                return true;
              }
              if (
                !accessContext.permissions.includes(childItem.access.permission)
              ) {
                return false;
              }
            }

            // Check role
            if (childItem.access.role) {
              if (!accessContext.role) {
                return false;
              }
              if (accessContext.role !== childItem.access.role) {
                return false;
              }
            }

            // Plan/feature checks
            if (childItem.access.plan || childItem.access.feature) {
              return true;
            }

            return true;
          });

          return {
            ...item,
            items: filteredChildren
          };
        }

        return item;
      });
  }, [items, accessContext]);

  return filteredItems;
}
