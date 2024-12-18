from rest_framework import serializers
from .models import Order, Cart, CartItem, PaymentQrModel


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['__all__']

class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = ['__all__']

class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ['__all__']

class PaymentQrSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentQrModel
        fields = ['id', 'total_amount']