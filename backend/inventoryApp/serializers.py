from rest_framework import serializers
from .models import Product, Category
from django.conf import settings
import boto3
from botocore.exceptions import ClientError

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'


class InventorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
        

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        instance = self.Meta.model(**validated_data)

        # Handle image upload
        if image:
            bucket_name = settings.AWS_STORAGE_BUCKET_NAME
            object_name = f"products/images/{image.name}"
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
                    s3_client.put_object(Bucket=bucket_name, Key=object_name, Body=image)
                    instance.image = object_name
                except ClientError as e:
                    print(e)
                    raise serializers.ValidationError({"image": "Failed to upload image to S3."})
            

        instance.save()
        return instance