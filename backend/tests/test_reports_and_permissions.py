import asyncio
import unittest
from datetime import datetime
from types import SimpleNamespace

from fastapi import HTTPException

from app.routers.reports import (
    ReportGenerateRequest,
    generate_excel_report,
    generate_pdf_report,
    _excel_safe,
)
from app.services.auth import (
    require_report_access,
    require_shariat_or_admin,
    require_writer,
)


def make_user(role: str):
    return SimpleNamespace(
        tenant_id="tenant-a",
        full_name="Test User",
        email=f"{role}@example.com",
        role=role,
    )


def make_transaction():
    return SimpleNamespace(
        tenant_id="tenant-a",
        transaction_id="#0001",
        type="Murabaha",
        amount=125_000,
        currency="USD",
        status="approved",
        responsible_person="Test User",
        counterparty="Clean Company",
        risk_score="medium",
        created_at=datetime(2026, 8, 10, 10, 30),
        updated_at=datetime(2026, 8, 10, 10, 30),
    )


class ReportTests(unittest.TestCase):
    def setUp(self):
        self.request = ReportGenerateRequest(
            report_type="transaction_summary",
            export_format="pdf",
        )
        self.transactions = [make_transaction()]

    def test_pdf_is_generated_in_memory(self):
        report = generate_pdf_report(self.request, self.transactions, "Test Bank")
        self.assertTrue(report.startswith(b"%PDF"))

    def test_excel_is_generated_in_memory(self):
        report = generate_excel_report(self.request, self.transactions, "Test Bank")
        self.assertTrue(report.startswith(b"PK"))

    def test_excel_formula_injection_is_neutralized(self):
        self.assertEqual(_excel_safe("=HYPERLINK('bad')"), "'=HYPERLINK('bad')")
        self.assertEqual(_excel_safe("Clean Company"), "Clean Company")


class PermissionTests(unittest.TestCase):
    def test_only_admin_can_write(self):
        self.assertEqual(asyncio.run(require_writer(make_user("admin"))).role, "admin")
        with self.assertRaises(HTTPException) as context:
            asyncio.run(require_writer(make_user("auditor")))
        self.assertEqual(context.exception.status_code, 403)

    def test_report_access_is_admin_or_auditor(self):
        self.assertEqual(
            asyncio.run(require_report_access(make_user("auditor"))).role,
            "auditor",
        )
        with self.assertRaises(HTTPException):
            asyncio.run(require_report_access(make_user("shariat_board")))

    def test_workflow_access_is_shariat_or_admin(self):
        self.assertEqual(
            asyncio.run(require_shariat_or_admin(make_user("shariat_board"))).role,
            "shariat_board",
        )
        with self.assertRaises(HTTPException):
            asyncio.run(require_shariat_or_admin(make_user("auditor")))


if __name__ == "__main__":
    unittest.main()
