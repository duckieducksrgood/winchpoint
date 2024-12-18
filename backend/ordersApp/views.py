from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Cart, CartItem, Order, OrderItem, PaymentQrModel
from .serializers import CartItemSerializer, CartSerializer, OrderSerializer, PaymentQrSerializer
from django.conf import settings
import jwt
from django.contrib.auth import get_user_model
from inventoryApp.models import Product

# Create your views here.
User = get_user_model()

class QRCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        payment_qr = PaymentQrModel.objects.all()
        serializer = PaymentQrSerializer(payment_qr, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        serializer = PaymentQrSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, format=None):
        id = request.data.get('id')
        payment_qr = PaymentQrModel.objects.get(id=id)
        serializer = PaymentQrSerializer(payment_qr, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, format=None):
        id = request.data.get('id')
        payment_qr = PaymentQrModel.objects.get(id=id)
        payment_qr.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class OrderCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            role = payload.get('role')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        if role == 'admin':
            orders = Order.objects.all()
        else:
            user = get_object_or_404(User, username=username)
            orders = Order.objects.filter(customer=user)

        serializer = OrderSerializer(orders, many=True)
        return Response(serializer.data)    
    
    def post(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, username=username)
        cart = get_object_or_404(Cart, customer=user)
        cart_items = CartItem.objects.filter(cart=cart)

        order = Order.objects.create(customer=user)
        for item in cart_items:
            order_item = OrderItem.objects.create(order=order, product=item.product, quantity=item.quantity)
            order_item.save()
            item.delete()

        return Response(status=status.HTTP_201_CREATED)
    
    def put(self, request, format=None):
        permission_classes = [IsAuthenticated]
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, username=username)
        order = get_object_or_404(Order, customer=user)
        order.status = request.data.get('status', order.status)
        order.tracking_number = request.data.get('tracking_number', order.tracking_number)
        order.payment_method = request.data.get('payment_method', order.payment_method)
        order.proof_of_payment = request.data.get('proof_of_payment', order.proof_of_payment)
        
        order.save()

        serializer = OrderSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def delete(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, username=username)
        order = get_object_or_404(Order, customer=user)
        order.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):

        cart_user_token = request.COOKIES.get('jwt_access_token', None)

        if cart_user_token:
            try:
                decoded_token = jwt.decode(cart_user_token, settings.SECRET_KEY, algorithms=["HS256"])
                cart_user = Cart.objects.filter(customer=decoded_token['username'])
                serializer = CartSerializer(cart_user, many=True)
                return Response(serializer.data)
            except jwt.ExpiredSignatureError:
                return Response({'message': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
            except jwt.InvalidTokenError:
                return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            cart = Cart.objects.all()
            serializer = CartSerializer(cart, many=True)
            return Response(serializer.data)

    def post(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'message': 'Token not found'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            user = get_object_or_404(User, username=payload['username'])
        except jwt.ExpiredSignatureError:
            return Response({'message': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        
        product_id = request.data.get('product_id')
        quantity = request.data.get('quantity',1)
        

        product = get_object_or_404(Product, productID=product_id)
        cart, created = Cart.objects.get_or_create(customer=user)

        cart_item,created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += quantity
            cart_item.save()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        return Response(status=status.HTTP_201_CREATED)
    
    def put(self, request, format=None):
        permission_classes = [IsAuthenticated]
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, username=username)
        cart_item = get_object_or_404(CartItem, cart__user=user, product__id=request.data.get('product_id'))
        quantity = request.data.get('quantity', cart_item.quantity)

        cart_item.quantity = int(quantity)
        cart_item.save()


        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, format=None):
        access_token = request.COOKIES.get('jwt_access_token')
        if not access_token:
            return Response({'error': 'Please login first'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.ExpiredSignatureError:
            return Response({'error': 'Token has expired'}, status=status.HTTP_401_UNAUTHORIZED)
        except jwt.InvalidTokenError:
            return Response({'error': 'Invalid token'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        user = get_object_or_404(User, username=username)
        cart_item = get_object_or_404(CartItem, cart__user=user, product__id=request.data.get('product_id'))
        cart_item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)