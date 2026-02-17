from src.portfolio.utils.cache_shared import hash_payload

class PortfolioPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:portfolio:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:portfolio:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:portfolio:detail:public_id:{public_id}"

    @staticmethod
    def featured(limit):
        return f"public:portfolio:featured:{limit}"

    @staticmethod
    def related(portfolio_slug, limit):
        return f"public:portfolio:related:{portfolio_slug}:{limit}"

class PortfolioCategoryPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:portfolio:category:list:{hash_payload(payload)}"

    @staticmethod
    def tree():
        return "public:portfolio:category:tree"

    @staticmethod
    def roots():
        return "public:portfolio:category:roots"

    @staticmethod
    def detail_slug(slug):
        return f"public:portfolio:category:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:portfolio:category:detail:public_id:{public_id}"

class PortfolioTagPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:portfolio:tag:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:portfolio:tag:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:portfolio:tag:detail:public_id:{public_id}"

    @staticmethod
    def popular(limit):
        return f"public:portfolio:tag:popular:{limit}"

class PortfolioOptionPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:portfolio:option:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:portfolio:option:detail:slug:{slug}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:portfolio:option:detail:public_id:{public_id}"

    @staticmethod
    def by_name(name, limit):
        payload = {'name': name, 'limit': limit}
        return f"public:portfolio:option:by_name:{hash_payload(payload)}"
