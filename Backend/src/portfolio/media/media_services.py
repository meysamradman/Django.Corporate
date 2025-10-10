from django.shortcuts import get_object_or_404
from src.portfolio.models.media import PortfolioMedia
from src.media.models.media import Media


class PortfolioMediaService:
    """Service class for handling portfolio media operations"""

    @staticmethod
    def get_portfolio_media_id(media_id):
        """Get portfolio media by ID"""
        return get_object_or_404(PortfolioMedia, id=media_id)

    @staticmethod
    def create_portfolio_media_by_media_id(portfolio, media_id, created_by, is_main_image=False, order=0):
        """
        Link existing central media (by id) to a portfolio without uploading here.

        Args:
            portfolio: Portfolio instance
            media_id: Existing Media.id from central media app
            created_by: User creating the relation
            is_main_image: Whether this is the main image
            order: Display order

        Returns:
            PortfolioMedia instance
        """
        media = get_object_or_404(Media, id=media_id)

        portfolio_media = PortfolioMedia.objects.create(
            portfolio=portfolio,
            media=media,
            is_main_image=is_main_image,
            order=order,
            created_by=created_by
        )

        return portfolio_media

    @staticmethod
    def update_portfolio_media_id(media_id, data):
        """Update portfolio media by ID"""
        portfolio_media = get_object_or_404(PortfolioMedia, id=media_id)
        for key, value in data.items():
            setattr(portfolio_media, key, value)
        # Ensure validation on update if necessary, especially if changing relationships
        portfolio_media.save() 
        return portfolio_media

    @staticmethod
    def delete_portfolio_media_id(media_id):
        """Delete portfolio media by ID"""
        portfolio_media = get_object_or_404(PortfolioMedia, id=media_id)
        # Associated Media object might be deleted automatically based on on_delete=models.CASCADE
        # or might need manual deletion depending on requirements.
        # Ensure the associated file is also deleted from storage (model's delete method handles this)
        portfolio_media.delete()
        return True

    @staticmethod
    def set_as_main_image(portfolio_media_id, portfolio_id):
        """Set a portfolio media as the main image"""
        # First, unset any existing main images for this portfolio
        PortfolioMedia.objects.filter(portfolio_id=portfolio_id, is_main_image=True).update(is_main_image=False)
        
        # Then set the new main image
        portfolio_media = get_object_or_404(PortfolioMedia, id=portfolio_media_id)
        portfolio_media.is_main_image = True
        # Run model validation to ensure only one main image constraint is checked
        portfolio_media.full_clean() 
        portfolio_media.save(update_fields=['is_main_image', 'updated_at', 'updated_by']) # Be specific about updated fields
        return portfolio_media 