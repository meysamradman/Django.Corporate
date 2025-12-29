from django.db import transaction
from django.db.models import Max
from src.real_estate.models.floor_plan import RealEstateFloorPlan
from src.real_estate.models.floor_plan_media import FloorPlanImage
from src.media.models.media import ImageMedia
from src.media.services.media_services import MediaAdminService


class FloorPlanMediaService:
    """
    Service for managing FloorPlanImage relationships (inspired by PortfolioAdminMediaService)
    """

    @staticmethod
    def get_next_image_order(floor_plan_id):
        """Get next available order number for floor plan images"""
        max_order = FloorPlanImage.objects.filter(
            floor_plan_id=floor_plan_id
        ).aggregate(Max('order'))['order__max']
        
        return (max_order or 0) + 1

    @staticmethod
    def get_existing_image_ids(floor_plan_id, image_ids):
        """Get IDs of images already linked to this floor plan"""
        if not image_ids:
            return set()
        
        return set(
            FloorPlanImage.objects.filter(
                floor_plan_id=floor_plan_id,
                image_id__in=image_ids
            ).values_list('image_id', flat=True)
        )

    @staticmethod
    def add_images_bulk(floor_plan_id, image_files=None, image_ids=None):
        """
        Add multiple images to floor plan
        
        Args:
            floor_plan_id: Floor plan ID
            image_files: List of uploaded image files
            image_ids: List of existing ImageMedia IDs
            
        Returns:
            dict: {created_count, failed_ids, failed_files}
        """
        try:
            floor_plan = RealEstateFloorPlan.objects.get(id=floor_plan_id)
        except RealEstateFloorPlan.DoesNotExist:
            raise RealEstateFloorPlan.DoesNotExist("Floor plan not found")
        
        image_files = image_files or []
        image_ids = image_ids or []
        
        created_count = 0
        failed_ids = []
        failed_files = []
        
        # 1. Upload new image files
        if image_files:
            uploaded_images = []
            
            for image_file in image_files:
                try:
                    # Create ImageMedia using MediaAdminService
                    image_media = MediaAdminService.create_media('image', {
                        'file': image_file,
                        'title': f"Floor Plan Image - {floor_plan.title}",
                    })
                    uploaded_images.append(image_media)
                except Exception as e:
                    failed_files.append({
                        'name': image_file.name,
                        'error': str(e)
                    })
                    continue
            
            if uploaded_images:
                next_order = FloorPlanMediaService.get_next_image_order(floor_plan_id)
                
                # Check if floor plan has main image
                has_main = FloorPlanImage.objects.filter(
                    floor_plan=floor_plan,
                    is_main=True
                ).exists()
                
                # Create FloorPlanImage objects
                floor_plan_images = []
                for i, image_media in enumerate(uploaded_images):
                    should_be_main = (i == 0) and not has_main
                    
                    floor_plan_images.append(
                        FloorPlanImage(
                            floor_plan=floor_plan,
                            image=image_media,
                            is_main=should_be_main,
                            order=next_order + i,
                            title=f"Image {next_order + i + 1}"
                        )
                    )
                    
                    if should_be_main:
                        has_main = True
                
                if floor_plan_images:
                    FloorPlanImage.objects.bulk_create(floor_plan_images)
                    created_count += len(floor_plan_images)
        
        # 2. Link existing images by IDs
        if image_ids:
            image_ids_list = list(set(image_ids))
            
            # Get existing ImageMedia objects
            existing_images = ImageMedia.objects.filter(id__in=image_ids_list)
            image_dict = {img.id: img for img in existing_images}
            
            # Get already linked images
            already_linked = FloorPlanMediaService.get_existing_image_ids(
                floor_plan_id, image_ids_list
            )
            
            # Create links for new images
            images_to_link = []
            for image_id in image_ids_list:
                if image_id in already_linked:
                    continue
                
                if image_id in image_dict:
                    images_to_link.append(image_dict[image_id])
                else:
                    failed_ids.append(image_id)
            
            if images_to_link:
                next_order = FloorPlanMediaService.get_next_image_order(floor_plan_id)
                
                has_main = FloorPlanImage.objects.filter(
                    floor_plan=floor_plan,
                    is_main=True
                ).exists()
                
                floor_plan_images = []
                for i, image_media in enumerate(images_to_link):
                    should_be_main = (i == 0) and not has_main
                    
                    floor_plan_images.append(
                        FloorPlanImage(
                            floor_plan=floor_plan,
                            image=image_media,
                            is_main=should_be_main,
                            order=next_order + i
                        )
                    )
                    
                    if should_be_main:
                        has_main = True
                
                if floor_plan_images:
                    FloorPlanImage.objects.bulk_create(floor_plan_images)
                    created_count += len(floor_plan_images)
        
        # 3. Ensure at least one main image
        if created_count > 0:
            has_main = FloorPlanImage.objects.filter(
                floor_plan_id=floor_plan_id,
                is_main=True
            ).exists()
            
            if not has_main:
                first_image = FloorPlanImage.objects.filter(
                    floor_plan_id=floor_plan_id
                ).order_by('order', 'created_at').first()
                
                if first_image:
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
        
        return {
            'created_count': created_count,
            'failed_ids': failed_ids,
            'failed_files': failed_files
        }

    @staticmethod
    def sync_images(floor_plan_id, image_ids, main_image_id=None):
        """
        Sync floor plan images (remove old, add new)
        
        Args:
            floor_plan_id: Floor plan ID
            image_ids: List of image IDs that should be linked
            main_image_id: ID of image to set as main
            
        Returns:
            dict: {removed_count, added_count, total_count}
        """
        try:
            floor_plan = RealEstateFloorPlan.objects.get(id=floor_plan_id)
        except RealEstateFloorPlan.DoesNotExist:
            raise RealEstateFloorPlan.DoesNotExist("Floor plan not found")
        
        if image_ids is None:
            return {
                'removed_count': 0,
                'added_count': 0,
                'total_count': 0
            }
        
        image_ids_set = set(image_ids) if isinstance(image_ids, (list, tuple)) else set()
        
        # Get currently linked images
        current_image_ids = set(
            FloorPlanImage.objects.filter(
                floor_plan_id=floor_plan_id
            ).values_list('image_id', flat=True)
        )
        
        # Calculate what to remove/add
        images_to_remove = current_image_ids - image_ids_set
        images_to_add = image_ids_set - current_image_ids
        
        with transaction.atomic():
            # Get current main image
            current_main_id = None
            main_image_obj = FloorPlanImage.objects.filter(
                floor_plan_id=floor_plan_id,
                is_main=True
            ).first()
            if main_image_obj:
                current_main_id = main_image_obj.image_id
            
            # Remove old images
            if images_to_remove:
                # If removing main image, unset it first
                if current_main_id and current_main_id in images_to_remove:
                    FloorPlanImage.objects.filter(
                        floor_plan_id=floor_plan_id,
                        is_main=True
                    ).update(is_main=False)
                    current_main_id = None
                
                FloorPlanImage.objects.filter(
                    floor_plan_id=floor_plan_id,
                    image_id__in=images_to_remove
                ).delete()
            
            # Set main image if specified
            if main_image_id is not None:
                FloorPlanImage.objects.filter(
                    floor_plan_id=floor_plan_id,
                    is_main=True
                ).update(is_main=False)
                
                floor_plan_image = FloorPlanImage.objects.filter(
                    floor_plan_id=floor_plan_id,
                    image_id=main_image_id
                ).first()
                
                if floor_plan_image:
                    floor_plan_image.is_main = True
                    floor_plan_image.save(update_fields=['is_main'])
            
            # Add new images
            if images_to_add:
                FloorPlanMediaService.add_images_bulk(
                    floor_plan_id=floor_plan_id,
                    image_ids=list(images_to_add)
                )
                
                # If main_image_id was in newly added images, set it as main
                if main_image_id is not None and main_image_id in images_to_add:
                    FloorPlanImage.objects.filter(
                        floor_plan_id=floor_plan_id,
                        is_main=True
                    ).exclude(image_id=main_image_id).update(is_main=False)
                    
                    floor_plan_image = FloorPlanImage.objects.filter(
                        floor_plan_id=floor_plan_id,
                        image_id=main_image_id
                    ).first()
                    
                    if floor_plan_image:
                        floor_plan_image.is_main = True
                        floor_plan_image.save(update_fields=['is_main'])
        
        return {
            'removed_count': len(images_to_remove),
            'added_count': len(images_to_add),
            'total_count': len(image_ids_set)
        }

    @staticmethod
    def set_main_image(floor_plan_id, image_id):
        """Set an image as the main image for floor plan"""
        try:
            floor_plan = RealEstateFloorPlan.objects.get(id=floor_plan_id)
        except RealEstateFloorPlan.DoesNotExist:
            raise RealEstateFloorPlan.DoesNotExist("Floor plan not found")
        
        # Unset current main
        FloorPlanImage.objects.filter(
            floor_plan=floor_plan,
            is_main=True
        ).update(is_main=False)
        
        # Set new main
        floor_plan_image = FloorPlanImage.objects.filter(
            floor_plan=floor_plan,
            image_id=image_id
        ).first()
        
        if not floor_plan_image:
            raise FloorPlanImage.DoesNotExist("Image not found in this floor plan")
        
        floor_plan_image.is_main = True
        floor_plan_image.save(update_fields=['is_main'])
        
        return floor_plan_image

    @staticmethod
    def remove_image(floor_plan_id, image_id):
        """Remove a single image from floor plan"""
        deleted_count = FloorPlanImage.objects.filter(
            floor_plan_id=floor_plan_id,
            image_id=image_id
        ).delete()[0]
        
        # If removed image was main, set first remaining as main
        if deleted_count > 0:
            has_main = FloorPlanImage.objects.filter(
                floor_plan_id=floor_plan_id,
                is_main=True
            ).exists()
            
            if not has_main:
                first_image = FloorPlanImage.objects.filter(
                    floor_plan_id=floor_plan_id
                ).order_by('order', 'created_at').first()
                
                if first_image:
                    first_image.is_main = True
                    first_image.save(update_fields=['is_main'])
        
        return deleted_count > 0
