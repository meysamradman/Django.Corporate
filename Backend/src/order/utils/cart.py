from django.db import models
from src.order.models.cart import Cart, CartItem


class CartManager:
    
    @staticmethod
    def get_or_create_cart(user=None, session_key=None):
        if user:
            cart, created = Cart.objects.get_or_create(
                user=user,
                is_active=True,
                defaults={'session_key': None}
            )
        elif session_key:
            cart, created = Cart.objects.get_or_create(
                session_key=session_key,
                is_active=True,
                defaults={'user': None}
            )
        else:
            raise ValueError("Either user or session_key must be provided")
        
        return cart, created
    
    @staticmethod
    def add_item(cart, product, quantity=1):
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        
        return cart_item
    
    @staticmethod
    def update_item_quantity(cart_item, quantity):
        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()
    
    @staticmethod
    def remove_item(cart_item):
        cart_item.delete()
    
    @staticmethod
    def clear_cart(cart):
        cart.clear()
