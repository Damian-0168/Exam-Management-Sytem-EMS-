from database import get_db
from models import AuditLogCreate, ActionType, ResourceType
import logging
from datetime import datetime
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class AuditLogger:
    """Utility class for logging audit events"""
    
    @staticmethod
    async def log(
        action_type: ActionType,
        resource_type: ResourceType,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        resource_name: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        school_id: Optional[str] = None
    ) -> bool:
        """Log an audit event to the database"""
        try:
            db = get_db()
            
            audit_data = {
                "user_id": user_id,
                "user_email": user_email,
                "action_type": action_type.value if isinstance(action_type, ActionType) else action_type,
                "resource_type": resource_type.value if isinstance(resource_type, ResourceType) else resource_type,
                "resource_id": resource_id,
                "resource_name": resource_name,
                "details": details,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "school_id": school_id,
                "created_at": datetime.utcnow().isoformat()
            }
            
            result = db.table('audit_logs').insert(audit_data).execute()
            
            if result.data:
                logger.info(f"Audit log created: {action_type.value} on {resource_type.value}")
                return True
            else:
                logger.error(f"Failed to create audit log: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Error creating audit log: {str(e)}")
            return False
    
    @staticmethod
    async def log_pdf_view(
        user_id: str,
        user_email: str,
        pdf_path: str,
        exam_subject_id: str,
        ip_address: Optional[str] = None,
        school_id: Optional[str] = None
    ):
        """Convenience method for logging PDF views"""
        await AuditLogger.log(
            action_type=ActionType.VIEW,
            resource_type=ResourceType.PDF,
            user_id=user_id,
            user_email=user_email,
            resource_id=exam_subject_id,
            resource_name=pdf_path,
            ip_address=ip_address,
            school_id=school_id,
            details={"file_path": pdf_path}
        )
    
    @staticmethod
    async def log_pdf_download(
        user_id: str,
        user_email: str,
        pdf_path: str,
        exam_subject_id: str,
        ip_address: Optional[str] = None,
        school_id: Optional[str] = None
    ):
        """Convenience method for logging PDF downloads"""
        await AuditLogger.log(
            action_type=ActionType.DOWNLOAD,
            resource_type=ResourceType.PDF,
            user_id=user_id,
            user_email=user_email,
            resource_id=exam_subject_id,
            resource_name=pdf_path,
            ip_address=ip_address,
            school_id=school_id,
            details={"file_path": pdf_path}
        )
