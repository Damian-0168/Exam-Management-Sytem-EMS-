from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional
from models import SignedUrlRequest, SignedUrlResponse, APIResponse
from database import get_db
from config import settings
from utils.audit_logger import AuditLogger
from models import ActionType, ResourceType
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/storage", tags=["Storage"])

@router.post("/signed-url", response_model=APIResponse)
async def get_signed_url(
    request: SignedUrlRequest,
    user_id: Optional[str] = Header(None),
    user_email: Optional[str] = Header(None),
    school_id: Optional[str] = Header(None)
):
    """Generate a signed URL for secure PDF access"""
    try:
        db = get_db()
        
        # Generate signed URL using Supabase Storage
        result = db.storage.from_(settings.storage_bucket_name).create_signed_url(
            request.file_path,
            request.expiration_seconds or settings.signed_url_expiration_seconds
        )
        
        if not result:
            raise HTTPException(status_code=404, detail="File not found")
        
        signed_url = result.get('signedURL')
        
        if not signed_url:
            raise HTTPException(status_code=500, detail="Failed to generate signed URL")
        
        # Log the access
        await AuditLogger.log(
            action_type=ActionType.VIEW,
            resource_type=ResourceType.PDF,
            user_id=user_id,
            user_email=user_email,
            resource_name=request.file_path,
            school_id=school_id,
            details={"file_path": request.file_path, "expiration_seconds": request.expiration_seconds}
        )
        
        expires_at = datetime.utcnow() + timedelta(seconds=request.expiration_seconds or settings.signed_url_expiration_seconds)
        
        return APIResponse(
            success=True,
            data={
                "signed_url": signed_url,
                "expires_at": expires_at.isoformat()
            },
            message="Signed URL generated successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating signed URL: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/log-download", response_model=APIResponse)
async def log_pdf_download(
    file_path: str,
    exam_subject_id: str,
    user_id: str,
    user_email: str,
    school_id: Optional[str] = None
):
    """Log a PDF download event"""
    try:
        await AuditLogger.log_pdf_download(
            user_id=user_id,
            user_email=user_email,
            pdf_path=file_path,
            exam_subject_id=exam_subject_id,
            school_id=school_id
        )
        
        return APIResponse(
            success=True,
            message="Download logged successfully"
        )
        
    except Exception as e:
        logger.error(f"Error logging download: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/file-versions/{exam_subject_id}", response_model=APIResponse)
async def get_file_versions(exam_subject_id: str):
    """Get version history for an exam subject PDF"""
    try:
        db = get_db()
        
        result = db.table('exam_file_versions')\
            .select('*')\
            .eq('exam_subject_id', exam_subject_id)\
            .order('created_at', desc=True)\
            .execute()
        
        return APIResponse(
            success=True,
            data=result.data,
            message=f"Retrieved {len(result.data)} versions"
        )
        
    except Exception as e:
        logger.error(f"Error getting file versions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
