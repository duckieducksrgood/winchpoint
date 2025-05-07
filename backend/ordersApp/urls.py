from django.urls import path
from .views import QRCrud, OrderCrud, CartCrud, GeneratePresignedUrl, SendResetCodeView, RevenueReportView

urlpatterns = [
    path('qr/', QRCrud.as_view(), name='qr-crud'),
    path('orders/', OrderCrud.as_view(), name='order-crud'),
    path('cart/', CartCrud.as_view(), name='cart-crud'),
    path('generate-presigned-url/', GeneratePresignedUrl.as_view(), name='generate-presigned-url'),
    path('send-reset-code/', SendResetCodeView.as_view(), name='send-reset-code'),
    path('reports/revenue/', RevenueReportView.as_view(), name='revenue-report'),
]