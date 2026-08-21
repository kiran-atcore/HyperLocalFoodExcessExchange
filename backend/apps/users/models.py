from django.contrib.auth.models import AbstractUser
from django.db import models

class RoleType(models.TextChoices):
    DONOR = 'donor', 'Kitchen/Donor'
    SHELTER = 'shelter', 'Shelter/NGO'
    CONSUMER = 'consumer', 'Consumer'

class User(AbstractUser):
    role = models.CharField(max_length=20, choices=RoleType.choices, default=RoleType.CONSUMER)
    email = models.EmailField(unique=True)
    
    business_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'role']
