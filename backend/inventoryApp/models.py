from django.db import models

# Create your models here.
class Product(models.Model):
    productID = models.AutoField(primary_key=True)  # ID of the product
    name = models.CharField(max_length=255)  # Name of the product
    description = models.TextField()  # Description of the product
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Price of the product
    stock = models.IntegerField()  # Stock of the product
    image = models.ImageField(upload_to='product_images/', null=True, blank=True)  # Image of the product
    date_added = models.DateTimeField(auto_now_add=True)  # Date and time the product was added
    date_updated = models.DateTimeField(auto_now=True)  # Date and time the product was last updated
    category = models.ForeignKey('Category', on_delete=models.CASCADE)  # Category of the product
    onSale = models.BooleanField(default=False)  # If the product is on sale
    salePrice = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=0.00)  # Sale price of the product

    def __str__(self):
        return self.name
    

class Category(models.Model):
    categoryID = models.AutoField(primary_key=True)  # ID of the category
    name = models.CharField(max_length=255)  # Name of the category
    description = models.TextField()  # Description of the category
    date_added = models.DateTimeField(auto_now_add=True)  # Date and time the category was added
    date_updated = models.DateTimeField(auto_now=True)  # Date and time the category was last updated

    def __str__(self):
        return self.name
