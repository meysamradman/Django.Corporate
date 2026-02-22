from src.real_estate.utils.cache_shared import hash_payload

class PropertyPublicCacheKeys:
    SCHEMA_VERSION = "v5"

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
            'v': PropertyPublicCacheKeys.SCHEMA_VERSION,
        }
        return f"public:real_estate:property:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:property:detail:{PropertyPublicCacheKeys.SCHEMA_VERSION}:slug:{slug}"

    @staticmethod
    def detail_id(property_id):
        return f"public:real_estate:property:detail:{PropertyPublicCacheKeys.SCHEMA_VERSION}:id:{property_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:property:detail:{PropertyPublicCacheKeys.SCHEMA_VERSION}:public_id:{public_id}"

    @staticmethod
    def featured(limit):
        return f"public:real_estate:property:featured:{PropertyPublicCacheKeys.SCHEMA_VERSION}:{limit}"

    @staticmethod
    def related(slug, limit):
        return f"public:real_estate:property:related:{PropertyPublicCacheKeys.SCHEMA_VERSION}:{slug}:{limit}"

class TypePublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:type:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:type:detail:slug:{slug}"

    @staticmethod
    def detail_id(type_id):
        return f"public:real_estate:type:detail:id:{type_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:type:detail:public_id:{public_id}"

    @staticmethod
    def roots():
        return "public:real_estate:type:roots"

    @staticmethod
    def tree():
        return "public:real_estate:type:tree"

    @staticmethod
    def popular(limit):
        return f"public:real_estate:type:popular:{limit}"

class StatePublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:state:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:state:detail:slug:{slug}"

    @staticmethod
    def detail_id(state_id):
        return f"public:real_estate:state:detail:id:{state_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:state:detail:public_id:{public_id}"

    @staticmethod
    def featured(limit):
        return f"public:real_estate:state:featured:{limit}"

class TagPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:tag:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:tag:detail:slug:{slug}"

    @staticmethod
    def detail_id(tag_id):
        return f"public:real_estate:tag:detail:id:{tag_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:tag:detail:public_id:{public_id}"

    @staticmethod
    def popular(limit):
        return f"public:real_estate:tag:popular:{limit}"

class FeaturePublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:feature:list:{hash_payload(payload)}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:feature:detail:public_id:{public_id}"

    @staticmethod
    def detail_id(feature_id):
        return f"public:real_estate:feature:detail:id:{feature_id}"

class LabelPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:label:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:label:detail:slug:{slug}"

    @staticmethod
    def detail_id(label_id):
        return f"public:real_estate:label:detail:id:{label_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:label:detail:public_id:{public_id}"

class AgentPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:agent:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:agent:detail:slug:{slug}"

    @staticmethod
    def detail_id(agent_id):
        return f"public:real_estate:agent:detail:id:{agent_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:agent:detail:public_id:{public_id}"

    @staticmethod
    def featured(limit):
        return f"public:real_estate:agent:featured:{limit}"

    @staticmethod
    def top_rated(limit):
        return f"public:real_estate:agent:top_rated:{limit}"

    @staticmethod
    def by_agency(agency_id, limit):
        return f"public:real_estate:agent:by_agency:{agency_id}:{limit or 'all'}"

    @staticmethod
    def statistics(agent_id):
        return f"public:real_estate:agent:statistics:{agent_id}"

class AgencyPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:agency:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:agency:detail:slug:{slug}"

    @staticmethod
    def detail_id(agency_id):
        return f"public:real_estate:agency:detail:id:{agency_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:agency:detail:public_id:{public_id}"

    @staticmethod
    def featured(limit):
        return f"public:real_estate:agency:featured:{limit}"

    @staticmethod
    def top_rated(limit):
        return f"public:real_estate:agency:top_rated:{limit}"

    @staticmethod
    def by_city(city_id, limit):
        return f"public:real_estate:agency:by_city:{city_id}:{limit or 'all'}"

    @staticmethod
    def by_province(province_id, limit):
        return f"public:real_estate:agency:by_province:{province_id}:{limit or 'all'}"

    @staticmethod
    def statistics(agency_id):
        return f"public:real_estate:agency:statistics:{agency_id}"

    @staticmethod
    def with_agents(slug):
        return f"public:real_estate:agency:with_agents:{slug}"

class FloorPlanPublicCacheKeys:

    @staticmethod
    def list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:floor_plan:list:{hash_payload(payload)}"

    @staticmethod
    def detail_slug(slug):
        return f"public:real_estate:floor_plan:detail:slug:{slug}"

    @staticmethod
    def detail_id(floor_plan_id):
        return f"public:real_estate:floor_plan:detail:id:{floor_plan_id}"

    @staticmethod
    def detail_public_id(public_id):
        return f"public:real_estate:floor_plan:detail:public_id:{public_id}"


class LocationPublicCacheKeys:

    @staticmethod
    def province_list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:location:province:list:{hash_payload(payload)}"

    @staticmethod
    def city_list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:location:city:list:{hash_payload(payload)}"

    @staticmethod
    def province_detail(province_id):
        return f"public:real_estate:location:province:detail:id:{province_id}"

    @staticmethod
    def city_detail(city_id):
        return f"public:real_estate:location:city:detail:id:{city_id}"

    @staticmethod
    def region_list(filters=None, search=None, ordering=None):
        payload = {
            'filters': filters or {},
            'search': search,
            'ordering': ordering,
        }
        return f"public:real_estate:location:region:list:{hash_payload(payload)}"

    @staticmethod
    def region_detail(region_id):
        return f"public:real_estate:location:region:detail:id:{region_id}"
