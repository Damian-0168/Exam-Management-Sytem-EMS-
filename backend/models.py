from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Enums
class ActionType(str, Enum):
    LOGIN = "login"
    LOGOUT = "logout"
    UPLOAD = "upload"
    VIEW = "view"
    DOWNLOAD = "download"
    DELETE = "delete"
    CREATE = "create"
    UPDATE = "update"
    EXPORT = "export"

class ResourceType(str, Enum):
    PDF = "pdf"
    STUDENT = "student"
    EXAM = "exam"
    SCORE = "score"
    TEACHER = "teacher"
    REPORT = "report"
    SETTINGS = "settings"

class UserRole(str, Enum):
    SUPER_ADMIN = "super-admin"
    ADMIN = "admin"
    TEACHER = "teacher"
    VIEWER = "viewer"

# Request Models
class AuditLogCreate(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    action_type: ActionType
    resource_type: ResourceType
    resource_id: Optional[str] = None
    resource_name: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    school_id: Optional[str] = None

class SignedUrlRequest(BaseModel):
    file_path: str
    expiration_seconds: Optional[int] = 3600

class PDFUploadRequest(BaseModel):
    exam_subject_id: str
    file_name: str
    upload_notes: Optional[str] = None

class PermissionCheck(BaseModel):
    user_id: str
    permission_name: str

class SystemConfigUpdate(BaseModel):
    school_id: str
    config_key: str
    config_value: Dict[str, Any]
    description: Optional[str] = None

# Response Models
class AuditLog(BaseModel):
    id: str
    user_id: Optional[str]
    user_email: Optional[str]
    action_type: str
    resource_type: str
    resource_id: Optional[str]
    resource_name: Optional[str]
    details: Optional[Dict[str, Any]]
    ip_address: Optional[str]
    user_agent: Optional[str]
    school_id: Optional[str]
    created_at: datetime

class SignedUrlResponse(BaseModel):
    signed_url: str
    expires_at: datetime

class PermissionCheckResponse(BaseModel):
    has_permission: bool
    user_role: Optional[str] = None

class APIResponse(BaseModel):
    success: bool
    message: Optional[str] = None
    data: Optional[Any] = None
    error: Optional[str] = None
