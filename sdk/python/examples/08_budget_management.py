"""Budget management with rolling windows and per-user limits.

Demonstrates using BudgetManager to enforce spending caps at both the
global level and per-user level, with optional rolling time windows.
"""

import os

from agentcc import BudgetManager, AgentCC, AgentCCError

API_KEY = os.environ.get("AGENTCC_API_KEY", "sk-test")
BASE_URL = os.environ.get("AGENTCC_BASE_URL", "http://localhost:8090")

# ---- Global budget with rolling window ----
print("=== Global budget ($1.00/hour) ===")
budget = BudgetManager(max_budget=1.00, window="1h")

# Simulate some API usage
budget.update_cost(0.25)
budget.update_cost(0.30)
print(f"Current spend: ${budget.get_current_spend():.2f}")
print(f"Remaining: ${budget.get_remaining_budget():.2f}")

# Project future spend based on current rate
projected = budget.projected_cost(hours=24.0)
print(f"Projected 24h cost: ${projected:.2f}")

# Check before making a request -- raises AgentCCError if over budget
try:
    budget.check_budget(estimated_cost=0.50)
    print("Budget check passed for $0.50 request")
except AgentCCError as e:
    print(f"Budget exceeded: {e}")

# ---- Per-user budgets ----
print("\n=== Per-user budgets ===")
budget.set_user_budget("alice", 0.50)
budget.set_user_budget("bob", 0.20)

budget.update_cost(0.15, user="alice")
budget.update_cost(0.18, user="bob")

print(f"Alice spend: ${budget.get_current_spend(user='alice'):.2f}")
print(f"Alice remaining: ${budget.get_remaining_budget(user='alice'):.2f}")
print(f"Bob spend: ${budget.get_current_spend(user='bob'):.2f}")
print(f"Bob remaining: ${budget.get_remaining_budget(user='bob'):.2f}")

# Check if a user is within budget
print(f"Alice valid: {budget.is_valid_user('alice')}")
print(f"Bob valid: {budget.is_valid_user('bob')}")

# Per-user check
try:
    budget.check_budget(estimated_cost=0.05, user="bob")
    print("Bob's budget check passed for $0.05")
except AgentCCError as e:
    print(f"Bob over budget: {e}")

# ---- Reset ----
print("\n=== Reset ===")
budget.reset(user="bob")
print(f"Bob spend after reset: ${budget.get_current_spend(user='bob'):.2f}")

budget.reset()  # Reset everything
print(f"Global spend after full reset: ${budget.get_current_spend():.2f}")

# ---- Window formats ----
print("\n=== Supported window formats ===")
for window in ["5m", "1h", "1d", "1w", "1M"]:
    b = BudgetManager(max_budget=10.0, window=window)
    print(f"  {window}: {BudgetManager._parse_window(window):.0f} seconds")
