from django.urls import path, include
from rest_framework.routers import DefaultRouter
from src.ticket.views import AdminTicketViewSet, AdminTicketMessageViewSet, PublicTicketViewSet

router = DefaultRouter()
router.register(r'admin/tickets', AdminTicketViewSet, basename='admin-tickets')
router.register(r'admin/ticket-messages', AdminTicketMessageViewSet, basename='admin-ticket-messages')
router.register(r'public/tickets', PublicTicketViewSet, basename='public-tickets')

urlpatterns = [
    path('', include(router.urls)),
]

