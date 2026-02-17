from src.blog.utils.cache_shared import hash_payload

class BlogPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:blog:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:blog:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:blog:detail:public_id:{public_id}"

    @staticmethod
    def detail_id(blog_id):
        return f"public:blog:detail:id:{blog_id}"

    @staticmethod
    def featured(limit):
        return f"public:blog:featured:{limit}"

    @staticmethod
    def related(blog_slug, limit):
        return f"public:blog:related:{blog_slug}:{limit}"

class BlogCategoryPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:blog:category:list:{hash_payload(payload)}"

    @staticmethod
    def tree():
        return "public:blog:category:tree"

    @staticmethod
    def roots():
        return "public:blog:category:roots"

    @staticmethod
    def detail_slug(slug):
        return f"public:blog:category:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:blog:category:detail:public_id:{public_id}"

    @staticmethod
    def detail_id(category_id):
        return f"public:blog:category:detail:id:{category_id}"

class BlogTagPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:blog:tag:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:blog:tag:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:blog:tag:detail:public_id:{public_id}"

    @staticmethod
    def detail_id(tag_id):
        return f"public:blog:tag:detail:id:{tag_id}"

    @staticmethod
    def popular(limit):
        return f"public:blog:tag:popular:{limit}"
