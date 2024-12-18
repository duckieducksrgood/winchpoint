# users/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom User model extending AbstractUser
class User(AbstractUser):
    first_name = models.CharField(max_length=255)  # First name of the user
    last_name = models.CharField(max_length=255)   # Last name of the user
    email = models.EmailField(max_length=255, unique=True)  # User email, must be unique
    username = models.CharField(max_length=150, unique=True)  # Username for the user
    role = models.CharField(
        max_length=50,
        choices=[
            ('admin', 'Admin'),
            ('customer', 'Customer'),
        ],
        default='customer'  # Default role is customer
    )
    # profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True, default='/images/default.png')  # Profile picture of the user
    delivery_address = models.TextField(null=True, blank=True)  # Delivery address of the user

    USERNAME_FIELD = 'username'  # Username is the unique identifier
    REQUIRED_FIELDS = ['email']  # Email is required for creating a user