from datetime import datetime, timedelta
from typing import List, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query

from app.models.models import Transaction, User
from app.routers.transactions import (
    _add_audit,
    _get_or_404,
    _save_transaction,
    _serialize_tx,
)
from app.schemas.schemas import TransactionOut, TransactionStatusChange
from app.services.auth import require_shariat_or_admin, require_writer


router = APIRouter(prefix="/workflow", tags=["workflow"])
WorkflowStatus = Literal["pending", "reviewing", "approved", "rejected"]


@router.get("/queue", response_model=List[TransactionOut])
async def get_workflow_queue(
    status: Optional[WorkflowStatus] = Query(default=None),
    current_user: User = Depends(require_shariat_or_admin),
):
    status_map = {
        "pending": ["pending", "kutilmoqda"],
        "reviewing": ["reviewing", "korib_chiqilmoqda"],
        "approved": ["approved", "tasdiqlangan"],
        "rejected": ["rejected", "rad_etilgan"],
    }
    allowed = (
        status_map[status]
        if status
        else ["pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"]
    )
    txs = await Transaction.find(
        {
            "tenant_id": current_user.tenant_id,
            "status": {"$in": allowed},
        }
    ).sort("+created_at").to_list()
    return [await _serialize_tx(tx) for tx in txs]


@router.get("/queue/{tx_id}", response_model=TransactionOut)
async def get_workflow_item(
    tx_id: str,
    current_user: User = Depends(require_shariat_or_admin),
):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/send-review", response_model=TransactionOut)
async def send_to_review(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(require_writer),
):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    if tx.status not in ("pending", "kutilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat pending bitim review'ga yuboriladi")

    tx.status = "reviewing"
    tx.updated_at = datetime.utcnow()
    await _save_transaction(tx)
    await _add_audit(
        current_user.tenant_id,
        str(tx.id),
        "submitted_for_review",
        current_user.full_name,
        payload.comment or "Shariat kengashiga ko'rib chiqish uchun yuborildi",
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.post("/{tx_id}/approve", response_model=TransactionOut)
async def approve_workflow(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(require_shariat_or_admin),
):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    if tx.status not in ("reviewing", "korib_chiqilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat reviewing bitim tasdiqlanadi")

    tx.status = "approved"
    tx.updated_at = datetime.utcnow()
    await _save_transaction(tx)
    await _add_audit(
        current_user.tenant_id,
        str(tx.id),
        "approved",
        current_user.full_name,
        payload.comment or "Shariat talablariga muvofiq tasdiqlandi",
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.post("/{tx_id}/reject", response_model=TransactionOut)
async def reject_workflow(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(require_shariat_or_admin),
):
    if not payload.comment or not payload.comment.strip():
        raise HTTPException(status_code=400, detail="Rad etish sababi majburiy")

    tx = await _get_or_404(tx_id, current_user.tenant_id)
    if tx.status not in ("reviewing", "korib_chiqilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat reviewing bitim rad etiladi")

    tx.status = "rejected"
    tx.updated_at = datetime.utcnow()
    await _save_transaction(tx)
    await _add_audit(
        current_user.tenant_id,
        str(tx.id),
        "rejected",
        current_user.full_name,
        payload.comment.strip(),
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.get("/stats")
async def get_workflow_stats(
    current_user: User = Depends(require_shariat_or_admin),
):
    tenant_filter = {"tenant_id": current_user.tenant_id}

    async def count_status(*values: str) -> int:
        return await Transaction.find(
            {**tenant_filter, "status": {"$in": list(values)}}
        ).count()

    threshold = datetime.utcnow() - timedelta(hours=48)
    overdue = await Transaction.find(
        {
            **tenant_filter,
            "status": {
                "$in": [
                    "pending",
                    "reviewing",
                    "kutilmoqda",
                    "korib_chiqilmoqda",
                ]
            },
            "created_at": {"$lte": threshold},
        }
    ).count()

    return {
        "pending": await count_status("pending", "kutilmoqda"),
        "reviewing": await count_status("reviewing", "korib_chiqilmoqda"),
        "approved": await count_status("approved", "tasdiqlangan"),
        "rejected": await count_status("rejected", "rad_etilgan"),
        "overdue": overdue,
    }
