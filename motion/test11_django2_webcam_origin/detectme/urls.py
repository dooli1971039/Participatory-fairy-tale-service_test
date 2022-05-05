from django.urls import path
from . import views

app_name="detectme"
urlpatterns = [
    path('',views.home,name="home"),
    path('result',views.result,name="result"),
    path('get_data',views.get_data,name="get_data"),
    
    path("detectme_OX",views.detectme_OX,name="detectme_OX"),
    path("detectme_XHandsUp",views.detectme_XHandsUp,name="detectme_XHandsUp"),
    path("detectme_Stretching",views.detectme_Stretching,name="detectme_Stretching"),
    
    path('OX',views.OX,name="OX"),
    path('XHandsUp',views.XHandsUp,name="XHandsUp"),
    path('Stretching',views.Stretching,name="Stretching")
]
