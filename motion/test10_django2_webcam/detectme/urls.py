from django.urls import path
from . import views

urlpatterns = [
    path('',views.home,name="home"),
    
    path("detectme_OX",views.detectme_OX,name="detectme_OX"),
    path("detectme_XHandsUp",views.detectme_XHandsUp,name="detectme_XHandsUp"),
    
    path('OX',views.OX,name="OX"),
    path('XHandsUp',views.XHandsUp,name="XHandsUp"),
    path('Stretching',views.Stretching,name="Stretching")
]
