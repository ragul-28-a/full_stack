from django.urls import path

from . import views


urlpatterns = [
    path('health/', views.health),
    path('profiles/me/', views.my_profile),
    path('profiles/', views.profiles),
    path('projects/', views.projects),
    path('projects/<uuid:project_id>/', views.project_detail),
    path('tasks/', views.tasks),
    path('tasks/<uuid:task_id>/', views.task_detail),
    path('files/', views.project_files),
    path('files/upload/', views.upload_project_file),
    path('files/<uuid:file_id>/', views.project_file_detail),
    path('storage/upload/', views.upload_image),
]
