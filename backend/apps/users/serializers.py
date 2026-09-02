from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

import base64
import uuid
from django.core.files.base import ContentFile

class Base64ImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if data == "" or data is None:
            return None
        if isinstance(data, str) and data.startswith('data:image'):
            # Format: data:image/png;base64,...
            format_str, imgstr = data.split(';base64,')
            ext = format_str.split('/')[-1]
            if ext == 'jpeg':
                ext = 'jpg'
            file_name = f"{uuid.uuid4().hex[:10]}.{ext}"
            data = ContentFile(base64.b64decode(imgstr), name=file_name)
        elif isinstance(data, str) and (data.startswith('http://') or data.startswith('https://') or data.startswith('/media/')):
            # Existing image URL passed back, don't re-save or clear
            raise serializers.SkipField()
        return super().to_internal_value(data)

class UserSerializer(serializers.ModelSerializer):
    profile_picture = Base64ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ['id', 'email', 'role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude', 'profile_picture', 'is_approved', 'approval_status', 'rejection_count', 'rejection_reason', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    profile_picture = Base64ImageField(required=False, allow_null=True)
    
    class Meta:
        model = User
        fields = ['email', 'password', 'role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude', 'profile_picture', 'first_name', 'last_name']
        
    def create(self, validated_data):
        role = validated_data.get('role', 'consumer')
        is_approved = True if role in ['consumer', 'admin'] else False
        approval_status = 'APPROVED' if is_approved else 'PENDING'
        
        user = User.objects.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            role=role,
            business_name=validated_data.get('business_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            latitude=validated_data.get('latitude', None),
            longitude=validated_data.get('longitude', None),
            profile_picture=validated_data.get('profile_picture', None),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_approved=is_approved,
            approval_status=approval_status
        )
        return user

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['email'] = user.email
        token['is_approved'] = user.is_approved
        token['approval_status'] = user.approval_status
        token['rejection_count'] = user.rejection_count
        token['rejection_reason'] = user.rejection_reason
        return token
