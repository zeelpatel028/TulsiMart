from rest_framework.views import exception_handler
from rest_framework.response import Response

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            "success": False,
            "message": response.data.get("detail", "An error occurred"),
            "errors": response.data
        }
        return Response(custom_data, status=response.status_code)

    return Response({
        "success": False,
        "message": "Internal Server Error",
        "errors": str(exc)
    }, status=500)
