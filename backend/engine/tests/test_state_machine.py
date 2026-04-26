from django.test import TestCase

from engine.models import Payout
from engine.state_machine import assert_transition_allowed


class StateMachineTests(TestCase):
    def test_failed_to_completed_is_blocked(self):
        with self.assertRaises(ValueError):
            assert_transition_allowed(Payout.Status.FAILED, Payout.Status.COMPLETED)

