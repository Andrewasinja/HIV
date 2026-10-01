from django.urls import path

from . import views

urlpatterns = [
    path('form-options/', views.form_options),
    path('predict/', views.predict),
    path('simulate/', views.simulate),
    path('tts/', views.speech),
]
