from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from .models.order import Order
from .models.status import OrderStatusHistory


@receiver(pre_save, sender=Order)
def track_order_status_change(sender, instance, **kwargs):
    """Track order status changes before saving"""
    if instance.pk:
        try:
            old_instance = Order.objects.get(pk=instance.pk)
            instance._old_status = old_instance.status
            instance._old_payment_status = old_instance.payment_status
        except Order.DoesNotExist:
            instance._old_status = None
            instance._old_payment_status = None
    else:
        instance._old_status = None
        instance._old_payment_status = None


@receiver(post_save, sender=Order)
def create_order_status_history(sender, instance, created, **kwargs):
    """Create status history entry when order status changes"""
    old_status = getattr(instance, '_old_status', None)
    old_payment_status = getattr(instance, '_old_payment_status', None)
    
    status_changed = old_status != instance.status
    payment_status_changed = old_payment_status != instance.payment_status
    
    if status_changed or payment_status_changed or created:
        OrderStatusHistory.objects.create(
            order=instance,
            old_status=old_status if not created else None,
            new_status=instance.status,
            old_payment_status=old_payment_status if not created else None,
            new_payment_status=instance.payment_status if payment_status_changed else None,
            changed_by=getattr(instance, '_changed_by', None),
        )
