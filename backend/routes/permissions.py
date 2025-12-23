from fastapi import APIRouter, HTTPException
from typing import List
from models import PermissionCheck, PermissionCheckResponse, APIResponse, UserRole
from database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/permissions", tags=["Permissions"])

@router.post("/check", response_model=APIResponse)
async def check_permission(request: PermissionCheck):
    """Check if a user has a specific permission"""
    try:
        db = get_db()
        
        # Get user's role from teacher_profiles
        user_result = db.table('teacher_profiles')\
            .select('role')\
            .eq('id', request.user_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_role = user_result.data.get('role')
        
        # Get permission ID
        permission_result = db.table('permissions')\
            .select('id')\
            .eq('name', request.permission_name)\
            .single()\
            .execute()
        
        if not permission_result.data:
            return APIResponse(
                success=True,
                data={
                    "has_permission": False,
                    "user_role": user_role,
                    "reason": "Permission not found"
                }
            )
        
        permission_id = permission_result.data.get('id')
        
        # Check if role has permission
        role_permission_result = db.table('role_permissions')\
            .select('id')\
            .eq('role', user_role)\
            .eq('permission_id', permission_id)\
            .execute()
        
        has_permission = len(role_permission_result.data) > 0
        
        return APIResponse(
            success=True,
            data={
                "has_permission": has_permission,
                "user_role": user_role
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking permission: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}", response_model=APIResponse)
async def get_user_permissions(user_id: str):
    """Get all permissions for a user based on their role"""
    try:
        db = get_db()
        
        # Get user's role
        user_result = db.table('teacher_profiles')\
            .select('role')\
            .eq('id', user_id)\
            .single()\
            .execute()
        
        if not user_result.data:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_role = user_result.data.get('role')
        
        # Get all permissions for this role
        result = db.table('role_permissions')\
            .select('permission_id, permissions(name, description, resource_type, action)')\
            .eq('role', user_role)\
            .execute()
        
        permissions = [item['permissions'] for item in result.data if item.get('permissions')]
        
        return APIResponse(
            success=True,
            data={
                "role": user_role,
                "permissions": permissions
            },
            message=f"Retrieved {len(permissions)} permissions"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user permissions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/roles", response_model=APIResponse)
async def get_all_roles():
    """Get all available roles and their permissions"""
    try:
        db = get_db()
        
        roles = [role.value for role in UserRole]
        role_data = {}
        
        for role in roles:
            result = db.table('role_permissions')\
                .select('permission_id, permissions(name, description)')\
                .eq('role', role)\
                .execute()
            
            permissions = [item['permissions'] for item in result.data if item.get('permissions')]
            role_data[role] = permissions
        
        return APIResponse(
            success=True,
            data=role_data,
            message=f"Retrieved {len(roles)} roles"
        )
        
    except Exception as e:
        logger.error(f"Error getting roles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
