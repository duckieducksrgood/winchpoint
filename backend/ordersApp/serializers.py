from rest_framework import serializers
from .models import Order, Cart, CartItem, PaymentQrModel
from inventoryApp.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['productID', 'name', 'price', 'image']

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = CartItem
        fields = ['id', 'cart', 'product', 'quantity']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['cartID', 'customer', 'items', 'date_added']


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = '__all__'  # Fix: Don't mix '__all__' with explicit fields

class PaymentQrSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentQrModel
        fields = '__all__'
