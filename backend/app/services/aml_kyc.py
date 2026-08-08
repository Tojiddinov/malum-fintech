"""
Mock AML/KYC Risk Scoring Service
-----------------------------------
Simulates risk assessment for Islamic banking transactions.
In production, this would connect to actual AML/KYC API providers
(e.g., Refinitiv World-Check, ComplyAdvantage, local NBU integrations).
"""

import random
from typing import Tuple


RISK_RULES = {
    "high_amount_threshold": 500_000_000,   # 500M UZS
    "medium_amount_threshold": 100_000_000,  # 100M UZS
    "high_risk_counterparties": [
        "shell corp", "offshore", "anon",
    ],
    "murabaha_risk_base": 0.15,
    "musharaka_risk_base": 0.25,
}


def _compute_risk(transaction_type: str, amount: float, counterparty: str | None) -> Tuple[str, str]:
    """
    Returns (risk_level, details) tuple.
    Risk levels: 'low' | 'medium' | 'high'
    """
    score = 0.0
    details_parts = []

    # Amount-based risk
    if amount >= RISK_RULES["high_amount_threshold"]:
        score += 0.5
        details_parts.append(f"Yuqori miqdor: {amount:,.0f} UZS (> 500M)")
    elif amount >= RISK_RULES["medium_amount_threshold"]:
        score += 0.25
        details_parts.append(f"O'rta miqdor: {amount:,.0f} UZS (> 100M)")
    else:
        details_parts.append(f"Oddiy miqdor: {amount:,.0f} UZS")

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

    # Small random noise for simulation realism
    score += random.uniform(-0.02, 0.02)
    score = max(0.0, min(1.0, score))

    if score >= 0.6:
        level = "high"
    elif score >= 0.35:
        level = "medium"
    else:
        level = "low"

    details = " | ".join(details_parts) + f" | Jami ball: {score:.2f}"
    return level, details


def run_aml_kyc_check(transaction_type: str, amount: float, counterparty: str | None = None) -> Tuple[str, str]:
    """
    Public API for AML/KYC mock check.
    Returns (risk_score: str, risk_details: str)
    """
    return _compute_risk(transaction_type, amount, counterparty)
