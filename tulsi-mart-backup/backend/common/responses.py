from rest_framework.response import Response

def success_response(data=None, message="Success", status=200, pagination=None):
    payload = {
        "success": True,
        "message": message,
        "data": data if data is not None else {}
    }
    if pagination:
        payload["pagination"] = pagination
    return Response(payload, status=status)

def error_response(message="An error occurred", errors=None, status=400):
    payload = {
        "success": False,
        "message": message,
        "errors": errors if errors is not None else {}
    }
    return Response(payload, status=status)
