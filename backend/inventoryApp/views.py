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
# Create your views here.


class InventoryCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
            inventory = Product.objects.all()
            serializer = InventorySerializer(inventory, many=True)
            return Response(serializer.data)
        

    def post(self, request, format=None):
        serializer = InventorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put (self, request, format=None):
        id = request.data.get('id')
        inventory = Product.objects.get(id=id)
        serializer = InventorySerializer(inventory, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)\
    
    def delete (self, request, format=None):
        id = request.data.get('id')
        inventory = Product.objects.get(id=id)
        inventory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class CategoryCrud(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, format=None):
            category = Category.objects.all()
            serializer = CategorySerializer(category, many=True)
            return Response(serializer.data)
        

    def post(self, request, format=None):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put (self, request, format=None):
        id = request.data.get('id')
        category = Category.objects.get(id=id)
        serializer = CategorySerializer(category, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)\
    
    def delete (self, request, format=None):
        id = request.data.get('id')
        category = Category.objects.get(id=id)
        category.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)