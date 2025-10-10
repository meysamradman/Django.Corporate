from rest_framework.response import Response
from rest_framework import status
from datetime import datetime

class APIResponse:
    @staticmethod
    def success(message, data=None, status_code=status.HTTP_200_OK):
        return Response({
            "metaData": {
                "status": "success",
                "message": message,
                "AppStatusCode": status_code,
                "timestamp": datetime.utcnow().isoformat()
            },
            "data": data if data is not None else {}
        }, status=status_code)

    @staticmethod
    def error(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
        return Response({
            "metaData": {
                "status": "error",
                "message": message,
                "AppStatusCode": status_code,
                "timestamp": datetime.utcnow().isoformat()
            },
            "data": errors if errors is not None else {}
        }, status=status_code)


class PaginationAPIResponse:
      @staticmethod
      def paginated_success(message, paginated_data, status_code=status.HTTP_200_OK):
            return Response({
                  "metaData": {
                        "status": "success",
                        "message": message,
                        "AppStatusCode": status_code,
                        "timestamp": datetime.utcnow().isoformat()
                  },
                  "pagination": {
                        "count": paginated_data.get('count', 0),
                        "next": paginated_data.get('next', None),
                        "previous": paginated_data.get('previous', None)
                  },
                  "data": paginated_data.get('results', [])
            }, status=status_code)

      @staticmethod
      def paginated_error(message, errors=None, status_code=status.HTTP_400_BAD_REQUEST):
            return Response({
                  "metaData": {
                        "status": "error",
                        "message": message,
                        "AppStatusCode": status_code,
                        "timestamp": datetime.utcnow().isoformat()
                  },
                  "pagination": {
                        "count": 0,
                        "next": None,
                        "previous": None
                  },
                  "data": {"errors": errors if errors is not None else {}}
            }, status=status_code)