from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CustomTokenObtainPairView, DeleteAccountView, 
    LogoutView, UserProfileView, PendingApprovalsView, ApproveUserView, RejectUserView, UserDetailView, ReRequestApprovalView, AdminDashboardStatsView, AdminUserListView, ActivityLogListView, AdminAnalyticsView,
    GoogleLoginView
)

urlpatterns = [
    path('admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
    path('admin/list/', AdminUserListView.as_view(), name='admin_user_list'),
    path('admin/activity-logs/', ActivityLogListView.as_view(), name='admin_activity_logs'),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('google-login/', GoogleLoginView.as_view(), name='google_login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('delete/', DeleteAccountView.as_view(), name='delete_account'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', UserProfileView.as_view(), name='user_profile'),
    path('me/re_request/', ReRequestApprovalView.as_view(), name='re_request_approval'),
    
    path('pending_approvals/', PendingApprovalsView.as_view(), name='pending_approvals'),
    path('<int:pk>/', UserDetailView.as_view(), name='user_detail'),
    path('<int:pk>/approve/', ApproveUserView.as_view(), name='approve_user'),
    path('<int:pk>/reject/', RejectUserView.as_view(), name='reject_user'),
]
