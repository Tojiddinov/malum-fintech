import json
import os
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from beanie import PydanticObjectId
from pydantic import BaseModel

from app.models.models import Transaction, Report, User
from app.services.auth import get_current_user

# ReportLab imports for PDF
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

# OpenPyXL imports for Excel
import openpyxl
from openpyxl.styles import Font, PatternFill

router = APIRouter(prefix="/reports", tags=["reports"])

REPORTS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "generated_reports")
os.makedirs(REPORTS_DIR, exist_ok=True)


class ReportGenerateRequest(BaseModel):
    report_type: str  # transaction_summary | aml_risk_report | shariat_audit
    export_format: str  # pdf | excel
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    transaction_type: Optional[str] = None
    status: Optional[str] = None
    min_amount: Optional[float] = None


async def filter_transactions(req: ReportGenerateRequest) -> List[Transaction]:
    q = Transaction.find_all()
    if req.transaction_type:
        q = q.find(Transaction.type == req.transaction_type)
    if req.status:
        q = q.find(Transaction.status == req.status)
    if req.min_amount:
        q = q.find(Transaction.amount >= req.min_amount)
    if req.start_date:
        try:
            dt = datetime.strptime(req.start_date, "%Y-%m-%d")
            q = q.find(Transaction.created_at >= dt)
        except ValueError:
            pass
    if req.end_date:
        try:
            dt = datetime.strptime(req.end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            q = q.find(Transaction.created_at <= dt)
        except ValueError:
            pass
    return await q.sort("-created_at").to_list()


def generate_pdf_report(filename: str, req: ReportGenerateRequest, txs: List[Transaction], bank_name: str) -> str:
    file_path = os.path.join(REPORTS_DIR, filename)
    doc = SimpleDocTemplate(file_path, pagesize=A4, rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    story = []
    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle', parent=styles['Heading1'], fontSize=20, textColor=colors.HexColor('#1B4332'), spaceAfter=6
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#C9A227'), spaceAfter=15
    )

    report_titles = {
        "transaction_summary": "BITIMLAR XULOSASI HISOBOTI",
        "aml_risk_report": "AML / KYC RISK TAHLILI HISOBOTI",
        "shariat_audit": "SHARIAT KENGASHI AUDIT HISOBOTI",
    }

    title_text = report_titles.get(req.report_type, "AMANAT PLATFORMA HISOBOTI")
    story.append(Paragraph(f"<b>AMANAT</b> — {title_text}", title_style))
    story.append(Paragraph(f"Tashkilot: {bank_name} | Yaratilgan vaqt: {datetime.now().strftime('%Y-%m-%d %H:%M')}", subtitle_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#C9A227'), spaceAfter=15))

    total_count = len(txs)
    total_amount = sum(t.amount for t in txs)
    summary_data = [
        ["Jami bitimlar soni:", f"{total_count} ta", "Umumiy summa:", f"{total_amount:,.0f} UZS"],
    ]
    sum_table = Table(summary_data, colWidths=[120, 100, 120, 150])
    sum_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F4F6F4')),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#0F2D21')),
        ('FONTNAME', (0,0), (-1,-1), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,-1), 9),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(sum_table)
    story.append(Spacer(1, 15))

    headers = ["ID", "Tur", "Miqdor", "Kontragent", "Holat", "Risk", "Sana"]
    table_data = [headers]
    for t in txs:
        table_data.append([
            t.transaction_id,
            t.type,
            f"{t.amount:,.0f} {t.currency}",
            (t.counterparty or "—")[:20],
            t.status.upper(),
            (t.risk_score or "low").upper(),
            t.created_at.strftime("%Y-%m-%d"),
        ])

    tx_table = Table(table_data, colWidths=[50, 65, 100, 120, 75, 55, 65])
    tx_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#1B4332')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.HexColor('#FFFFFF')),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('FONTSIZE', (0,0), (-1,0), 9),
        ('ALIGN', (0,0), (-1,-1), 'LEFT'),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E0E0E0')),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F9FAF9')]),
        ('FONTSIZE', (0,1), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(tx_table)
    story.append(Spacer(1, 20))

    footer_style = ParagraphStyle(
        'DocFooter', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#6B7D67'), alignment=1
    )
    story.append(Paragraph("Ushbu hisobot Amanat platformasi tomonidan avtomatik yaratilgan.", footer_style))

    doc.build(story)
    return file_path


def generate_excel_report(filename: str, req: ReportGenerateRequest, txs: List[Transaction], bank_name: str) -> str:
    file_path = os.path.join(REPORTS_DIR, filename)
    wb = openpyxl.Workbook()

    ws1 = wb.active
    ws1.title = "Xulosa statistika"

    header_fill = PatternFill(start_color="1B4332", end_color="1B4332", fill_type="solid")
    header_font = Font(name="Calibri", size=12, bold=True, color="FFFFFF")
    title_font = Font(name="Calibri", size=14, bold=True, color="1B4332")

    ws1["A1"] = "AMANAT PLATFORMA HISOBOTI"
    ws1["A1"].font = title_font
    ws1["A2"] = f"Tashkilot: {bank_name} | Yaratilgan: {datetime.now().strftime('%Y-%m-%d %H:%M')}"

    ws1.append([])
    ws1.append(["Ko'rsatkich", "Qiymat"])
    for col in range(1, 3):
        cell = ws1.cell(row=4, column=col)
        cell.fill = header_fill
        cell.font = header_font

    ws1.append(["Jami bitimlar soni", len(txs)])
    ws1.append(["Umumiy hajm (UZS)", sum(t.amount for t in txs if t.currency == 'UZS')])
    ws1.append(["Tasdiqlangan bitimlar", sum(1 for t in txs if t.status in ('approved', 'tasdiqlangan'))])
    ws1.append(["Rad etilgan bitimlar", sum(1 for t in txs if t.status in ('rejected', 'rad_etilgan'))])

    ws2 = wb.create_sheet(title="To'liq bitimlar ro'yxati")
    headers = ["ID", "Tur", "Miqdor", "Valyuta", "Mas'ul shaxs", "Kontragent", "Holat", "Risk score", "Yaratilgan sana"]
    ws2.append(headers)

    for col in range(1, len(headers) + 1):
        cell = ws2.cell(row=1, column=col)
        cell.fill = header_fill
        cell.font = header_font

    for t in txs:
        ws2.append([
            t.transaction_id, t.type, t.amount, t.currency,
            t.responsible_person, t.counterparty or "—",
            t.status, t.risk_score or "low",
            t.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    for ws in [ws1, ws2]:
        for col in ws.columns:
            max_len = max(len(str(cell.value or '')) for cell in col)
            col_letter = openpyxl.utils.get_column_letter(col[0].column)
            ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    wb.save(file_path)
    return file_path


@router.post("/generate")
async def generate_report(
    req: ReportGenerateRequest,
    current_user: User = Depends(get_current_user),
):
    """Hisobot yaratadi (Async Motor/Beanie)."""
    txs = await filter_transactions(req)
    timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    ext = "pdf" if req.export_format == "pdf" else "xlsx"
    filename = f"report_{req.report_type}_{timestamp_str}.{ext}"

    bank_name = current_user.bank_name or "O'zbekiston Islom Banki"
    if req.export_format == "pdf":
        file_path = generate_pdf_report(filename, req, txs, bank_name)
    else:
        file_path = generate_excel_report(filename, req, txs, bank_name)

    rec = Report(
        report_type=req.report_type,
        format=req.export_format,
        filters=req.model_dump(),
        file_path=file_path,
        created_by=current_user.full_name,
        created_at=datetime.utcnow(),
    )
    await rec.insert()

    return {
        "id": str(rec.id),
        "filename": filename,
        "download_url": f"/api/reports/download/{str(rec.id)}",
        "record": {
            "id": str(rec.id),
            "report_type": rec.report_type,
            "export_format": rec.format,
            "created_by": rec.created_by,
            "created_at": rec.created_at,
            "filename": filename,
        }
    }


@router.get("/history")
async def get_reports_history(current_user: User = Depends(get_current_user)):
    """Avval yaratilgan hisobotlar ro'yxati."""
    recs = await Report.find_all().sort("-created_at").limit(50).to_list()
    return [
        {
            "id": str(r.id),
            "report_type": r.report_type,
            "export_format": r.format,
            "created_by": r.created_by,
            "created_at": r.created_at,
            "filename": os.path.basename(r.file_path),
            "download_url": f"/api/reports/download/{str(r.id)}",
        }
        for r in recs
    ]


@router.get("/download/{report_id}")
async def download_report(report_id: str):
    """Yaratilgan hisobot faylini yuklab olish."""
    rec = None
    if PydanticObjectId.is_valid(report_id):
        rec = await Report.get(PydanticObjectId(report_id))

    if not rec or not os.path.exists(rec.file_path):
        raise HTTPException(status_code=404, detail="Hisobot fayli topilmadi")

    media_type = "application/pdf" if rec.format == "pdf" else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    return FileResponse(path=rec.file_path, filename=os.path.basename(rec.file_path), media_type=media_type)
