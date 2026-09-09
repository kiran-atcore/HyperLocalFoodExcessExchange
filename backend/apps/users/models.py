from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class RoleType(models.TextChoices):
    DONOR = 'donor', 'Kitchen/Donor'
    SHELTER = 'shelter', 'Shelter/NGO'
    CONSUMER = 'consumer', 'Consumer'
    ADMIN = 'admin', 'Admin'

class User(AbstractUser):
    username = None
    role = models.CharField(max_length=20, choices=RoleType.choices, default=RoleType.CONSUMER)
    email = models.EmailField(unique=True)
    
    business_name = models.CharField(max_length=255, blank=True)
    phone_number = models.CharField(max_length=50, blank=True)
    address = models.CharField(max_length=255, blank=True)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pics/', null=True, blank=True)
    is_approved = models.BooleanField(default=False)
    
    APPROVAL_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('BANNED', 'Banned'),
    ]
    approval_status = models.CharField(max_length=20, choices=APPROVAL_CHOICES, default='PENDING')
    rejection_count = models.IntegerField(default=0)
    rejection_reason = models.TextField(blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['role']
    
    objects = CustomUserManager()

class ActivityLog(models.Model):
    TYPE_CHOICES = [
        ('user', 'User Registration'),
        ('donation', 'New Donation'),
        ('rejection', 'User Rejection'),
        ('approval', 'User Approval'),
        ('rerequest', 'Re-request Approval'),
        ('ban', 'User Banned')
    ]
    
    text = models.CharField(max_length=500)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES)
    timestamp = models.DateTimeField(auto_now_add=True)
    related_user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='activity_logs')

    class Meta:
        ordering = ['-timestamp']

class EmailOTP(models.Model):
    PURPOSE_CHOICES = [
        ('registration', 'Registration'),
        ('password_reset', 'Password Reset'),
    ]

    email = models.EmailField()
    otp = models.CharField(max_length=6)
    purpose = models.CharField(max_length=30, choices=PURPOSE_CHOICES)
    attempts = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now=True)
    is_verified = models.BooleanField(default=False)
    reset_token = models.CharField(max_length=100, blank=True, null=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.email} - {self.purpose} - {self.otp}"

