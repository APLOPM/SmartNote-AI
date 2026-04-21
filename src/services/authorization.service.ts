export type PermissionCode = string

export interface PermissionContext {
  userId: string
  workspaceId: string
  permissions: PermissionCode[]
  resource?: ResourceAttributes
}

export interface ResourceAttributes {
  ownerUserId?: string
  projectId?: string
  [key: string]: unknown
}

export interface PolicyCondition {
  anyOf?: PolicyCondition[]
  allOf?: PolicyCondition[]
  permission?: PermissionCode
  isOwner?: boolean
  projectIdIn?: string[]
}

/**
 * Service-layer authorization helper.
 *
 * RBAC: validate that a permission exists in the caller's effective permissions
 * ABAC: optionally evaluate resource attributes (e.g. owner, project scope)
 */
export class AuthorizationService {
  hasPermission(context: PermissionContext, permission: PermissionCode): boolean {
    return context.permissions.includes(permission)
  }

  evaluatePolicy(context: PermissionContext, condition: PolicyCondition): boolean {
    if (condition.permission && !this.hasPermission(context, condition.permission)) {
      return false
    }

    if (condition.isOwner) {
      const ownerId = context.resource?.ownerUserId
      if (!ownerId || ownerId !== context.userId) {
        return false
      }
    }

    if (condition.projectIdIn && condition.projectIdIn.length > 0) {
      const projectId = context.resource?.projectId
      if (!projectId || !condition.projectIdIn.includes(projectId)) {
        return false
      }
    }

    if (condition.allOf && condition.allOf.length > 0) {
      return condition.allOf.every((rule) => this.evaluatePolicy(context, rule))
    }

    if (condition.anyOf && condition.anyOf.length > 0) {
      return condition.anyOf.some((rule) => this.evaluatePolicy(context, rule))
    }

    return true
  }
}
