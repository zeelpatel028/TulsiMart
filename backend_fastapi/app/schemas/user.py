from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class LoginRequest(BaseModel):
    username: str
    password: str
    otp: Optional[str] = None


class TokenResponse(BaseModel):
    access: str
    refresh: Optional[str] = None
    user: Dict[str, Any]
    require_otp: bool = False
    permissions: List[str] = Field(default_factory=list)


class OTPVerifyRequest(BaseModel):
    username: str
    otp: str


class LoginAccountCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: EmailStr
    role: str = "ADMIN"
    require_otp: bool = True


class LoginAccountUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    require_otp: Optional[bool] = None
    password: Optional[str] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class LoginAccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    full_name: str
    email: str
    role: str
    is_active: bool
    require_otp: bool
    created_at: datetime


class StaffCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: str = "CASHIER"
    salary: float = 0.00

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StaffUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    salary: Optional[float] = None
    is_active: Optional[bool] = None

    @field_validator("email", mode="before")
    @classmethod
    def empty_email_to_none(cls, v):
        if isinstance(v, str) and not v.strip():
            return None
        return v


class StaffResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: Optional[int] = None
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    role: str
    salary: float
    is_active: bool
    attendance_data: Optional[Dict[str, Any]] = None
    created_at: datetime
