from rest_framework.pagination import LimitOffsetPagination, CursorPagination

class ExtraSmallLimitPagination(LimitOffsetPagination):
    default_limit = 5
    max_limit = 10
    limit_query_param = 'limit'
    offset_query_param = 'offset'

class SmallLimitPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 20
    limit_query_param = 'limit'
    offset_query_param = 'offset'

class StandardLimitPagination(LimitOffsetPagination):
    default_limit = 10
    max_limit = 50
    limit_query_param = 'limit'
    offset_query_param = 'offset'

class LargeLimitPagination(LimitOffsetPagination):
    default_limit = 20
    max_limit = 100
    limit_query_param = 'limit'
    offset_query_param = 'offset'

class ExtraLargeLimitPagination(LimitOffsetPagination):
    default_limit = 50
    max_limit = 200
    limit_query_param = 'limit'
    offset_query_param = 'offset'

class ExtraSmallCursorPagination(CursorPagination):
    page_size = 5
    ordering = '-created_at'
    cursor_query_param = 'cursor'

class SmallCursorPagination(CursorPagination):
    page_size = 10
    ordering = '-created_at'
    cursor_query_param = 'cursor'

class StandardCursorPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'
    cursor_query_param = 'cursor'

class LargeCursorPagination(CursorPagination):
    page_size = 50
    ordering = '-created_at'
    cursor_query_param = 'cursor'

class ExtraLargeCursorPagination(CursorPagination):
    page_size = 100
    ordering = '-created_at'
    cursor_query_param = 'cursor'
