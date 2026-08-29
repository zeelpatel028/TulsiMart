from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_data = {
            'status_code': response.status_code,
            'success': False,
        }

        # If DRF returned a dict error detail
        if isinstance(response.data, dict):
            detail = response.data.get('detail')
            error = response.data.get('error')
            
            if detail:
                custom_data['detail'] = str(detail)
                custom_data['message'] = str(detail)
            elif error:
                custom_data['detail'] = str(error)
                custom_data['message'] = str(error)
            else:
                # Format validation errors dictionary into readable string
                error_messages = []
                for field, errs in response.data.items():
                    if isinstance(errs, list):
                        err_str = ", ".join([str(e) for e in errs])
                    else:
                        err_str = str(errs)
                    error_messages.append(f"{field}: {err_str}")
                
                msg = " | ".join(error_messages) if error_messages else "Invalid request data."
                custom_data['detail'] = msg
                custom_data['message'] = msg

            custom_data['errors'] = response.data
        elif isinstance(response.data, list):
            msg = ", ".join([str(e) for e in response.data])
            custom_data['detail'] = msg
            custom_data['message'] = msg
            custom_data['errors'] = response.data
        else:
            custom_data['detail'] = str(response.data)
            custom_data['message'] = str(response.data)
            custom_data['errors'] = response.data

        response.data = custom_data

    return response
