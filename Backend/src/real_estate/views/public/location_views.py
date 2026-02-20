from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny

from src.core.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.real_estate.messages.messages import LOCATION_ERRORS, LOCATION_SUCCESS
from src.real_estate.serializers.public.location_serializer import (
    CityPublicSerializer,
    ProvincePublicSerializer,
    RegionPublicSerializer,
)
from src.real_estate.services.public.location_services import PropertyLocationPublicService


class ProvincePublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = ProvincePublicSerializer

    def get_queryset(self):
        search = (self.request.query_params.get("search") or "").strip() or None
        ordering = (self.request.query_params.get("ordering") or "").strip() or None
        return PropertyLocationPublicService.get_provinces_queryset(search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        search = (request.query_params.get("search") or "").strip() or None
        ordering = (request.query_params.get("ordering") or "").strip() or None
        data = PropertyLocationPublicService.get_province_list_data(search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=LOCATION_SUCCESS["province_list_success"],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        province_data = PropertyLocationPublicService.get_province_detail_by_id_data(kwargs.get("pk"))
        if not province_data:
            return APIResponse.error(
                message=LOCATION_ERRORS["province_not_found"],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LOCATION_SUCCESS["province_list_success"],
            data=province_data,
            status_code=status.HTTP_200_OK,
        )


class CityPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = CityPublicSerializer

    def get_queryset(self):
        filters = {
            "province_id": self.request.query_params.get("province_id"),
        }
        filters = {key: value for key, value in filters.items() if value not in (None, "")}
        search = (self.request.query_params.get("search") or "").strip() or None
        ordering = (self.request.query_params.get("ordering") or "").strip() or None
        return PropertyLocationPublicService.get_cities_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {
            "province_id": request.query_params.get("province_id"),
        }
        filters = {key: value for key, value in filters.items() if value not in (None, "")}
        search = (request.query_params.get("search") or "").strip() or None
        ordering = (request.query_params.get("ordering") or "").strip() or None
        data = PropertyLocationPublicService.get_city_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=LOCATION_SUCCESS["city_list_success"],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        city_data = PropertyLocationPublicService.get_city_detail_by_id_data(kwargs.get("pk"))
        if not city_data:
            return APIResponse.error(
                message=LOCATION_ERRORS["city_not_found"],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LOCATION_SUCCESS["city_list_success"],
            data=city_data,
            status_code=status.HTTP_200_OK,
        )


class RegionPublicViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [AllowAny]
    pagination_class = StandardLimitPagination
    serializer_class = RegionPublicSerializer

    def get_queryset(self):
        filters = {
            "city_id": self.request.query_params.get("city_id"),
            "province_id": self.request.query_params.get("province_id"),
        }
        filters = {key: value for key, value in filters.items() if value not in (None, "")}
        search = (self.request.query_params.get("search") or "").strip() or None
        ordering = (self.request.query_params.get("ordering") or "").strip() or None
        return PropertyLocationPublicService.get_regions_queryset(filters=filters, search=search, ordering=ordering)

    def list(self, request, *args, **kwargs):
        filters = {
            "city_id": request.query_params.get("city_id"),
            "province_id": request.query_params.get("province_id"),
        }
        filters = {key: value for key, value in filters.items() if value not in (None, "")}
        search = (request.query_params.get("search") or "").strip() or None
        ordering = (request.query_params.get("ordering") or "").strip() or None
        data = PropertyLocationPublicService.get_region_list_data(filters=filters, search=search, ordering=ordering)
        page = self.paginate_queryset(data)
        if page is not None:
            return self.get_paginated_response(page)

        return APIResponse.success(
            message=LOCATION_SUCCESS["region_list_success"],
            data=data,
            status_code=status.HTTP_200_OK,
        )

    def retrieve(self, request, *args, **kwargs):
        region_data = PropertyLocationPublicService.get_region_detail_by_id_data(kwargs.get("pk"))
        if not region_data:
            return APIResponse.error(
                message=LOCATION_ERRORS["city_not_found"],
                status_code=status.HTTP_404_NOT_FOUND,
            )

        return APIResponse.success(
            message=LOCATION_SUCCESS["region_list_success"],
            data=region_data,
            status_code=status.HTTP_200_OK,
        )
