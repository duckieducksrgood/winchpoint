from django.urls import path
from .views import QRCrud, OrderCrud, CartCrud,GeneratePresignedUrl

urlpatterns = [
    path('qr/', QRCrud.as_view(), name='qr_crud'),
    path('orders/', OrderCrud.as_view(), name='order_crud'),
    path('cart/', CartCrud.as_view(), name='cart_crud'),
    path('generate_presigned_url_payment/', GeneratePresignedUrl.as_view(), name='generate_presigned_url'),
    
]