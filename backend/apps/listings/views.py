from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FoodListing
from .serializers import FoodListingSerializer
from .ai_valuation import evaluate_donation_value
from apps.users.models import ActivityLog

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

    @action(detail=False, methods=['post'])
    def estimate_value(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        qty = request.data.get('quantity_available', 1)
        unit = request.data.get('quantity_unit', 'portions')
        listing_type = request.data.get('listing_type', 'DISCOUNT')
        
        if listing_type != 'DONATION':
            return Response({"suggested_value_inr": 0, "message": "AI valuation skipped for discount sales"})
        
        user = request.user
        business_type = getattr(user, 'business_name', 'Unknown Retailer')
        
        ai_result = evaluate_donation_value(
            title=title, 
            description=description, 
            quantity=qty, 
            quantity_unit=unit, 
            claimed_value=0, 
            donor_business_type=business_type
        )
        
        return Response({"suggested_value_inr": ai_result.get("suggested_value_inr", 0)})

    def perform_create(self, serializer):
        # We need to evaluate the estimated FMV before saving
        data = serializer.validated_data
        
        claimed_value = data.get('estimated_fmv', 0)
        title = data.get('title', '')
        description = data.get('description', '')
        qty = data.get('quantity_available', 1)
        unit = data.get('quantity_unit', 'portions')
        listing_type = data.get('listing_type', 'DISCOUNT')
        
        user = self.request.user
        business_type = getattr(user, 'business_name', 'Unknown Retailer')
        
        if listing_type == 'DONATION':
            ai_result = evaluate_donation_value(
                title=title, 
                description=description, 
                quantity=qty, 
                quantity_unit=unit, 
                claimed_value=claimed_value, 
                donor_business_type=business_type
            )
            
            suggested_val = ai_result.get("suggested_value_inr", claimed_value)
            report = ai_result.get("report")
            is_flagged = ai_result.get("is_fraudulent", False) or (float(claimed_value) > float(suggested_val))
            
            # If flagged, keep the claimed value but flag it for admin review
            if is_flagged and float(suggested_val) < float(claimed_value):
                listing = serializer.save(
                    donor=user, 
                    estimated_fmv=claimed_value,
                    is_ai_flagged=True,
                    ai_suggested_value=suggested_val,
                    ai_valuation_report=report
                )
            else:
                listing = serializer.save(
                    donor=user,
                    is_ai_flagged=False,
                    ai_suggested_value=suggested_val,
                    ai_valuation_report=report
                )
        else:
            listing = serializer.save(
                donor=user,
                is_ai_flagged=False,
                ai_suggested_value=None,
                ai_valuation_report=None
            )
            
        ActivityLog.objects.create(
            text=f"New listing: {listing.title} from {user.business_name or user.first_name or user.email}",
            type="donation",
            related_user=user
        )

    def perform_update(self, serializer):
        data = serializer.validated_data
        instance = serializer.instance
        
        claimed_value = data.get('estimated_fmv', instance.estimated_fmv)
        title = data.get('title', instance.title)
        description = data.get('description', instance.description)
        qty = data.get('quantity_available', instance.quantity_available)
        unit = data.get('quantity_unit', instance.quantity_unit)
        listing_type = data.get('listing_type', instance.listing_type)
        
        user = self.request.user
        business_type = getattr(user, 'business_name', 'Unknown Retailer')
        
        needs_reevaluation = any(field in data for field in ['estimated_fmv', 'title', 'description', 'quantity_available', 'quantity_unit', 'listing_type'])
        
        if needs_reevaluation and listing_type == 'DONATION':
            ai_result = evaluate_donation_value(
                title=title, 
                description=description, 
                quantity=qty, 
                quantity_unit=unit, 
                claimed_value=claimed_value, 
                donor_business_type=business_type
            )
            
            suggested_val = ai_result.get("suggested_value_inr", claimed_value)
            report = ai_result.get("report")
            is_flagged = ai_result.get("is_fraudulent", False) or (float(claimed_value) > float(suggested_val))
            
            if is_flagged and float(suggested_val) < float(claimed_value):
                serializer.save(
                    estimated_fmv=claimed_value,
                    is_ai_flagged=True,
                    ai_suggested_value=suggested_val,
                    ai_valuation_report=report
                )
            else:
                serializer.save(
                    is_ai_flagged=False,
                    ai_suggested_value=suggested_val,
                    ai_valuation_report=report
                )
        elif needs_reevaluation and listing_type != 'DONATION':
            serializer.save(
                is_ai_flagged=False,
                ai_suggested_value=None,
                ai_valuation_report=None
            )
        else:
            serializer.save()
