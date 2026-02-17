from src.user.utils.cache_shared import hash_payload

class UserPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:user:list:{hash_payload(payload)}"

    @staticmethod
    def profile(user_public_id):
        return f"public:user:profile:{user_public_id}"
