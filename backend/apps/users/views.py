from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, UserSerializer, Base64ImageField
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Q
from apps.listings.models import FoodListing
from apps.orders.models import Order
from django.core.mail import send_mail
from django.conf import settings
from django.core.files.base import ContentFile
import random
import secrets
import requests
import uuid
from .models import ActivityLog, RoleType, EmailOTP

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        action_text = "registered as"
        if user.role in ['donor', 'shelter'] and user.approval_status == 'PENDING':
            action_text = "requested as"
        
        ActivityLog.objects.create(
            text=f"User {user.first_name or user.email} {action_text} {user.role}",
            type="user",
            related_user=user
        )

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, *args, **kwargs):
        user = request.user
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data["refresh"]
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

class UserDetailView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    queryset = User.objects.all()

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
        return super().get_queryset()

class AdminUserListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
            
        queryset = User.objects.exclude(role='admin').order_by('-date_joined')
        
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            
        is_approved = self.request.query_params.get('is_approved')
        if is_approved is not None:
            is_approved = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=is_approved)
            
        return queryset

class PendingApprovalsView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role != 'admin':
            return User.objects.none()
        return User.objects.filter(approval_status='PENDING').exclude(role__in=['consumer', 'admin'])

class ApproveUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            user_to_approve = User.objects.get(pk=pk)
            user_to_approve.is_approved = True
            user_to_approve.approval_status = 'APPROVED'
            user_to_approve.save()
            
            ActivityLog.objects.create(
                text=f"User {user_to_approve.first_name or user_to_approve.email} was approved",
                type="approval",
                related_user=user_to_approve
            )
            
            return Response({"message": "User approved successfully"})
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class RejectUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        try:
            user_to_reject = User.objects.get(pk=pk)
            user_to_reject.is_approved = False
            user_to_reject.rejection_count += 1
            
            # Save the reason provided by the admin
            reason = request.data.get('reason', '')
            user_to_reject.rejection_reason = reason
            
            if user_to_reject.rejection_count >= 3:
                user_to_reject.approval_status = 'BANNED'
            else:
                user_to_reject.approval_status = 'REJECTED'
            user_to_reject.save()
            
            reason_suffix = f" - {reason}" if reason else ""
            if user_to_reject.rejection_count >= 3:
                ActivityLog.objects.create(
                    text=f"User {user_to_reject.first_name or user_to_reject.email} was permanently banned{reason_suffix}",
                    type="ban",
                    related_user=user_to_reject
                )
            else:
                ActivityLog.objects.create(
                    text=f"User {user_to_reject.first_name or user_to_reject.email} was rejected{reason_suffix}",
                    type="rejection",
                    related_user=user_to_reject
                )
            
            return Response({
                "message": f"User rejected. Rejection count: {user_to_reject.rejection_count}",
                "approval_status": user_to_reject.approval_status
            })
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

class ReRequestApprovalView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.approval_status == 'REJECTED' and user.rejection_count < 3:
            user.approval_status = 'PENDING'
            user.rejection_reason = None # Clear reason on re-request
            user.save()
            
            ActivityLog.objects.create(
                text=f"User {user.first_name or user.email} re-requested approval",
                type="rerequest",
                related_user=user
            )
            
            return Response({"message": "Approval re-requested successfully", "approval_status": "PENDING"})
        return Response({"error": "Cannot re-request approval"}, status=status.HTTP_400_BAD_REQUEST)

class AdminDashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        
        # 1. Total Users (exclude admins, pending, banned, rejected)
        total_users = User.objects.filter(approval_status='APPROVED').exclude(role='admin').count()
        
        # 2. Active Kitchens & Shelters
        active_kitchens = User.objects.filter(role='donor', is_approved=True).count()
        active_shelters = User.objects.filter(role='shelter', is_approved=True).count()
        
        # 3. Successful Pickups (Count of PICKED_UP orders)
        successful_pickups = Order.objects.filter(status='PICKED_UP').count()
        
        # 4. Weekly Donations (Rolling 7 days)
        today = timezone.now().date()
        start_of_week = today - timedelta(days=6)
        
        weekly_donations = []
        weekly_labels = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            # Count only successfully picked up orders of type DONATION
            count = Order.objects.filter(
                listing__listing_type='DONATION',
                status='PICKED_UP'
            ).filter(
                Q(picked_up_at__date=day) | Q(picked_up_at__isnull=True, created_at__date=day)
            ).count()
            weekly_donations.append(count)
            weekly_labels.append(day.strftime("%a"))
            
        # 5. Recent Activity
        logs = ActivityLog.objects.order_by('-timestamp')[:5]
        
        activities = []
        for log in logs:
            activities.append({
                "id": f"log_{log.id}",
                "text": log.text,
                "time": log.timestamp,
                "type": log.type
            })
        
        # Format time for UI (basic string)
        from django.utils.timesince import timesince
        for a in activities:
            now = timezone.now()
            # timesince returns string like "2 hours, 14 minutes"
            # we can split by comma and take first part for brevity if we want, or just leave it
            time_str = timesince(a['time'], now).split(',')[0]
            a['time'] = f"{time_str} ago"
            
        return Response({
            "total_users": total_users,
            "active_kitchens": active_kitchens,
            "active_shelters": active_shelters,
            "successful_pickups": successful_pickups,
            "weekly_donations": {
                "values": weekly_donations,
                "labels": weekly_labels,
                "total": sum(weekly_donations)
            },
            "recent_activity": activities
        })

class ActivityLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role != 'admin':
            return ActivityLog.objects.none()
        return ActivityLog.objects.all().order_by('-timestamp')
        
    def get(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        
        activities = []
        for log in queryset:
            activities.append({
                "id": f"log_{log.id}",
                "text": log.text,
                "time": log.timestamp,
                "type": log.type
            })
            
        from django.utils.timesince import timesince
        for a in activities:
            now = timezone.now()
            time_str = timesince(a['time'], now).split(',')[0]
            a['time'] = f"{time_str} ago"
            
        return Response(activities)

class AdminAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)

        # 1. User Distribution
        total_consumers = User.objects.filter(role='consumer').count()
        total_donors = User.objects.filter(role='donor', is_approved=True).count()
        total_shelters = User.objects.filter(role='shelter', is_approved=True).count()

        # Auto-expire overdue orders across platform
        Order.objects.filter(
            listing__pickup_end__lte=timezone.now()
        ).exclude(
            status__in=['PICKED_UP', 'CANCELLED', 'EXPIRED']
        ).update(status='EXPIRED')

        # Also auto-deactivate expired food listings
        FoodListing.objects.filter(
            pickup_end__lte=timezone.now(),
            is_active=True
        ).update(is_active=False)

        # 2. Order Outcomes & Claims / Surplus Distribution (Irrespective of donation or discount)
        picked_up = Order.objects.filter(status='PICKED_UP').count()
        # Active Claims: claims in progress (PENDING or APPROVED) awaiting pickup
        active_claims = Order.objects.filter(status__in=['PENDING', 'APPROVED']).count()
        cancelled = Order.objects.filter(status='CANCELLED').count()
        # Expired: all expired surplus listings + expired unclaimed/unfulfilled orders
        expired_orders_count = Order.objects.filter(status='EXPIRED').count()
        expired_listings_count = FoodListing.objects.filter(pickup_end__lte=timezone.now()).count()
        total_expired = expired_orders_count + expired_listings_count

        # 3. Weekly Donations (Rolling 7 days)
        today = timezone.now().date()
        start_of_week = today - timedelta(days=6)
        
        weekly_donations = []
        weekly_labels = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            # Count only successfully picked up orders of type DONATION
            count = Order.objects.filter(
                listing__listing_type='DONATION',
                status='PICKED_UP'
            ).filter(
                Q(picked_up_at__date=day) | Q(picked_up_at__isnull=True, created_at__date=day)
            ).count()
            weekly_donations.append(count)
            weekly_labels.append(day.strftime("%a"))

        return Response({
            "user_distribution": [
                {"label": "Consumers", "value": total_consumers, "color": "#3b82f6"},
                {"label": "Donors", "value": total_donors, "color": "#f59e0b"},
                {"label": "Shelters", "value": total_shelters, "color": "#8b5cf6"}
            ],
            "order_outcomes": [
                {"label": "Picked Up", "value": picked_up, "color": "#10b981"},
                {"label": "Active Claims", "value": active_claims, "color": "#eab308"},
                {"label": "Cancelled", "value": cancelled, "color": "#ef4444"},
                {"label": "Expired", "value": total_expired, "color": "#64748b"}
            ],
            "weekly_donations": {
                "values": weekly_donations,
                "labels": weekly_labels,
                "total": sum(weekly_donations)
            }
        })


class GoogleLoginView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        action = request.data.get('action', 'login')
        selected_role = request.data.get('role')
        if not token:
            return Response({'detail': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # First try userinfo endpoint with Bearer access token
            google_res = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'},
                timeout=8
            )
            if google_res.status_code != 200:
                # Fallback: check tokeninfo if an ID token was supplied
                google_res = requests.get(
                    f'https://oauth2.googleapis.com/tokeninfo?id_token={token}',
                    timeout=8
                )

            if google_res.status_code != 200:
                return Response({'detail': 'Invalid Google token or session expired.'}, status=status.HTTP_400_BAD_REQUEST)

            data = google_res.json()
            email = data.get('email')
            if not email:
                return Response({'detail': 'Google account email not accessible.'}, status=status.HTTP_400_BAD_REQUEST)

            first_name = data.get('given_name') or (data.get('name', '').split(' ')[0] if data.get('name') else 'User')
            last_name = data.get('family_name', '')

            user = User.objects.filter(email=email).first()
            is_new_user = False

            if not user:
                is_new_user = True
                
                if action == 'check':
                    return Response({
                        'is_new_user': True,
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'picture': data.get('picture', ''),
                    }, status=status.HTTP_200_OK)

                valid_roles = [RoleType.CONSUMER, RoleType.DONOR, RoleType.SHELTER]
                assigned_role = selected_role if selected_role in valid_roles else RoleType.CONSUMER
                is_approved = True if assigned_role == RoleType.CONSUMER else False
                approval_status = 'APPROVED' if is_approved else 'PENDING'

                req_first_name = request.data.get('first_name')
                if req_first_name:
                    first_name = req_first_name
                business_name = request.data.get('business_name', '')
                phone_number = request.data.get('phone_number', '')
                address = request.data.get('address', '')
                latitude = request.data.get('latitude')
                longitude = request.data.get('longitude')
                profile_pic_data = request.data.get('profile_picture')

                profile_pic_file = None
                if profile_pic_data:
                    if isinstance(profile_pic_data, str) and profile_pic_data.startswith('data:image'):
                        try:
                            profile_pic_file = Base64ImageField().to_internal_value(profile_pic_data)
                        except Exception:
                            profile_pic_file = None
                    elif isinstance(profile_pic_data, str) and (profile_pic_data.startswith('http://') or profile_pic_data.startswith('https://')):
                        try:
                            img_res = requests.get(profile_pic_data, timeout=5)
                            if img_res.status_code == 200:
                                ext = 'jpg'
                                file_name = f"{uuid.uuid4().hex[:10]}.{ext}"
                                profile_pic_file = ContentFile(img_res.content, name=file_name)
                        except Exception:
                            profile_pic_file = None

                try:
                    user = User.objects.create_user(
                        email=email,
                        password=None,
                        role=assigned_role,
                        first_name=first_name,
                        last_name=last_name,
                        business_name=business_name,
                        phone_number=phone_number,
                        address=address,
                        latitude=latitude if latitude not in [None, ''] else None,
                        longitude=longitude if longitude not in [None, ''] else None,
                        profile_picture=profile_pic_file,
                        is_approved=is_approved,
                        approval_status=approval_status
                    )
                except Exception as e:
                    # If Cloudinary API key is invalid or upload fails, fall back to creating user without the picture
                    if profile_pic_file and ('api_key' in str(e).lower() or 'cloudinary' in str(e).lower() or 'upload' in str(e).lower()):
                        user = User.objects.create_user(
                            email=email,
                            password=None,
                            role=assigned_role,
                            first_name=first_name,
                            last_name=last_name,
                            business_name=business_name,
                            phone_number=phone_number,
                            address=address,
                            latitude=latitude if latitude not in [None, ''] else None,
                            longitude=longitude if longitude not in [None, ''] else None,
                            profile_picture=None,
                            is_approved=is_approved,
                            approval_status=approval_status
                        )
                    else:
                        raise e
                action_text = "registered as"
                if user.role in ['donor', 'shelter'] and user.approval_status == 'PENDING':
                    action_text = "requested as"

                ActivityLog.objects.create(
                    text=f"User {user.first_name or user.email} {action_text} {user.role} via Google",
                    type="user",
                    related_user=user
                )
            else:
                if action == 'register':
                    return Response({
                        'detail': 'This Google account is already registered. Please sign in instead.'
                    }, status=status.HTTP_400_BAD_REQUEST)

                if selected_role and user.role != selected_role:
                    role_names = {
                        RoleType.CONSUMER: 'Consumer',
                        RoleType.DONOR: 'Kitchen',
                        RoleType.SHELTER: 'Shelter',
                        'admin': 'Admin'
                    }
                    existing_role_str = role_names.get(user.role, user.role.title())
                    selected_role_str = role_names.get(selected_role, selected_role.title())
                    return Response({
                        'role_conflict': True,
                        'detail': f'This Google account is already registered as a {existing_role_str}. Please select {existing_role_str} to sign in.'
                    }, status=status.HTTP_400_BAD_REQUEST)

            refresh = CustomTokenObtainPairSerializer.get_token(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'is_new_user': is_new_user
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Google authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def google_callback_view(request):
    """
    Acts as an authorized HTTPS OAuth redirect endpoint for Google.
    Receives Google's redirect containing tokens/code and immediately hands it back
    to the mobile app via deep linking (mobile://auth).
    """
    html = """<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ResQ Authentication</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #042F2E; color: white;">
    <div style="text-align: center; padding: 24px;">
        <h2 style="margin-bottom: 8px; font-weight: 700;">Redirecting to ResQ...</h2>
        <p style="color: #94A3B8; font-size: 14px;">Completing your secure Google sign-in</p>
    </div>
    <script>
        (function() {
            var hash = window.location.hash ? window.location.hash.substring(1) : '';
            var search = window.location.search ? window.location.search.substring(1) : '';
            var params = hash || search;
            window.location.replace("mobile://auth?" + params);
        })();
    </script>
</body>
</html>"""
    return HttpResponse(html, content_type="text/html")


class SendOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        purpose = request.data.get('purpose', '').strip()

        if not email or '@' not in email:
            return Response({'detail': 'Please provide a valid email address.'}, status=status.HTTP_400_BAD_REQUEST)

        if purpose not in ['registration', 'password_reset']:
            return Response({'detail': 'Invalid purpose specified.'}, status=status.HTTP_400_BAD_REQUEST)

        user_exists = User.objects.filter(email__iexact=email).exists()

        if purpose == 'registration' and user_exists:
            return Response({'detail': 'This email is already registered. Please log in.'}, status=status.HTTP_400_BAD_REQUEST)

        if purpose == 'password_reset' and not user_exists:
            return Response({'detail': 'No account found with this email address.'}, status=status.HTTP_404_NOT_FOUND)

        # 1-minute cooldown check
        last_otp = EmailOTP.objects.filter(email__iexact=email, purpose=purpose).first()
        if last_otp:
            time_since = (timezone.now() - last_otp.created_at).total_seconds()
            if time_since < 60:
                wait_sec = int(60 - time_since)
                return Response({'detail': f'Please wait {wait_sec}s before requesting a new code.', 'cooldown_seconds': wait_sec}, status=status.HTTP_429_TOO_MANY_REQUESTS)

        # Generate 6-digit OTP
        otp_code = f"{random.randint(100000, 999999)}"
        EmailOTP.objects.create(
            email=email,
            otp=otp_code,
            purpose=purpose,
            attempts=0,
            is_verified=False
        )

        subject = "Your ResQ Verification Code"
        if purpose == 'password_reset':
            subject = "ResQ Password Reset Code"

        html_message = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; }}
            .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }}
            .logo {{ color: #042F2E; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 24px; text-align: center; }}
            .badge {{ display: inline-block; background: #0D9488; color: white; padding: 4px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }}
            .otp-box {{ background: #F0FDFA; border: 2px dashed #0D9488; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
            .otp-code {{ font-size: 36px; font-weight: 800; color: #042F2E; letter-spacing: 8px; font-family: monospace; }}
            .footer {{ text-align: center; color: #94A3B8; font-size: 12px; margin-top: 24px; line-height: 1.5; }}
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo">🌿 ResQ</div>
            <div style="text-align: center;">
              <span class="badge">Verification Required</span>
              <h2 style="color: #0F172A; margin: 8px 0 12px; font-size: 20px;">Your 6-Digit Code</h2>
              <p style="color: #64748B; font-size: 14px; margin: 0;">Use the code below to complete your {'registration' if purpose == 'registration' else 'password reset'}.</p>
            </div>
            <div class="otp-box">
              <div class="otp-code">{otp_code}</div>
            </div>
            <p style="color: #E11D48; font-size: 13px; text-align: center; font-weight: 600; margin: 0;">
              ⏱️ Valid for 4 minutes • Max 3 verification attempts
            </p>
            <div class="footer">
              If you didn't request this code, you can safely ignore this email.<br>
              © ResQ Hyperlocal Food Excess Exchange
            </div>
          </div>
        </body>
        </html>
        """

        try:
            send_mail(
                subject=subject,
                message=f"Your ResQ verification code is: {otp_code}. Valid for 4 minutes.",
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message,
                fail_silently=False
            )
        except Exception as e:
            print(f"Error sending email via Brevo: {e}")
            return Response({'detail': 'Failed to send verification email. Please try again.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            'message': 'Verification code sent to your email.',
            'expires_in_seconds': 240,
            'can_resend_in_seconds': 60
        }, status=status.HTTP_200_OK)


class VerifyOTPView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        otp = request.data.get('otp', '').strip()
        purpose = request.data.get('purpose', '').strip()

        if not email or not otp or not purpose:
            return Response({'detail': 'Email, OTP, and purpose are required.'}, status=status.HTTP_400_BAD_REQUEST)

        record = EmailOTP.objects.filter(email__iexact=email, purpose=purpose).first()
        if not record:
            return Response({'detail': 'No verification code requested for this email.'}, status=status.HTTP_400_BAD_REQUEST)

        # 4-minute validity
        if timezone.now() > record.created_at + timedelta(minutes=4):
            return Response({'detail': 'Verification code has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)

        if record.is_verified:
            return Response({'detail': 'This code has already been verified.'}, status=status.HTTP_400_BAD_REQUEST)

        if record.attempts >= 3:
            return Response({'detail': 'Maximum verification attempts exceeded. Please request a new code.', 'attempts_remaining': 0}, status=status.HTTP_400_BAD_REQUEST)

        record.attempts += 1
        record.save()

        if record.otp != otp:
            remaining = 3 - record.attempts
            if remaining > 0:
                return Response({'detail': f'Incorrect code. {remaining} attempt(s) remaining.', 'attempts_remaining': remaining}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({'detail': 'Maximum verification attempts exceeded. Please request a new code.', 'attempts_remaining': 0}, status=status.HTTP_400_BAD_REQUEST)

        record.is_verified = True
        reset_token = secrets.token_urlsafe(32)
        record.reset_token = reset_token
        record.save()

        return Response({
            'message': 'Code verified successfully.',
            'reset_token': reset_token
        }, status=status.HTTP_200_OK)


class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        reset_token = request.data.get('reset_token', '').strip()
        new_password = request.data.get('new_password', '')

        if not email or not reset_token or not new_password:
            return Response({'detail': 'Email, reset token, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({'detail': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        record = EmailOTP.objects.filter(
            email__iexact=email,
            purpose='password_reset',
            reset_token=reset_token,
            is_verified=True
        ).first()

        if not record or timezone.now() > record.created_at + timedelta(minutes=15):
            return Response({'detail': 'Invalid or expired password reset session. Please request a new OTP.'}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()

        record.delete()

        ActivityLog.objects.create(
            text=f"Password reset for user {user.first_name or user.email}",
            type="user",
            related_user=user
        )

        return Response({'message': 'Password has been reset successfully. Please log in.'}, status=status.HTTP_200_OK)

