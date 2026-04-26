from engine.models import Payout


ALLOWED_TRANSITIONS = {
    Payout.Status.PENDING: {Payout.Status.PROCESSING},
    Payout.Status.PROCESSING: {Payout.Status.COMPLETED, Payout.Status.FAILED},
    Payout.Status.COMPLETED: set(),
    Payout.Status.FAILED: set(),
}


def assert_transition_allowed(current_status: str, next_status: str) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current_status, set())
    if next_status not in allowed:
        raise ValueError(f"Illegal payout status transition: {current_status} -> {next_status}")

