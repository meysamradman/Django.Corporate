## API ViewSet Template (Concise)

- Always use unified response: `APIResponse` (success/error) and renderer handles pagination format
- Messages and errors must come from app `messages` only (no hardcoded strings)
- Always use `StandardLimitPagination` (limit/offset) for list endpoints
- Prevent N+1: set `select_related_fields` and `prefetch_related_lookups`
- Business logic only in `service` (create/update/delete/list_queryset)
- No duplicate code; follow PEP8
- Do not place imports inside or between code blocks in docs
- Do not write non-English text inside code blocks

Minimal template (no imports):
```python
class ExampleViewSet(BaseServiceViewSet):
    queryset = Model.objects.all().order_by('-created_at')
    serializer_class = ExampleSerializer
    service = ExampleService

    # N+1 prevention
    select_related_fields = (
        'fk_field',
    )
    prefetch_related_lookups = (
        'm2m_field',
    )

    # Messages
    success_messages = {
        'list': APP_SUCCESS['list_success'],
        'retrieve': APP_SUCCESS['detail_success'],
        'create': APP_SUCCESS['create_success'],
        'update': APP_SUCCESS['update_success'],
        'destroy': APP_SUCCESS['delete_success'],
    }
    error_messages = {
        'list': APP_ERRORS['list_failed'],
        'retrieve': APP_ERRORS['not_found'],
        'create': APP_ERRORS['create_failed'],
        'update': APP_ERRORS['update_failed'],
        'destroy': APP_ERRORS['delete_failed'],
    }

    # Optional: further queryset restriction
    def get_queryset(self):
        return super().get_queryset()
```

Minimal service contract (no imports):
```python
class ExampleService:
    @staticmethod
    def list_queryset(request):
        return Model.objects.all().order_by('-created_at')

    @staticmethod
    def create(validated_data, request):
        return Model.objects.create(**validated_data)

    @staticmethod
    def update(instance, validated_data, request):
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()
        return instance

    @staticmethod
    def delete(instance, request):
        instance.delete()
```


