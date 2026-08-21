from rest_framework import viewsets, permissions
from .models import FoodListing
from .serializers import FoodListingSerializer
from .ai_valuation import evaluate_donation_value

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
        # We need to evaluate the estimated FMV before saving
        data = serializer.validated_data
        
        claimed_value = data.get('estimated_fmv', 0)
        title = data.get('title', '')
        description = data.get('description', '')
        qty = data.get('quantity_available', 1)
        unit = data.get('quantity_unit', 'portions')
        
        user = self.request.user
        business_type = getattr(user, 'business_name', 'Unknown Retailer')
        
        ai_result = evaluate_donation_value(
            title=title, 
            description=description, 
            quantity=qty, 
            quantity_unit=unit, 
            claimed_value=claimed_value, 
            donor_business_type=business_type
        )
        
        is_flagged = ai_result.get("is_fraudulent", False)
        suggested_val = ai_result.get("suggested_value_inr", claimed_value)
        
        # If flagged, auto-cap the value to the AI's suggestion
        if is_flagged and suggested_val < claimed_value:
            serializer.save(
                donor=user, 
                estimated_fmv=suggested_val,
                is_ai_flagged=True,
                ai_suggested_value=suggested_val
            )
        else:
            serializer.save(
                donor=user,
                is_ai_flagged=False,
                ai_suggested_value=suggested_val
            )
