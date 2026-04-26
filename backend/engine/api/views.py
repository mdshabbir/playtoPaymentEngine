import uuid

from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from engine.api.serializers import LedgerEntrySerializer, PayoutRequestSerializer, PayoutSerializer
from engine.models import Merchant, Payout
from engine.services.ledger import get_balances
from engine.services.payouts import (
    IdempotencyConflictError,
    InsufficientFundsError,
    InvalidBankAccountError,
    create_payout_request,
)


def get_request_merchant(request):
    merchant_id = request.headers.get("X-Merchant-ID")
    if not merchant_id:
        return None
    return get_object_or_404(Merchant, id=merchant_id)


class PayoutCreateView(APIView):
    def post(self, request):
        merchant = get_request_merchant(request)
        if merchant is None:
            return Response({"detail": "X-Merchant-ID header required"}, status=status.HTTP_400_BAD_REQUEST)

        idem_key = request.headers.get("Idempotency-Key")
        if not idem_key:
            return Response({"detail": "Idempotency-Key header required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            uuid.UUID(idem_key)
        except ValueError:
            return Response({"detail": "Idempotency-Key must be a UUID"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = PayoutRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            service_response = create_payout_request(
                merchant=merchant,
                idempotency_key=idem_key,
                amount_paise=serializer.validated_data["amount_paise"],
                bank_account_id=serializer.validated_data["bank_account_id"],
            )
            return Response(service_response.body, status=service_response.status_code)
        except IdempotencyConflictError:
            return Response(
                {"detail": "Idempotency key already used with a different payload"},
                status=status.HTTP_409_CONFLICT,
            )
        except InsufficientFundsError:
            return Response({"detail": "Insufficient available balance"}, status=status.HTTP_409_CONFLICT)
        except InvalidBankAccountError:
            return Response({"detail": "Bank account not found"}, status=status.HTTP_404_NOT_FOUND)


class DashboardView(APIView):
    def get(self, request):
        merchant = get_request_merchant(request)
        if merchant is None:
            return Response({"detail": "X-Merchant-ID header required"}, status=status.HTTP_400_BAD_REQUEST)

        balances = get_balances(merchant)
        recent_ledger = merchant.ledger_entries.order_by("-created_at")[:20]
        recent_payouts = merchant.payouts.order_by("-created_at")[:20]

        return Response(
            {
                "merchant_id": merchant.id,
                **balances,
                "recent_ledger": LedgerEntrySerializer(recent_ledger, many=True).data,
                "recent_payouts": PayoutSerializer(recent_payouts, many=True).data,
            }
        )


class PayoutListView(APIView):
    def get(self, request):
        merchant = get_request_merchant(request)
        if merchant is None:
            return Response({"detail": "X-Merchant-ID header required"}, status=status.HTTP_400_BAD_REQUEST)

        payouts = Payout.objects.filter(merchant=merchant).order_by("-created_at")
        status_filter = request.query_params.get("status")
        if status_filter:
            payouts = payouts.filter(status=status_filter)
        return Response({"results": PayoutSerializer(payouts[:100], many=True).data})

