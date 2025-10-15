from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.shortcuts import get_object_or_404

from src.portfolio.models.portfolio import Portfolio
from src.portfolio.serializers.admin import (
    PortfolioAdminListSerializer,
    PortfolioAdminDetailSerializer,
    PortfolioAdminCreateSerializer,
    PortfolioAdminUpdateSerializer
)
from src.portfolio.services.admin.portfolio_services import (
    PortfolioAdminService,
    PortfolioAdminStatusService,
    PortfolioAdminSEOService
)
from src.portfolio.filters.admin.portfolio_filters import PortfolioAdminFilter
from src.core.pagination import StandardLimitPagination
from src.user.authorization.admin_permission import ContentManagerAccess
from src.portfolio.messages.messages import PORTFOLIO_SUCCESS, PORTFOLIO_ERRORS


class PortfolioAdminViewSet(viewsets.ModelViewSet):
    """
    Optimized Portfolio ViewSet for Admin Panel with SEO support
    """
    permission_classes = [ContentManagerAccess]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = PortfolioAdminFilter
    search_fields = ['title', 'short_description', 'meta_title', 'meta_description']
    ordering_fields = ['created_at', 'updated_at', 'title', 'status']
    ordering = ['-created_at']
    pagination_class = StandardLimitPagination  # Add DRF pagination
    
    def get_queryset(self):
        """Optimized queryset based on action"""
        if self.action == 'list':
            return Portfolio.objects.for_admin_listing()
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return Portfolio.objects.for_detail()
        else:
            return Portfolio.objects.all()

    def list(self, request, *args, **kwargs):
        """List portfolios using service-level filtering with custom pagination"""
        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Apply additional filters from query parameters using service
        filters = {
            'status': request.query_params.get('status'),
            'is_featured': self._parse_bool(request.query_params.get('is_featured')),
            'is_public': self._parse_bool(request.query_params.get('is_public')),
            'category_id': request.query_params.get('category_id'),
            'seo_status': request.query_params.get('seo_status'),
        }
        # Remove None values for clean filtering
        filters = {k: v for k, v in filters.items() if v is not None}

        search = request.query_params.get('search')
        
        # Get ordering parameters
        order_by = request.query_params.get('order_by', 'created_at')
        order_desc = self._parse_bool(request.query_params.get('order_desc', True))
        
        # Apply service-level filtering to get the filtered queryset
        if filters or search or order_by:
            filtered_queryset = PortfolioAdminService.get_portfolio_queryset(
                filters=filters,
                search=search,
                order_by=order_by,
                order_desc=order_desc
            )
            
            # Debug logging
            total_count = filtered_queryset.count()
            print(f"🔍 Total filtered queryset count: {total_count}")
            
            # Intersect the filtered queryset with the DRF filtered queryset
            # We need to get the IDs from the service-filtered queryset and filter the DRF queryset
            filtered_ids = list(filtered_queryset.values_list('id', flat=True))
            queryset = queryset.filter(id__in=filtered_ids)
        # If no filters, we still need to apply ordering to match the frontend expectation
        elif order_by:
            if order_desc:
                queryset = queryset.order_by(f'-{order_by}')
            else:
                queryset = queryset.order_by(order_by)
        
        # Debug logging
        intersected_count = queryset.count()
        print(f"🔍 Intersected queryset count: {intersected_count}")
        
        # Apply DRF pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @staticmethod
    def _parse_bool(value):
        if value is None:
            return None
        if isinstance(value, bool):
            return value
        return value.lower() in ('1', 'true', 'yes', 'on')
    
    def get_serializer_class(self):
        """Dynamic serializer selection"""
        if self.action == 'list':
            return PortfolioAdminListSerializer
        elif self.action == 'create':
            return PortfolioAdminCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PortfolioAdminUpdateSerializer
        else:
            return PortfolioAdminDetailSerializer
    
    def create(self, request, *args, **kwargs):
        """Create portfolio with SEO auto-generation and media handling"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Check if there are media files in the request
        media_files = request.FILES.getlist('media_files')
        
        if media_files:
            # Create portfolio with media using service
            portfolio = PortfolioAdminService.create_portfolio_with_media(
                serializer.validated_data,
                media_files,
                created_by=request.user
            )
        else:
            # Create portfolio using service
            portfolio = PortfolioAdminService.create_portfolio(
                serializer.validated_data,
                created_by=request.user
            )
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(portfolio)
        return Response(detail_serializer.data, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update portfolio with SEO handling"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Update the instance directly
        for attr, value in serializer.validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Return detailed response
        detail_serializer = PortfolioAdminDetailSerializer(instance)
        return Response(detail_serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        """Delete portfolio with media cleanup"""
        instance = self.get_object()
        
        # Delete using service (handles media cleanup)
        success = PortfolioAdminService.delete_portfolio(instance.id)
        
        if success:
            return Response(status=status.HTTP_204_NO_CONTENT)
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_delete_failed"]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def change_status(self, request, pk=None):
        """Change portfolio status"""
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        portfolio = PortfolioAdminStatusService.change_status(pk, new_status)
        
        if portfolio:
            serializer = PortfolioAdminDetailSerializer(portfolio)
            return Response(serializer.data)
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish portfolio with SEO validation"""
        result = PortfolioAdminStatusService.publish_portfolio(pk)
        
        serializer = PortfolioAdminDetailSerializer(result['portfolio'])
        
        response_data = {
            'portfolio': serializer.data,
            'seo_warnings': result['seo_warnings']
        }
        
        return Response(response_data)
    
    @action(detail=False, methods=['post'])
    def bulk_update_status(self, request):
        """Bulk status update for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        new_status = request.data.get('status')
        
        if not portfolio_ids or not new_status:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        success = PortfolioAdminService.bulk_update_status(portfolio_ids, new_status)
        
        if success:
            return Response({"detail": f"Updated {len(portfolio_ids)} portfolios to {new_status}."})
        else:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_invalid_status"]},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['post'])
    def bulk_generate_seo(self, request):
        """Bulk SEO generation for multiple portfolios"""
        portfolio_ids = request.data.get('portfolio_ids', [])
        
        if not portfolio_ids:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        updated_count = 0
        for portfolio_id in portfolio_ids:
            try:
                PortfolioAdminSEOService.auto_generate_seo(portfolio_id)
                updated_count += 1
            except Exception:
                continue
        
        return Response({"detail": f"Generated SEO for {updated_count} portfolios."})
    
    @action(detail=True, methods=['post'])
    def generate_seo(self, request, pk=None):
        """Auto-generate SEO data for single portfolio"""
        portfolio = PortfolioAdminSEOService.auto_generate_seo(pk)
        
        serializer = PortfolioAdminDetailSerializer(portfolio)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def validate_seo(self, request, pk=None):
        """Validate SEO data and get suggestions"""
        validation_result = PortfolioAdminSEOService.validate_seo_data(pk)
        
        return Response(validation_result)
    
    @action(detail=True, methods=['post'])
    def add_media(self, request, pk=None):
        """Add media files to portfolio"""
        portfolio = self.get_object()
        media_files = request.FILES.getlist('media_files')
        
        if not media_files:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Add media using service
        created_medias = PortfolioAdminService.add_media_to_portfolio(
            portfolio.id,
            media_files,
            created_by=request.user
        )
        
        # If this is the first image, set it as main image
        if created_medias:
            from src.media.models.media import ImageMedia
            from src.portfolio.models.media import PortfolioImage
            
            # Check if any of the created media are images
            image_medias = [media for media in created_medias if isinstance(media, ImageMedia)]
            
            if image_medias:
                # Check if portfolio already has a main image
                has_main_image = PortfolioImage.objects.filter(
                    portfolio=portfolio,
                    is_main=True
                ).exists()
                
                if not has_main_image:
                    # Set the first image as main image
                    first_image_media = image_medias[0]
                    PortfolioImage.objects.create(
                        portfolio=portfolio,
                        image=first_image_media,
                        is_main=True,
                        order=0
                    )
                    
                    # Also set as OG image if not provided
                    if not portfolio.og_image:
                        portfolio.og_image = first_image_media
                        portfolio.save(update_fields=['og_image'])
        
        return Response({'created_count': len(created_medias)})
    
    @action(detail=True, methods=['post'])
    def set_main_image(self, request, pk=None):
        """Set main image for portfolio"""
        media_id = request.data.get('media_id')
        
        if not media_id:
            return Response(
                {"detail": PORTFOLIO_ERRORS["portfolio_not_found"]},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            portfolio_media = PortfolioAdminService.set_main_image(pk, media_id)
            return Response({"detail": PORTFOLIO_SUCCESS["portfolio_updated"]})
        except Exception as e:
            return Response(
                {"detail": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'])
    def seo_report(self, request):
        """Get comprehensive SEO report"""
        report = PortfolioAdminService.get_seo_report()
        
        return Response(report)
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """Get portfolio statistics for dashboard"""
        from django.db.models import Count
        
        stats = {
            'total': Portfolio.objects.count(),
            'published': Portfolio.objects.filter(status='published').count(),
            'draft': Portfolio.objects.filter(status='draft').count(),
            'featured': Portfolio.objects.filter(is_featured=True).count(),
            'with_complete_seo': Portfolio.objects.complete_seo().count(),
            'with_partial_seo': Portfolio.objects.incomplete_seo().count(),
            'without_seo': Portfolio.objects.missing_seo().count(),
        }
        
        # Recent portfolios
        recent_portfolios = Portfolio.objects.for_admin_listing()[:5]
        recent_serializer = PortfolioAdminListSerializer(recent_portfolios, many=True)
        
        stats['recent_portfolios'] = recent_serializer.data
        
        return Response(stats)