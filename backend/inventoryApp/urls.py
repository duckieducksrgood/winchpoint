from django.urls import path
from .views import InventoryCrud, CategoryCrud
urlpatterns = [
    path('inventory/', InventoryCrud.as_view()),
    path('category/', CategoryCrud.as_view()),
]
