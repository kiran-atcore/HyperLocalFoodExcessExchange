from django.http import JsonResponse

def health_check(request):
    """
    Lightweight health-check endpoint for Render and external ping monitors (cron-job.org).
    Returns 200 OK without database queries.
    """
    return JsonResponse({"status": "healthy", "service": "resq-backend"})
