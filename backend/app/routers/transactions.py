from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from beanie import PydanticObjectId

from app.models.models import Transaction, AuditLog, User
from app.schemas.schemas import (
    TransactionCreate,
    TransactionUpdate,
    TransactionOut,
    TransactionListItem,
    TransactionStatusChange,
    AuditLogOut,
)
from app.services.aml_kyc import run_aml_kyc_check
from app.services.auth import get_current_user, require_shariat_or_admin

router = APIRouter(prefix="/transactions", tags=["transactions"])


async def _get_or_404(tx_id: str) -> Transaction:
    try:
        # Try finding by mongodb ObjectId or by string transaction_id or by id
        if PydanticObjectId.is_valid(tx_id):
            tx = await Transaction.get(PydanticObjectId(tx_id))
            if tx:
                return tx
        # try by transaction_id or string
        tx = await Transaction.find_one(Transaction.transaction_id == f"#{tx_id.replace('#', '').zfill(4)}")
        if tx:
            return tx
        tx = await Transaction.find_one(Transaction.transaction_id == tx_id)
        if tx:
            return tx
    except Exception:
        pass

    raise HTTPException(status_code=404, detail="Bitim topilmadi")


async def _add_audit(tx_id_str: str, action: str, actor: str,
                     comment: Optional[str] = None, actor_role: str = "user"):
    log = AuditLog(
        transaction_id=tx_id_str,
        action=action,
        actor=actor,
        actor_role=actor_role,
        comment=comment,
        timestamp=datetime.utcnow(),
    )
    await log.insert()


async def _serialize_tx(tx: Transaction) -> dict:
    logs = await AuditLog.find(AuditLog.transaction_id == str(tx.id)).sort("+timestamp").to_list()
    if not logs:
        logs = await AuditLog.find(AuditLog.transaction_id == tx.transaction_id).sort("+timestamp").to_list()

    logs_out = [
        {
            "id": str(l.id),
            "transaction_id": l.transaction_id,
            "action": l.action,
            "actor": l.actor,
            "actor_role": l.actor_role,
            "comment": l.comment,
            "timestamp": l.timestamp,
        }
        for l in logs
    ]

    return {
        "id": str(tx.id),
        "transaction_id": tx.transaction_id,
        "type": tx.type,
        "amount": tx.amount,
        "currency": tx.currency,
        "status": tx.status,
        "responsible_person": tx.responsible_person,
        "counterparty": tx.counterparty,
        "description": tx.description,
        "risk_score": tx.risk_score,
        "risk_details": tx.risk_details,
        "created_at": tx.created_at,
        "updated_at": tx.updated_at,
        "audit_logs": logs_out,
    }


@router.get("/", response_model=List[TransactionListItem])
async def list_transactions(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """Barcha bitimlar ro'yxati (Async Motor/Beanie)."""
    q = Transaction.find_all()
    if status:
        q = q.find(Transaction.status == status)
    if type:
        q = q.find(Transaction.type == type)

    txs = await q.sort("-created_at").skip(skip).limit(limit).to_list()
    return [
        {
            "id": str(t.id),
            "transaction_id": t.transaction_id,
            "type": t.type,
            "amount": t.amount,
            "currency": t.currency,
            "status": t.status,
            "responsible_person": t.responsible_person,
            "counterparty": t.counterparty,
            "risk_score": t.risk_score,
            "created_at": t.created_at,
        }
        for t in txs
    ]


@router.post("/", response_model=TransactionOut, status_code=201)
async def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(get_current_user),
):
    """Yangi bitim yaratish + avtomatik AML/KYC tekshiruvi (Async Beanie)."""
    resp_person = payload.responsible_person or current_user.full_name
    risk_score, risk_details = run_aml_kyc_check(
        payload.type, payload.amount, payload.counterparty
    )

    total_count = await Transaction.count()
    new_tx_num = total_count + 1
    tx_id_code = f"#{str(new_tx_num).zfill(4)}"

    tx = Transaction(
        transaction_id=tx_id_code,
        type=payload.type,
        amount=payload.amount,
        currency=payload.currency,
        responsible_person=resp_person,
        counterparty=payload.counterparty or "—",
        description=payload.description,
        risk_score=risk_score,
        risk_details=risk_details,
        status="pending",
    )
    await tx.insert()

    await _add_audit(
        tx_id_str=str(tx.id),
        action="created",
        actor=current_user.full_name,
        actor_role=current_user.role,
        comment=f"Bitim yaratildi. AML/KYC natija: {risk_score.upper()}",
    )

    return await _serialize_tx(tx)


@router.get("/{tx_id}", response_model=TransactionOut)
async def get_transaction(tx_id: str, current_user: User = Depends(get_current_user)):
    """Bitta bitim tafsiloti."""
    tx = await _get_or_404(tx_id)
    return await _serialize_tx(tx)


@router.patch("/{tx_id}", response_model=TransactionOut)
async def update_transaction(
    tx_id: str,
    payload: TransactionUpdate,
    current_user: User = Depends(get_current_user),
):
    """Bitim ma'lumotlarini yangilash."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "kutilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat 'pending' bitimlarni tahrirlash mumkin")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tx, field, value)

    if "amount" in update_data or "counterparty" in update_data:
        tx.risk_score, tx.risk_details = run_aml_kyc_check(
            tx.type, tx.amount, tx.counterparty
        )

    tx.updated_at = datetime.utcnow()
    await tx.save()
    return await _serialize_tx(tx)


@router.post("/{tx_id}/submit-review", response_model=TransactionOut)
async def submit_for_review(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(get_current_user),
):
    """Bitimni ko'rib chiqishga yuborish: pending → reviewing."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "kutilmoqda"):
        raise HTTPException(status_code=400, detail=f"Joriy holat '{tx.status}' — ko'rib chiqishga yuborib bo'lmaydi")

    tx.status = "reviewing"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    actor_name = payload.actor or current_user.full_name
    await _add_audit(str(tx.id), "submitted_for_review", actor_name, payload.comment, current_user.role)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/approve", response_model=TransactionOut)
async def approve_transaction(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(require_shariat_or_admin),
):
    """Bitimni Shariat kengashi tomonidan tasdiqlash: reviewing → approved."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("pending", "reviewing", "kutilmoqda", "korib_chiqilmoqda"):
        raise HTTPException(status_code=400, detail=f"Joriy holat '{tx.status}' — tasdiqlab bo'lmaydi")

    tx.status = "approved"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    actor_name = payload.actor or current_user.full_name
    await _add_audit(str(tx.id), "approved", actor_name, payload.comment or "Tasdiqlandi", current_user.role)
    return await _serialize_tx(tx)


@router.post("/{tx_id}/reject", response_model=TransactionOut)
async def reject_transaction(
    tx_id: str,
    payload: TransactionStatusChange,
    current_user: User = Depends(require_shariat_or_admin),
):
    """Bitimni rad etish."""
    tx = await _get_or_404(tx_id)
    if tx.status not in ("reviewing", "pending", "korib_chiqilmoqda", "kutilmoqda"):
        raise HTTPException(status_code=400, detail=f"Joriy holat '{tx.status}' — rad etib bo'lmaydi")

    tx.status = "rejected"
    tx.updated_at = datetime.utcnow()
    await tx.save()

    actor_name = payload.actor or current_user.full_name
    await _add_audit(str(tx.id), "rejected", actor_name, payload.comment or "Rad etildi", current_user.role)
    return await _serialize_tx(tx)


@router.get("/{tx_id}/audit-log", response_model=List[AuditLogOut])
async def get_audit_log(tx_id: str, current_user: User = Depends(get_current_user)):
    """Bitimning to'liq audit log tarixi."""
    tx = await _get_or_404(tx_id)
    logs = await AuditLog.find(AuditLog.transaction_id == str(tx.id)).sort("+timestamp").to_list()
    if not logs:
        logs = await AuditLog.find(AuditLog.transaction_id == tx.transaction_id).sort("+timestamp").to_list()

    return [
        {
            "id": str(l.id),
            "transaction_id": l.transaction_id,
            "action": l.action,
            "actor": l.actor,
            "actor_role": l.actor_role,
            "comment": l.comment,
            "timestamp": l.timestamp,
        }
        for l in logs
    ]


@router.get("/stats/summary")
async def get_stats(current_user: User = Depends(get_current_user)):
    """Dashboard uchun asosiy statistika."""
    total = await Transaction.count()
    pending = await Transaction.find_all().find({"status": {"$in": ["pending", "kutilmoqda"]}}).count()
    reviewing = await Transaction.find_all().find({"status": {"$in": ["reviewing", "korib_chiqilmoqda"]}}).count()
    approved = await Transaction.find_all().find({"status": {"$in": ["approved", "tasdiqlangan"]}}).count()
    rejected = await Transaction.find_all().find({"status": {"$in": ["rejected", "rad_etilgan"]}}).count()

    high_risk = await Transaction.find_all().find({"risk_score": {"$in": ["high", "yuqori"]}}).count()
    medium_risk = await Transaction.find_all().find({"risk_score": {"$in": ["medium", "orta"]}}).count()
    low_risk = await Transaction.find_all().find({"risk_score": {"$in": ["low", "past"]}}).count()

    approved_txs = await Transaction.find_all().find({"status": {"$in": ["approved", "tasdiqlangan"]}}).to_list()
    approved_volume = sum(t.amount for t in approved_txs)

    return {
        "total": total,
        "by_status": {
            "pending": pending,
            "reviewing": reviewing,
            "approved": approved,
            "rejected": rejected,
        },
        "by_risk": {
            "high": high_risk,
            "medium": medium_risk,
            "low": low_risk,
        },
        "approved_volume_uzs": approved_volume,
    }
