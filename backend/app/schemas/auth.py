import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    tenant_id: uuid.UUID
    email: str
    full_name: str
    role: str
    active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class TenantResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    plan: str
    max_yards: int
    max_containers: int
    max_forklifts: int

    model_config = {"from_attributes": True}


class MeResponse(BaseModel):
    user: UserResponse
    tenant: TenantResponse


class RegisterRequest(BaseModel):
    full_name: str
    company_name: str
    email: EmailStr
    password: str
