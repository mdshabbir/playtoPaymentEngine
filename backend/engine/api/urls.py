from django.urls import path

from engine.api.views import DashboardView, PayoutCreateView, PayoutListView

urlpatterns = [
    path("dashboard", DashboardView.as_view(), name="dashboard"),
    path("payouts", PayoutCreateView.as_view(), name="payout-create"),
    path("payouts/list", PayoutListView.as_view(), name="payout-list"),
]

