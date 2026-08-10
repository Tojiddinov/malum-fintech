import unittest

from pydantic import ValidationError

from app.routers.reports import ReportGenerateRequest
from app.schemas.schemas import TransactionCreate, TransactionUpdate, UserCreate
from app.services.aml_kyc import run_aml_kyc_check


class ValidationTests(unittest.TestCase):
    def test_transaction_rejects_unsupported_currency(self):
        with self.assertRaises(ValidationError):
            TransactionCreate(type="Murabaha", amount=100, currency="EUR")

    def test_transaction_rejects_non_positive_amount(self):
        with self.assertRaises(ValidationError):
            TransactionCreate(type="Murabaha", amount=0)

    def test_patch_rejects_explicit_null_for_required_field(self):
        with self.assertRaises(ValidationError):
            TransactionUpdate(amount=None)

    def test_user_rejects_unknown_role_and_short_password(self):
        with self.assertRaises(ValidationError):
            UserCreate(
                full_name="Test User",
                email="test@example.com",
                password="short",
                role="superadmin",
            )

    def test_report_rejects_reverse_date_range(self):
        with self.assertRaises(ValidationError):
            ReportGenerateRequest(
                report_type="transaction_summary",
                export_format="pdf",
                start_date="2026-08-11",
                end_date="2026-08-10",
            )


class AmlTests(unittest.TestCase):
    def test_risk_check_is_deterministic(self):
        first = run_aml_kyc_check("Murabaha", 150_000_000, "Clean Company", "UZS")
        second = run_aml_kyc_check("Murabaha", 150_000_000, "Clean Company", "UZS")
        self.assertEqual(first, second)

    def test_currency_uses_its_own_thresholds(self):
        uzs_risk, _ = run_aml_kyc_check("Murabaha", 20_000, "Clean Company", "UZS")
        usd_risk, details = run_aml_kyc_check("Murabaha", 20_000, "Clean Company", "USD")
        self.assertEqual(uzs_risk, "low")
        self.assertEqual(usd_risk, "medium")
        self.assertIn("USD", details)


if __name__ == "__main__":
    unittest.main()
