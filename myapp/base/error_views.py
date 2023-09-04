from django.shortcuts import (
    render
)
# from django.template import RequestContext

def bad_request(request):
    response = render(
        request,
        'base/400.html'
        # context_instance=RequestContext(request)
    )
    
    response.status_code = 400
    
    return response

def page_not_found(request):
    response = render(
        request,
        'base/404.html'
        # context_instance=RequestContext(request)
    )
    
    response.status_code = 404
    
    return response

def permission_denied(request):
    print("PERMISION DENIED")
    response = render(
        request,
        'base/403.html'
        # context_instance=RequestContext(request)
    )
    
    response.status_code = 403
    
    return response

def server_error(request):
    response = render(
        request,
        'base/500.html'
        # context_instance=RequestContext(request)
    )
    
    response.status_code = 500
    
    return response