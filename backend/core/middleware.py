import time
from django.db import connection, reset_queries
from django.conf import settings

class DatabasePerformanceMiddleware:
    """
    Middleware to log Database Server Query Execution metrics (query count & DB time)
    and append performance statistics headers (X-DB-Queries, X-DB-Time-MS, X-Server-Time-MS).
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        reset_queries()
        start_time = time.perf_counter()

        response = self.get_response(request)

        total_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        queries = connection.queries
        num_queries = len(queries)
        db_time_ms = round(sum(float(q.get('time', 0)) for q in queries) * 1000, 2)

        # Attach response headers
        response['X-DB-Queries'] = str(num_queries)
        response['X-DB-Time-MS'] = f"{db_time_ms}ms"
        response['X-Server-Time-MS'] = f"{total_time_ms}ms"

        # Console logging for local dev / debug
        if settings.DEBUG and not request.path.startswith('/static/'):
            print(
                f"[DB Fetch Perf] {request.method} {request.path} -> "
                f"{num_queries} SQL Queries in {db_time_ms}ms | Total Server Time: {total_time_ms}ms"
            )

        return response
