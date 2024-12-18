# users/serializers.py
from rest_framework import serializers
from .models import User
from django.conf import settings
import boto3
from botocore.exceptions import ClientError

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'username', 'role', 'password', 'date_joined', 'delivery_address']
        extra_kwargs = {
            'password': {'write_only': True}  # Password field is write-only
        }

    def create_presigned_url(self, bucket_name, object_name, expiration=3600):
        """Generate a presigned URL to share an S3 object"""
        s3_client = boto3.client(
            's3',
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_S3_REGION_NAME
        )
        try:
            response = s3_client.generate_presigned_url('put_object',
                                                        Params={'Bucket': bucket_name, 'Key': object_name},
                                                        ExpiresIn=expiration)
        except ClientError as e:
            print(e)
            return None
        return response

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        profile_picture = validated_data.pop('profile_picture', None)
        instance = self.Meta.model(**validated_data)
        if password is not None:
            instance.set_password(password)

        # Handle image upload
        if profile_picture:
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            object_name = f"profile_pictures/{profile_picture.name}"
            presigned_url = self.create_presigned_url(bucket_name, object_name)
            if presigned_url:
                # Upload the image to S3
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                try:
                    s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=profile_picture)
                    instance.profile_picture = object_name
                except ClientError as e:
                    print(e)
                    raise serializers.ValidationError({"profile_picture": "Failed to upload image to S3."})

        instance.save()
        return instance
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        profile_picture = validated_data.pop('profile_picture', None)
        
        # Check and set only fields that are provided
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        # Handle password change if provided
        if password:
            instance.set_password(password)  # Hash the password before saving

        # Handle image upload
        if profile_picture:
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            object_name = f"profile_pictures/{profile_picture.name}"
            presigned_url = self.create_presigned_url(bucket_name, object_name)
            if presigned_url:
                # Upload the image to S3
                s3_client = boto3.client(
                    's3',
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_S3_REGION_NAME
                )
                try:
                    s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=profile_picture)
                    instance.profile_picture = object_name
                except ClientError as e:
                    print(e)
                    raise serializers.ValidationError({"profile_picture": "Failed to upload image to S3."})

        instance.save()
        return instance