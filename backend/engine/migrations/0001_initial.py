from django.db import migrations, models
import django.db.models.deletion
import django.core.validators
import uuid


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Merchant",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=120)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
        ),
        migrations.CreateModel(
            name="BankAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("account_holder_name", models.CharField(max_length=120)),
                ("account_last4", models.CharField(max_length=4)),
                ("ifsc", models.CharField(max_length=16)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "merchant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="bank_accounts", to="engine.merchant"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="Payout",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("amount_paise", models.BigIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("processing", "Processing"), ("completed", "Completed"), ("failed", "Failed")],
                        default="pending",
                        max_length=16,
                    ),
                ),
                ("attempt_count", models.PositiveSmallIntegerField(default=0)),
                ("next_retry_at", models.DateTimeField(blank=True, null=True)),
                ("last_attempt_at", models.DateTimeField(blank=True, null=True)),
                ("failure_reason", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "bank_account",
                    models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="payouts", to="engine.bankaccount"),
                ),
                (
                    "merchant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="payouts", to="engine.merchant"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="LedgerEntry",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "entry_type",
                    models.CharField(
                        choices=[
                            ("credit", "Credit"),
                            ("payout_hold", "Payout Hold"),
                            ("payout_release", "Payout Release"),
                            ("payout_debit", "Payout Debit"),
                        ],
                        max_length=24,
                    ),
                ),
                ("amount_paise", models.BigIntegerField(validators=[django.core.validators.MinValueValidator(1)])),
                ("reference", models.CharField(blank=True, default="", max_length=200)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "merchant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ledger_entries", to="engine.merchant"),
                ),
                (
                    "payout",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="ledger_entries", to="engine.payout"),
                ),
            ],
            options={
                "indexes": [
                    models.Index(fields=["merchant", "entry_type"], name="engine_ledge_merchan_9954cf_idx"),
                    models.Index(fields=["created_at"], name="engine_ledge_created_31ab24_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="IdempotencyKey",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(max_length=64)),
                ("request_fingerprint", models.CharField(max_length=128)),
                ("response_status_code", models.PositiveSmallIntegerField(default=0)),
                ("response_body", models.JSONField(default=dict)),
                ("expires_at", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "merchant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="idempotency_keys", to="engine.merchant"),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="idempotencykey",
            constraint=models.UniqueConstraint(fields=("merchant", "key"), name="uniq_merchant_idempotency_key"),
        ),
    ]

