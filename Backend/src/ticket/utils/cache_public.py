from src.ticket.utils.cache_shared import hash_payload


class TicketPublicCacheKeys:

    @staticmethod
    def list_for_user(user_id, filters=None, ordering=None):
        payload = {
            'user_id': user_id,
            'filters': filters or {},
            'ordering': ordering,
        }
        return f"public:ticket:list:{hash_payload(payload)}"

    @staticmethod
    def detail(ticket_public_id, user_id):
        return f"public:ticket:detail:{ticket_public_id}:user:{user_id}"

    @staticmethod
    def messages(ticket_id):
        return f"public:ticket:{ticket_id}:messages"
