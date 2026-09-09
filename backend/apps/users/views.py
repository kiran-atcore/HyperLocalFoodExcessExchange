from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from .serializers import RegisterSerializer, CustomTokenObtainPairSerializer, UserSerializer
from django.utils import timezone
from datetime import timedelta
from django.db.models import Sum, Q
from apps.listings.models import FoodListing
from apps.orders.models import Order

import requests
from .models import ActivityLog, RoleType

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
            if not user:
                user = User.objects.create_user(
                    email=email,
                    password=None,
                    role=RoleType.CONSUMER,
                    first_name=first_name,
                    last_name=last_name,
                    is_approved=True,
                    approval_status='APPROVED'
                )
                ActivityLog.objects.create(
                    text=f"User {user.first_name or user.email} signed up via Google",
                    type="user",
                    related_user=user
                )

            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Google authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
