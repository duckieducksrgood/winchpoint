from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404
from .models import Product, Category
from .serializers import InventorySerializer, CategorySerializer
from django.conf import settings
import jwt
import boto3
from botocore.exceptions import ClientError


# Create your views here.

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
        object_name = f"products/images/{file_name}"

        presigned_post = create_presigned_post(bucket_name, object_name, fields={"Content-Type": file_type}, conditions=[{"Content-Type": file_type}])

        if presigned_post is None:
            return Response({'error': 'Could not generate presigned URL'}, status=500)

        return Response({'url': presigned_post['url'], 'fields': presigned_post['fields']}, status=200)


class InventoryCrud(APIView):
    # permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
            inventory = Product.objects.all()
            serializer = InventorySerializer(inventory, many=True)
            return Response(serializer.data)
        

    def post(self, request, format=None):
        # Handle image separately
        image_url = request.data.pop('image', None)
        serializer = InventorySerializer(data=request.data, partial=True)
        if serializer.is_valid():
            inventory = serializer.save()
            if image_url:
                object_name = f"products/images/{image_url}"
                inventory.image = object_name
                inventory.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, format=None):
        id = request.data.get('productID')
        if not id:
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inventory = Product.objects.get(productID=id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        # Handle image separately
        image_url = request.data.pop('image', None)
        object_name = f"products/images/{image_url}"
        if image_url:
            inventory.image = object_name
            inventory.save()
        

        # Update other fields using the serializer
        serializer = InventorySerializer(inventory, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    
    def delete(self, request, format=None):
        id = request.data.get('productID')
        if not id:
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            inventory = Product.objects.get(productID=id)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        inventory.delete()
        return Response({"message": "Product deleted successfully"}, status=status.HTTP_204_NO_CONTENT)

    
class CategoryCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
        try:
            category = Category.objects.all()
            serializer = CategorySerializer(category, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def post(self, request, format=None):
        try:
            serializer = CategorySerializer(data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def put(self, request, format=None):
        try:
            id = request.data.get('categoryID')
            category = Category.objects.get(categoryID=id)
            serializer = CategorySerializer(category, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request, format=None):
        try:
            id = request.data.get('categoryID')
            category = Category.objects.get(categoryID=id)
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Category.DoesNotExist:
            return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)