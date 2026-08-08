from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.models import Transaction, AuditLog, User
from app.schemas.schemas import TransactionOut
from app.routers.transactions import _serialize_tx, _get_or_404, _add_audit
from app.services.auth import get_current_user, require_shariat_or_admin

router = APIRouter(prefix="/workflow", tags=["workflow"])


class WorkflowActionPayload(BaseModel):
    comment: Optional[str] = None


@router.get("/queue", response_model=List[TransactionOut])
async def get_workflow_queue(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Workflow navbatidagi barcha bitimlar (Async Motor/Beanie)."""
    q = Transaction.find_all()
    if status:
        # map status aliases if needed
        status_map = {
            "pending": ["pending", "kutilmoqda"],
            "reviewing": ["reviewing", "korib_chiqilmoqda"],
            "approved": ["approved", "tasdiqlangan"],
            "rejected": ["rejected", "rad_etilgan"],
        }
        allowed = status_map.get(status, [status])
        q = Transaction.find_all().find({"status": {"$in": allowed}})
    else:
        q = Transaction.find_all().find({"status": {"$in": ["pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"]}})

    txs = await q.sort("+created_at").to_list()
    res = []
    for tx in txs:
        res.append(await _serialize_tx(tx))
    return res


@router.get("/queue/{tx_id}", response_model=TransactionOut)
async def get_workflow_item(tx_id: str, current_user: User = Depends(get_current_user)):
    """Bitta bitim to'liq tafsiloti."""
    tx = await _get_or_404(tx_id)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/send-review", response_model=TransactionOut)
async def send_to_review(
    tx_id: str,
    payload: WorkflowActionPayload,
    current_user: User = Depends(get_current_user),
):
    """Bitimni 'reviewing' holatiga o'tkazish."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "kutilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat 'pending' bitimlarni ko'rib chiqishga o'tkazish mumkin")

    tx.status = "reviewing"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    comment_msg = payload.comment or "Shariat kengashiga ko'rib chiqish uchun yuborildi"
    await _add_audit(str(tx.id), "submitted_for_review", current_user.full_name, comment_msg, current_user.role)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/approve", response_model=TransactionOut)
async def approve_workflow(
    tx_id: str,
    payload: WorkflowActionPayload,
    current_user: User = Depends(require_shariat_or_admin),
):
    """Shariat kengashi tomonidan bitimni tasdiqlash."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"):
        raise HTTPException(status_code=400, detail="Ushbu bitim allaqachon yakunlangan")

    tx.status = "approved"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    comment_str = payload.comment if payload.comment and payload.comment.strip() else "Shariat talablariga muvofiq tasdiqlandi"
    actor_str = f"{current_user.full_name} ({current_user.bank_name or 'Amanat'})"
    await _add_audit(str(tx.id), "approved", actor_str, comment_str, current_user.role)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/reject", response_model=TransactionOut)
async def reject_workflow(
    tx_id: str,
    payload: WorkflowActionPayload,
    current_user: User = Depends(require_shariat_or_admin),
):
    """Shariat kengashi tomonidan bitimni rad etish (sabab majburiy)."""
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(status_code=400, detail="Rad etish uchun izoh/sabab majburiy!")

    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"):
        raise HTTPException(status_code=400, detail="Ushbu bitim allaqachon yakunlangan")

    tx.status = "rejected"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    actor_str = f"{current_user.full_name} ({current_user.bank_name or 'Amanat'})"
    await _add_audit(str(tx.id), "rejected", actor_str, payload.comment.strip(), current_user.role)
    return await _serialize_tx(tx)


@router.get("/stats")
async def get_workflow_stats(current_user: User = Depends(get_current_user)):
    """Workflow statistikasi (Async Motor/Beanie)."""
    pending = await Transaction.find_all().find({"status": {"$in": ["pending", "kutilmoqda"]}}).count()
    reviewing = await Transaction.find_all().find({"status": {"$in": ["reviewing", "korib_chiqilmoqda"]}}).count()
    approved = await Transaction.find_all().find({"status": {"$in": ["approved", "tasdiqlangan"]}}).count()
    rejected = await Transaction.find_all().find({"status": {"$in": ["rejected", "rad_etilgan"]}}).count()

    threshold = datetime.utcnow() - timedelta(hours=48)
    overdue = await Transaction.find_all().find({
        "status": {"$in": ["pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"]},
        "created_at": {"$lte": threshold}
    }).count()

    return {
        "pending": pending,
        "reviewing": reviewing,
        "approved": approved,
        "rejected": rejected,
        "overdue": overdue
    }
