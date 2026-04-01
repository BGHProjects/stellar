from django.urls import path
from routing.views import OptimiseView, HealthView

urlpatterns = [
    path("health",   HealthView.as_view(),   name="health"),
    path("optimise", OptimiseView.as_view(), name="optimise"),
]