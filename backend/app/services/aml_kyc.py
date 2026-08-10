"""
Mock AML/KYC Risk Scoring Service
-----------------------------------
Simulates risk assessment for Islamic banking transactions.
In production, this would connect to actual AML/KYC API providers
(e.g., Refinitiv World-Check, ComplyAdvantage, local NBU integrations).
"""

from typing import Tuple


RISK_RULES = {
    "amount_thresholds": {
        "UZS": {"high": 500_000_000, "medium": 100_000_000},
        "USD": {"high": 50_000, "medium": 10_000},
    },
    "high_risk_counterparties": [
        "shell corp", "offshore", "anon",
    ],
    "murabaha_risk_base": 0.15,
    "musharaka_risk_base": 0.25,
}


def _compute_risk(
    transaction_type: str,
    amount: float,
    counterparty: str | None,
    currency: str,
) -> Tuple[str, str]:
    """
    Returns (risk_level, details) tuple.
    Risk levels: 'low' | 'medium' | 'high'
    """
    score = 0.0
    details_parts = []

    # Amount-based risk
    normalized_currency = currency.upper()
    thresholds = RISK_RULES["amount_thresholds"].get(
        normalized_currency,
        RISK_RULES["amount_thresholds"]["UZS"],
    )
    if amount >= thresholds["high"]:
        score += 0.5
        details_parts.append(
            f"Yuqori miqdor: {amount:,.0f} {normalized_currency} "
            f"(>= {thresholds['high']:,.0f})"
        )
    elif amount >= thresholds["medium"]:
        score += 0.25
        details_parts.append(
            f"O'rta miqdor: {amount:,.0f} {normalized_currency} "
            f"(>= {thresholds['medium']:,.0f})"
        )
    else:
        details_parts.append(f"Oddiy miqdor: {amount:,.0f} {normalized_currency}")

    # Transaction type risk
    base = RISK_RULES.get(f"{transaction_type.lower()}_risk_base", 0.2)
    score += base
    details_parts.append(f"{transaction_type} asosiy risk: {base * 100:.0f}%")

    # Counterparty screening
    if counterparty:
        cp_lower = counterparty.lower()
        for keyword in RISK_RULES["high_risk_counterparties"]:
            if keyword in cp_lower:
                score += 0.4
                details_parts.append(f"Kontragent screening: '{keyword}' topildi — yuqori xavf")
                break
        else:
            details_parts.append("Kontragent screening: tozalandi")
    else:
        score += 0.05
        details_parts.append("Kontragent ko'rsatilmagan (+5% risk)")

    score = max(0.0, min(1.0, score))

    if score >= 0.6:
        level = "high"
    elif score >= 0.35:
        level = "medium"
    else:
        level = "low"

    details = " | ".join(details_parts) + f" | Jami ball: {score:.2f}"
    return level, details


def run_aml_kyc_check(
    transaction_type: str,
    amount: float,
    counterparty: str | None = None,
    currency: str = "UZS",
) -> Tuple[str, str]:
    """
    Public API for AML/KYC mock check.
    Returns (risk_score: str, risk_details: str)
    """
    return _compute_risk(transaction_type, amount, counterparty, currency)
