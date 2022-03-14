from django.urls import path
from . import views
from . import HTML_EX
urlpatterns = [
    path('',views.home,name="home"),
    path("detectme",views.detectme,name="detectme"),
    path('OX',HTML_EX.OX,name="OX"),
    path('OX',HTML_EX.XHandsUp,name="XHandsUp")
]
