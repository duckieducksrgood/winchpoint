from django.db import models
from django.conf import settings
from inventoryApp.models import Product

# Create your models here.

class Order(models.Model):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, default='Pending')
    created_at = models.DateTimeField(auto_now_add=True)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    tracking_number = models.CharField(max_length=50, null=True)
    payment_method = models.CharField(max_length=50, null=True)
    proof_of_payment = models.ImageField(upload_to='proof_of_payment/', null=True)

    def __str__(self):
        return f"Order {self.id} by {self.user.username}"
    
class OrderItem(models.Model):
    order = models.ForeignKey(Order, related_name='items', on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.quantity} of {self.product.name} at {self.price}"


class PaymentQrModel(models.Model):
    qr_code = models.ImageField(upload_to='qr_codes/', null=True, blank=True)  # QR code of the payment
    type = models.CharField(max_length=50, default='GCASH')  # Type of the payment

    def __str__(self):
        return self.type

class Cart(models.Model):
    cartID = models.AutoField(primary_key=True)  # ID of the cart
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)  # Customer who owns the cart
    date_added = models.DateTimeField(auto_now_add=True)  # Date and time the cart was created

    def __str__(self):
        return f'{self.customer} - {self.cartID}'

class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')  # Reference to the cart
    product = models.ForeignKey(Product, on_delete=models.CASCADE)  # Reference to the product
    quantity = models.IntegerField()  # Quantity of the product

    def __str__(self):
        return f'{self.cart.customer} - {self.product} - {self.quantity}'
