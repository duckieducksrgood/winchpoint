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
import boto3
from botocore.exceptions import ClientError

# Create your views here.
User = get_user_model()

def create_presigned_post(bucket_name, object_name, fields=None, conditions=None, expiration=3600):
    """Generate a presigned URL S3 POST request to upload a file"""
    s3_client = boto3.client(
        's3',
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_S3_REGION_NAME
    )
    try:
        response = s3_client.generate_presigned_post(bucket_name, object_name, Fields=fields, Conditions=conditions, ExpiresIn=expiration)
    except ClientError as e:
        print(e)
        return None
    return response


class GeneratePresignedUrl(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type')

        if not file_name or not file_type:
            return Response({'error': 'File name and file type are required'}, status=400)

        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        object_name = f"payment/images/{file_name}"

        presigned_post = create_presigned_post(bucket_name, object_name, fields={"Content-Type": file_type}, conditions=[{"Content-Type": file_type}])

        if presigned_post is None:
            return Response({'error': 'Could not generate presigned URL'}, status=500)

        return Response({'url': presigned_post['url'], 'fields': presigned_post['fields']}, status=200)

class QRCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        payment_qr = PaymentQrModel.objects.all()
        serializer = PaymentQrSerializer(payment_qr, many=True)
        return Response(serializer.data)
    
    def post(self, request, format=None):
        qr_image = request.data.get('file_name')
        serializer = PaymentQrSerializer(data=request.data)
        if serializer.is_valid():
            qrPayment = serializer.save()
            if qr_image:
                qrPayment.qr_code = f"payment/images/{qr_image}"
                qrPayment.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, format=None):
        type = request.data.get('type')
        payment_qr = PaymentQrModel.objects.get(type=type)
        serializer = PaymentQrSerializer(payment_qr, data=request.data)
        if serializer.is_valid():
            payment_qr.qr_code = f"payment/images/{request.data.get('file_name')}"
            payment_qr.save()
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
            # Validate token
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)

            # Get user and cart
            user = get_object_or_404(User, username=username)
            cart = get_object_or_404(Cart, customer=user)
            
            # Get form data
            items = request.data.get('items', '')
            total_price = request.data.get('total_price')
            payment_method = request.data.get('payment_method')
            delivery_address = request.data.get('delivery_address')
            proof_of_payment = request.FILES.get('proof_of_payment')

            # Validate required fields
            if not all([items, total_price, payment_method, delivery_address, proof_of_payment]):
                return Response({
                    'error': 'Missing required fields',
                    'received': {
                        'items': bool(items),
                        'total_price': bool(total_price),
                        'payment_method': bool(payment_method),
                        'delivery_address': bool(delivery_address),
                        'proof_of_payment': bool(proof_of_payment),
                    }
                }, status=status.HTTP_400_BAD_REQUEST)

            # Convert items string to list
            selected_items = [int(item) for item in items.split(',') if item]
            cart_items = CartItem.objects.filter(cart=cart, id__in=selected_items)

            if not cart_items.exists():
                return Response({'error': 'No valid cart items selected'}, status=status.HTTP_400_BAD_REQUEST)

            # Create order
            order = Order.objects.create(
                customer=user,
                total_price=total_price,
                payment_method=payment_method,
                proof_of_payment=proof_of_payment,
                order_delivery_address=delivery_address
            )

            # Create order items and remove from cart
            for item in cart_items:
                OrderItem.objects.create(
                    order=order,
                    product=item.product,
                    quantity=item.quantity,
                    price=item.product.price
                )
                item.delete()

            return Response({
                'message': 'Order created successfully',
                'order_id': order.id
            }, status=status.HTTP_201_CREATED)

        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
        except ValueError as e:
            return Response({'error': f'Invalid data format: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    def put(self, request):
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

        order_id = request.data.get('order_id')
        if not order_id:
            return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)

        if role == 'admin':
            order = get_object_or_404(Order, id=order_id)
        else:
            user = get_object_or_404(User, username=username)
            order = get_object_or_404(Order, id=order_id, customer=user)
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
            # Decode token
            payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return Response({'error': 'Invalid token payload'}, status=status.HTTP_401_UNAUTHORIZED)

            # Get user and specific order
            user = get_object_or_404(User, username=username)
            order_id = request.data.get('order_id')
            
            if not order_id:
                return Response({'error': 'Order ID is required'}, status=status.HTTP_400_BAD_REQUEST)
                
            order = Order.objects.get(id=order_id, customer=user)
            order.status = 'Cancelled'
            order.save()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
                
        except Order.DoesNotExist:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)
        except Order.MultipleObjectsReturned:
            return Response({'error': 'Multiple orders found'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CartCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        cart_user_token = request.COOKIES.get('jwt_access_token')
        if not cart_user_token:
            return Response({'message': 'No token found'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded_token = jwt.decode(cart_user_token, settings.SECRET_KEY, algorithms=["HS256"])
            cart = Cart.objects.filter(customer=decoded_token['username']).first()
            if not cart:
                user = get_object_or_404(User, username=decoded_token['username'])
                cart = Cart.objects.create(customer=user)
            serializer = CartSerializer(cart)
            return Response(serializer.data)
        except jwt.ExpiredSignatureError:
            return Response({'message': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except jwt.InvalidTokenError:
            return Response({'message': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
        
       

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
        
        try:
                    product_id = request.data.get('product_id')
                    if not product_id:
                        return Response({'error': 'Product ID is required'}, status=status.HTTP_400_BAD_REQUEST)

                    quantity = request.data.get('quantity', 1)
                    if not isinstance(quantity, (int, float)) or quantity <= 0:
                        return Response({'error': 'Invalid quantity'}, status=status.HTTP_400_BAD_REQUEST)

                    product = get_object_or_404(Product, productID=product_id)
                    print(f"product stock: {product.stock}, quantity: {quantity}")
                    
                    # Fixed stock check condition
                    if product.stock < quantity:
                        return Response(
                            {'message': 'Product is not available or insufficient stock'}, 
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    cart, created = Cart.objects.get_or_create(customer=user)

                    cart_item, created = CartItem.objects.get_or_create(
                        cart=cart,
                        product=product,
                        defaults={'quantity': quantity}
                    )

                    if not created:
                        cart_item.quantity += quantity
                        cart_item.save()
                    else:
                        cart_item.quantity = quantity
                        cart_item.save()

                    return Response(
                        {'message': 'Item added to cart successfully'}, 
                        status=status.HTTP_201_CREATED
                    )

        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
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
                
            user = get_object_or_404(User, username=username)
            product_id = request.data.get('product_id')
            
            cart_item = CartItem.objects.get(
                cart__customer=user,
                product__productID=product_id
            )
            cart_item.delete()
            
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except CartItem.DoesNotExist:
            return Response({'error': 'Cart item not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)