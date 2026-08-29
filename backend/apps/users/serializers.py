from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude', 'is_approved', 'approval_status', 'rejection_count', 'rejection_reason', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password', 'role', 'business_name', 'phone_number', 'address', 'latitude', 'longitude', 'first_name', 'last_name']
        
    def create(self, validated_data):
        role = validated_data.get('role', 'consumer')
        is_approved = True if role in ['consumer', 'admin'] else False
        approval_status = 'APPROVED' if is_approved else 'PENDING'
        
        user = User.objects.create(
            email=validated_data['email'],
            username=validated_data['username'],
            role=role,
            business_name=validated_data.get('business_name', ''),
            phone_number=validated_data.get('phone_number', ''),
            address=validated_data.get('address', ''),
            latitude=validated_data.get('latitude', None),
            longitude=validated_data.get('longitude', None),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            is_approved=is_approved,
            approval_status=approval_status
        )
        user.set_password(validated_data['password'])
        user.save()
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
