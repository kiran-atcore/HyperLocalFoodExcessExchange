from rest_framework import viewsets, permissions
from .models import FoodListing
from .serializers import FoodListingSerializer

class FoodListingViewSet(viewsets.ModelViewSet):
    serializer_class = FoodListingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = FoodListing.objects.all()
        # If the requester asks for only their own listings
        if self.request.query_params.get('mine') == 'true':
            queryset = queryset.filter(donor=self.request.user)
            
        listing_type = self.request.query_params.get('listing_type')
        if listing_type:
            queryset = queryset.filter(listing_type=listing_type)
            
        return queryset

    def perform_create(self, serializer):
        serializer.save(donor=self.request.user)
