from django.db.models import Max
from django.core.exceptions import ValidationError

def get_next_media_order(queryset, order_field='order'):

    result = queryset.aggregate(max_order=Max(order_field))
    return (result['max_order'] or 0) + 1

def validate_media_limit(current_count, upload_count, max_limit, error_msg_template):

    total_count = current_count + upload_count
    if total_count > max_limit:
        raise ValidationError(
            error_msg_template.format(max_items=max_limit, total_items=total_count)
        )

def get_combined_max_order(parent_obj, *nested_rels):

    max_order = 0
    for rel in nested_rels:
        if hasattr(parent_obj, rel):
            current_max = getattr(parent_obj, rel).aggregate(m=Max('order'))['m'] or 0
            max_order = max(max_order, current_max)
    return max_order + 1
