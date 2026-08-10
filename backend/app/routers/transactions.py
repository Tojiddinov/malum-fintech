from datetime import datetime
from typing import List, Literal, Optional

from beanie import PydanticObjectId
from beanie.exceptions import RevisionIdWasChanged
from fastapi import APIRouter, Depends, HTTPException, Query
from pymongo import ReturnDocument

from app.models.models import AuditLog, Sequence, Transaction, User
from app.schemas.schemas import (
    AuditLogOut,
    TransactionCreate,
    TransactionListItem,
    TransactionOut,
    TransactionStatusChange,
    TransactionUpdate,
)
from app.services.aml_kyc import run_aml_kyc_check
from app.services.auth import (
    get_current_user,
    require_shariat_or_admin,
    require_writer,
)


router = APIRouter(prefix="/transactions", tags=["transactions"])

StatusFilter = Literal["pending", "reviewing", "approved", "rejected"]
TypeFilter = Literal["Murabaha", "Musharaka"]


async def _get_or_404(tx_id: str, tenant_id: str) -> Transaction:
    if PydanticObjectId.is_valid(tx_id):
        tx = await Transaction.get(PydanticObjectId(tx_id))
        if tx and tx.tenant_id == tenant_id:
            return tx

    raw_id = tx_id.strip()
    candidates = {raw_id}
    number_part = raw_id.removeprefix("#")
    if number_part.isdigit():
        candidates.add(f"#{number_part.zfill(4)}")

    tx = await Transaction.find_one(
        {
            "tenant_id": tenant_id,
            "transaction_id": {"$in": list(candidates)},
        }
    )
    if tx:
        return tx

    raise HTTPException(status_code=404, detail="Bitim topilmadi")


async def _next_transaction_id(tenant_id: str) -> str:
    existing = await Transaction.find(
        Transaction.tenant_id == tenant_id
    ).to_list()
    highest_existing = max(
        (
            int(tx.transaction_id.removeprefix("#"))
            for tx in existing
            if tx.transaction_id.removeprefix("#").isdigit()
        ),
        default=0,
    )

    sequence = await Sequence.get_motor_collection().find_one_and_update(
        {"tenant_id": tenant_id, "name": "transaction"},
        [
            {
                "$set": {
                    "tenant_id": tenant_id,
                    "name": "transaction",
                    "value": {
                        "$add": [
                            {
                                "$max": [
                                    {"$ifNull": ["$value", 0]},
                                    highest_existing,
                                ]
                            },
                            1,
                        ]
                    },
                }
            }
        ],
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return f"#{int(sequence['value']):04d}"


async def _save_transaction(tx: Transaction) -> None:
    try:
        await tx.save()
    except RevisionIdWasChanged as exc:
        raise HTTPException(
            status_code=409,
            detail="Bitim boshqa foydalanuvchi tomonidan yangilandi. Sahifani yangilang.",
        ) from exc


async def _add_audit(
    tenant_id: str,
    tx_id_str: str,
    action: str,
    actor: str,
    comment: Optional[str] = None,
    actor_role: str = "user",
):
    log = AuditLog(
        tenant_id=tenant_id,
        transaction_id=tx_id_str,
        action=action,
        actor=actor,
        actor_role=actor_role,
        comment=comment,
        timestamp=datetime.utcnow(),
    )
    await log.insert()


async def _transaction_logs(tx: Transaction) -> list[AuditLog]:
    logs = await AuditLog.find(
        {
            "tenant_id": tx.tenant_id,
            "transaction_id": str(tx.id),
        }
    ).sort("+timestamp").to_list()
    if not logs:
        logs = await AuditLog.find(
            {
                "tenant_id": tx.tenant_id,
                "transaction_id": tx.transaction_id,
            }
        ).sort("+timestamp").to_list()
    return logs


async def _serialize_tx(tx: Transaction) -> dict:
    logs = await _transaction_logs(tx)
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
        "audit_logs": [
            {
                "id": str(log.id),
                "transaction_id": log.transaction_id,
                "action": log.action,
                "actor": log.actor,
                "actor_role": log.actor_role,
                "comment": log.comment,
                "timestamp": log.timestamp,
            }
            for log in logs
        ],
    }


@router.get("", response_model=List[TransactionListItem])
async def list_transactions(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    status: Optional[StatusFilter] = Query(default=None),
    type: Optional[TypeFilter] = Query(default=None),
    current_user: User = Depends(get_current_user),
):
    q = Transaction.find(Transaction.tenant_id == current_user.tenant_id)
    if status:
        q = q.find(Transaction.status == status)
    if type:
        q = q.find(Transaction.type == type)

    txs = await q.sort("-created_at").skip(skip).limit(limit).to_list()
    return [
        {
            "id": str(tx.id),
            "transaction_id": tx.transaction_id,
            "type": tx.type,
            "amount": tx.amount,
            "currency": tx.currency,
            "status": tx.status,
            "responsible_person": tx.responsible_person,
            "counterparty": tx.counterparty,
            "risk_score": tx.risk_score,
            "created_at": tx.created_at,
        }
        for tx in txs
    ]


@router.post("", response_model=TransactionOut, status_code=201)
async def create_transaction(
    payload: TransactionCreate,
    current_user: User = Depends(require_writer),
):
    responsible_person = payload.responsible_person or current_user.full_name
    risk_score, risk_details = run_aml_kyc_check(
        payload.type,
        payload.amount,
        payload.counterparty,
        payload.currency,
    )

    tx = Transaction(
        tenant_id=current_user.tenant_id,
        transaction_id=await _next_transaction_id(current_user.tenant_id),
        type=payload.type,
        amount=payload.amount,
        currency=payload.currency,
        responsible_person=responsible_person,
        counterparty=payload.counterparty or "—",
        description=payload.description,
        risk_score=risk_score,
        risk_details=risk_details,
        status="pending",
    )
    await tx.insert()

    await _add_audit(
        current_user.tenant_id,
        str(tx.id),
        "created",
        current_user.full_name,
        f"Bitim yaratildi. AML/KYC natija: {risk_score.upper()}",
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.get("/stats/summary")
async def get_stats(current_user: User = Depends(get_current_user)):
    tenant_filter = {"tenant_id": current_user.tenant_id}
    total = await Transaction.find(tenant_filter).count()

    async def count_status(*values: str) -> int:
        return await Transaction.find(
            {**tenant_filter, "status": {"$in": list(values)}}
        ).count()

    async def count_risk(*values: str) -> int:
        return await Transaction.find(
            {**tenant_filter, "risk_score": {"$in": list(values)}}
        ).count()

    approved_txs = await Transaction.find(
        {
            **tenant_filter,
            "status": {"$in": ["approved", "tasdiqlangan"]},
        }
    ).to_list()
    volume_by_currency = {
        currency: sum(tx.amount for tx in approved_txs if tx.currency == currency)
        for currency in ("UZS", "USD")
    }

    return {
        "total": total,
        "by_status": {
            "pending": await count_status("pending", "kutilmoqda"),
            "reviewing": await count_status("reviewing", "korib_chiqilmoqda"),
            "approved": await count_status("approved", "tasdiqlangan"),
            "rejected": await count_status("rejected", "rad_etilgan"),
        },
        "by_risk": {
            "high": await count_risk("high", "yuqori"),
            "medium": await count_risk("medium", "orta"),
            "low": await count_risk("low", "past"),
        },
        "approved_volume_uzs": volume_by_currency["UZS"],
        "approved_volume_by_currency": volume_by_currency,
    }


@router.get("/{tx_id}", response_model=TransactionOut)
async def get_transaction(tx_id: str, current_user: User = Depends(get_current_user)):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    return await _serialize_tx(tx)


@router.patch("/{tx_id}", response_model=TransactionOut)
async def update_transaction(
    tx_id: str,
    payload: TransactionUpdate,
    current_user: User = Depends(require_writer),
):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    if tx.status not in ("pending", "kutilmoqda"):
        raise HTTPException(status_code=400, detail="Faqat pending bitimlarni tahrirlash mumkin")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tx, field, value)

    if {"type", "amount", "counterparty", "currency"}.intersection(update_data):
        tx.risk_score, tx.risk_details = run_aml_kyc_check(
            tx.type,
            tx.amount,
            tx.counterparty,
            tx.currency,
        )

    tx.updated_at = datetime.utcnow()
    await _save_transaction(tx)
    await _add_audit(
        current_user.tenant_id,
        str(tx.id),
        "updated",
        current_user.full_name,
        "Bitim ma'lumotlari yangilandi",
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.post("/{tx_id}/submit-review", response_model=TransactionOut)
async def submit_for_review(
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
        payload.comment,
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.post("/{tx_id}/approve", response_model=TransactionOut)
async def approve_transaction(
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
        payload.comment or "Tasdiqlandi",
        current_user.role,
    )
    return await _serialize_tx(tx)


@router.post("/{tx_id}/reject", response_model=TransactionOut)
async def reject_transaction(
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


@router.get("/{tx_id}/audit-log", response_model=List[AuditLogOut])
async def get_audit_log(tx_id: str, current_user: User = Depends(get_current_user)):
    tx = await _get_or_404(tx_id, current_user.tenant_id)
    logs = await _transaction_logs(tx)
    return [
        {
            "id": str(log.id),
            "transaction_id": log.transaction_id,
            "action": log.action,
            "actor": log.actor,
            "actor_role": log.actor_role,
            "comment": log.comment,
            "timestamp": log.timestamp,
        }
        for log in logs
    ]
