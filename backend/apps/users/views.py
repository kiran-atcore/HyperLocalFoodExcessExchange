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
from django.db.models import Sum
from apps.listings.models import FoodListing
from apps.orders.models import Order

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

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
        
        # 3. Portions Saved (Sum of listing quantity for PICKED_UP orders)
        portions_saved_agg = Order.objects.filter(status='PICKED_UP').aggregate(total=Sum('listing__quantity_available'))
        portions_saved = portions_saved_agg['total'] or 0
        
        # 4. Weekly Donations (Mon-Sun for current week)
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        
        weekly_donations = []
        for i in range(7):
            day = start_of_week + timedelta(days=i)
            # count FoodListings created on this day
            count = FoodListing.objects.filter(created_at__date=day).count()
            weekly_donations.append(count)
            
        # 5. Recent Activity
        # Fetch 2 latest users and 2 latest food listings
        latest_users = User.objects.order_by('-date_joined')[:2]
        latest_listings = FoodListing.objects.order_by('-created_at')[:2]
        
        activities = []
        for u in latest_users:
            activities.append({
                "id": f"u_{u.id}",
                "text": f"User {u.username} registered as {u.role}",
                "time": u.date_joined,
                "type": "user"
            })
            
        for l in latest_listings:
            activities.append({
                "id": f"l_{l.id}",
                "text": f"New listing: {l.title} from {l.donor.business_name or l.donor.username}",
                "time": l.created_at,
                "type": "donation"
            })
            
        # Sort by time descending
        activities.sort(key=lambda x: x['time'], reverse=True)
        
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
            "portions_saved": portions_saved,
            "weekly_donations": weekly_donations,
            "recent_activity": activities
        })
