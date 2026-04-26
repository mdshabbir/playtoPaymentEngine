from celery import shared_task

from engine.services.payouts import process_one_pending_payout, retry_stuck_processing_payouts


@shared_task
def process_pending_payouts_task() -> int:
    count = 0
    while process_one_pending_payout():
        count += 1
    return count


@shared_task
def retry_stuck_payouts_task() -> int:
    return retry_stuck_processing_payouts()

