"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.generic import TemplateView

urlpatterns = [
    # Reactアプリ側も業務上の管理画面を `/admin/*` で持っているため、
    # Django標準の管理サイトとパスが衝突しないよう別プレフィックスに置く。
    path('django-admin/', admin.site.urls),
    path('api/', include('core.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# backend(Django)がフロントエンドのビルド出力も配信する構成（IIS想定）のため、
# api/django-admin/static/media以外の全パスはReact Router側に処理を委ねる。
# frontend側で npm run build を実行し backend/templates/index.html が生成されるまではエラーになる。
urlpatterns += [
    re_path(r'^(?!api/|django-admin/|static/|media/).*$', TemplateView.as_view(template_name='index.html')),
]
