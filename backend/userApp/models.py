from django.db import models
from django.contrib.auth.models import AbstractUser
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import serializers

# Custom User model extending AbstractUser
class User(AbstractUser):
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=150, unique=True)
    role = models.CharField(
        max_length=50,
        choices=[
            ('admin', 'Admin'),
            ('customer', 'Customer'),
        ],
        default='customer'
    )
    delivery_address = models.TextField(null=True, blank=True)
    reset_code = models.CharField(max_length=6, null=True, blank=True)

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']

# Serializer for the User model
class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "first_name", "last_name", "email", "username", "role",
            "delivery_address"
        ]


# In your token validation view
@api_view(['GET'])
def get_decoded_token(request):
    try:
        user = request.user  # Get the currently authenticated user
        if not user.is_authenticated:
            return Response({'detail': 'Not authenticated'}, status=401)

        user_data = {
            'username': user.username,
            'role': user.role,
        }
        return Response(user_data)
    except Exception as e:
        return Response({'detail': 'Invalid token'}, status=401)