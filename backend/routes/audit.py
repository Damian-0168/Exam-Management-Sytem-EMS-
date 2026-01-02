from fastapi import APIRouter, HTTPException, Depends, Request, Header
from typing import Optional, List
from models import (
    AuditLogCreate, AuditLog, APIResponse,
    ActionType, ResourceType
)
from database import get_db
from utils.audit_logger import AuditLogger
import logging
from datetime import datetime

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/audit", tags=["Audit Logs"])

@router.post("/log", response_model=APIResponse)
async def create_audit_log(
    log_data: AuditLogCreate,
    request: Request,
    user_agent: Optional[str] = Header(None)
):
    """Create a new audit log entry"""
    try:
        # Get IP address from request
        ip_address = log_data.ip_address or request.client.host
        
        success = await AuditLogger.log(
            action_type=log_data.action_type,
            resource_type=log_data.resource_type,
            user_id=log_data.user_id,
            user_email=log_data.user_email,
            resource_id=log_data.resource_id,
            resource_name=log_data.resource_name,
            details=log_data.details,
            ip_address=ip_address,
            user_agent=user_agent,
            school_id=log_data.school_id
        )
        
        if success:
            return APIResponse(
                success=True,
                message="Audit log created successfully"
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to create audit log")
            
    except Exception as e:
        logger.error(f"Error in create_audit_log: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/logs", response_model=APIResponse)
async def get_audit_logs(
    school_id: Optional[str] = None,
    user_id: Optional[str] = None,
    action_type: Optional[str] = None,
    resource_type: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """Get audit logs with filters"""
    try:
        db = get_db()
        query = db.table('audit_logs').select('*')
        
        # Apply filters
        if school_id:
            query = query.eq('school_id', school_id)
        if user_id:
            query = query.eq('user_id', user_id)
        if action_type:
            query = query.eq('action_type', action_type)
        if resource_type:
            query = query.eq('resource_type', resource_type)
        if start_date:
            query = query.gte('created_at', start_date)
        if end_date:
            query = query.lte('created_at', end_date)
        
        # Order by created_at descending
        query = query.order('created_at', desc=True)
        
        # Apply pagination
        query = query.range(offset, offset + limit - 1)
        
        result = query.execute()
        
        return APIResponse(
            success=True,
            data=result.data,
            message=f"Retrieved {len(result.data)} audit logs"
        )
        
    except Exception as e:
        logger.error(f"Error in get_audit_logs: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stats", response_model=APIResponse)
async def get_audit_stats(
    school_id: Optional[str] = None,
    days: int = 30
):
    """Get audit log statistics"""
    try:
        db = get_db()
        
        # This is a simplified version - for complex stats, you might want to use Supabase functions
        query = db.table('audit_logs').select('action_type, resource_type')
        
        if school_id:
            query = query.eq('school_id', school_id)
        
        result = query.execute()
        
        # Calculate basic stats
        stats = {
            "total_logs": len(result.data),
            "by_action": {},
            "by_resource": {}
        }
        
        for log in result.data:
            action = log.get('action_type', 'unknown')
            resource = log.get('resource_type', 'unknown')
            
            stats["by_action"][action] = stats["by_action"].get(action, 0) + 1
            stats["by_resource"][resource] = stats["by_resource"].get(resource, 0) + 1
        
        return APIResponse(
            success=True,
            data=stats,
            message="Statistics retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error in get_audit_stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
