from django.urls import path
from .views import InventoryCrud, CategoryCrud, GeneratePresignedUrl
urlpatterns = [
    path('inventory/', InventoryCrud.as_view()),
    path('category/', CategoryCrud.as_view()),
    #s3 save images for qr code
    path('generate-presigned-url/', GeneratePresignedUrl.as_view(), name='generate_presigned_url'),
]
