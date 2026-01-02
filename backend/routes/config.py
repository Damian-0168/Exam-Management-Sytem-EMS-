from fastapi import APIRouter, HTTPException
from typing import Optional
from models import SystemConfigUpdate, APIResponse
from database import get_db
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/config", tags=["System Configuration"])

@router.get("/school/{school_id}", response_model=APIResponse)
async def get_school_config(school_id: str, config_key: Optional[str] = None):
    """Get system configuration for a school"""
    try:
        db = get_db()
        
        query = db.table('system_config')\
            .select('*')\
            .eq('school_id', school_id)
        
        if config_key:
            query = query.eq('config_key', config_key)
            result = query.single().execute()
            data = result.data
        else:
            result = query.execute()
            data = result.data
        
        return APIResponse(
            success=True,
            data=data,
            message="Configuration retrieved successfully"
        )
        
    except Exception as e:
        logger.error(f"Error getting school config: {str(e)}")
        # Return empty config if not found
        return APIResponse(
            success=True,
            data={} if config_key else [],
            message="No configuration found"
        )

@router.post("/update", response_model=APIResponse)
async def update_school_config(config: SystemConfigUpdate, user_id: Optional[str] = None):
    """Update or create system configuration"""
    try:
        db = get_db()
        
        config_data = {
            "school_id": config.school_id,
            "config_key": config.config_key,
            "config_value": config.config_value,
            "description": config.description,
            "updated_by": user_id
        }
        
        # Upsert (update if exists, insert if not)
        result = db.table('system_config')\
            .upsert(config_data, on_conflict='school_id,config_key')\
            .execute()
        
        return APIResponse(
            success=True,
            data=result.data,
            message="Configuration updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating school config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/school/{school_id}/{config_key}", response_model=APIResponse)
async def delete_school_config(school_id: str, config_key: str):
    """Delete a configuration key"""
    try:
        db = get_db()
        
        result = db.table('system_config')\
            .delete()\
            .eq('school_id', school_id)\
            .eq('config_key', config_key)\
            .execute()
        
        return APIResponse(
            success=True,
            message="Configuration deleted successfully"
        )
        
    except Exception as e:
        logger.error(f"Error deleting school config: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
