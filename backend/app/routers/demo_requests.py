from fastapi import APIRouter, Depends, status

from app.models.models import DemoRequest, User
from app.schemas.schemas import DemoRequestCreate
from app.services.auth import require_admin


router = APIRouter(prefix="/demo-requests", tags=["demo-requests"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_demo_request(payload: DemoRequestCreate):
    request = DemoRequest(
        name=payload.name.strip(),
        bank_name=payload.bank_name.strip(),
        email=str(payload.email).lower(),
        phone=payload.phone.strip() if payload.phone else None,
        message=payload.message.strip() if payload.message else None,
    )
    await request.insert()
    return {"id": str(request.id), "status": request.status}


@router.get("")
async def list_demo_requests(current_user: User = Depends(require_admin)):
    requests = await DemoRequest.find_all().sort("-created_at").limit(100).to_list()
    return [
        {
            "id": str(item.id),
            "name": item.name,
            "bank_name": item.bank_name,
            "email": item.email,
            "phone": item.phone,
            "message": item.message,
            "status": item.status,
            "created_at": item.created_at,
        }
        for item in requests
    ]
