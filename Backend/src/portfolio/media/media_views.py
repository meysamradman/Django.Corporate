from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.filters import SearchFilter
from rest_framework.parsers import JSONParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAdminUser
from src.core.pagination.pagination import StandardLimitPagination
from src.core.responses.response import APIResponse
from src.portfolio.media.media_services import PortfolioMediaService
from src.portfolio.media.media_serialize import PortfolioMediaSerializer
from src.portfolio.models.media import PortfolioMedia

from src.portfolio.services.admin.portfolio_services import PortfolioAdminService


class PortfolioMediaViewSet(viewsets.ModelViewSet):
    queryset = PortfolioMedia.objects.all().select_related('media', 'portfolio')
    serializer_class = PortfolioMediaSerializer
    permission_classes = [IsAdminUser]
    pagination_class = StandardLimitPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['portfolio', 'is_main_image']
    search_fields = ['media__title', 'portfolio__title']
    ordering_fields = ['order', 'created_at']
    ordering = ['order', '-created_at']
    parser_classes = [JSONParser]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        # Filter by portfolio_id if provided
        portfolio_id = self.request.query_params.get('portfolio_id')
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
        return queryset
        
    def create(self, request, *args, **kwargs):
        try:
            # Get portfolio ID and media_id (from central media app)
            portfolio_id = request.data.get('portfolio_id')
            if not portfolio_id:
                return APIResponse.error(
                    "Portfolio ID is required", 
                    status_code=status.HTTP_400_BAD_REQUEST
                )
            
            media_id = request.data.get('media_id')
            if not media_id:
                return APIResponse.error(
                    "media_id is required", 
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
            # Get optional parameters
            is_main_image = request.data.get('is_main_image', False)
            if isinstance(is_main_image, str):
                is_main_image = is_main_image.lower() == 'true'
                
            order = request.data.get('order', 0)
            if isinstance(order, str) and order.isdigit():
                order = int(order)
                
            # Get portfolio object
            portfolio = PortfolioAdminService.get_portfolio_id(portfolio_id)
            
            # Link existing media from central media app
            portfolio_media = PortfolioMediaService.create_portfolio_media_by_media_id(
                portfolio=portfolio,
                media_id=media_id,
                created_by=request.user,
                is_main_image=is_main_image,
                order=order
            )
            
            return APIResponse.success(
                "Media added to portfolio successfully",
                self.get_serializer(portfolio_media).data,
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            # Log the detailed error for debugging
            import traceback
            traceback.print_exc() 
            return APIResponse.error(
                f"Failed to add media to portfolio: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
    def update(self, request, *args, **kwargs):
        try:
            media_id = kwargs.get('pk')
            data = {}
            
            # Extract only the fields we can update
            if 'order' in request.data:
                data['order'] = request.data['order']
                
            if 'is_main_image' in request.data:
                is_main_image = request.data['is_main_image']
                if isinstance(is_main_image, str):
                    is_main_image = is_main_image.lower() == 'true'
                data['is_main_image'] = is_main_image
                
                # If setting as main image, handle the uniqueness constraint
                if is_main_image:
                    portfolio_media = PortfolioMediaService.get_portfolio_media_id(media_id)
                    portfolio_id = portfolio_media.portfolio_id
                    PortfolioMediaService.set_as_main_image(media_id, portfolio_id)
                    return APIResponse.success(
                        "Media updated successfully",
                        self.get_serializer(portfolio_media).data
                    )
            
            # Update other fields if any
            if data:
                portfolio_media = PortfolioMediaService.update_portfolio_media_id(media_id, data)
                return APIResponse.success(
                    "Media updated successfully",
                    self.get_serializer(portfolio_media).data
                )
            else:
                return APIResponse.error(
                    "No valid fields to update",
                    status_code=status.HTTP_400_BAD_REQUEST
                )
                
        except Exception as e:
            return APIResponse.error(
                f"Failed to update media: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
    def destroy(self, request, *args, **kwargs):
        try:
            media_id = kwargs.get('pk')
            PortfolioMediaService.delete_portfolio_media_id(media_id)
            return APIResponse.success(
                "Media deleted successfully",
                status_code=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            return APIResponse.error(
                f"Failed to delete media: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            )
            
    @action(detail=True, methods=['post'])
    def set_as_main(self, request, pk=None):
        try:
            portfolio_media = PortfolioMediaService.get_portfolio_media_id(pk)
            portfolio_id = portfolio_media.portfolio_id
            
            # Set as main image
            PortfolioMediaService.set_as_main_image(pk, portfolio_id)
            
            return APIResponse.success(
                "Media set as main image successfully",
                self.get_serializer(portfolio_media).data
            )
        except Exception as e:
            return APIResponse.error(
                f"Failed to set as main image: {str(e)}",
                status_code=status.HTTP_400_BAD_REQUEST
            ) 