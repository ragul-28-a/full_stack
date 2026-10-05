import json
from unittest.mock import patch

from django.test import RequestFactory, SimpleTestCase, override_settings

from . import views


@override_settings(
    SUPABASE_URL='https://example.supabase.co',
    SUPABASE_ANON_KEY='test-anon-key',
)
class ProjectAPITests(SimpleTestCase):
    def setUp(self):
        self.factory = RequestFactory()
        self.token = 'test-user-token'
        self.user_id = '0ad1480e-b212-4f5d-9ab5-5a6f0c4b3f00'

    @patch('api.views.verify_access_token')
    def test_projects_require_a_bearer_token(self, verify):
        request = self.factory.get('/api/v1/projects/')

        response = views.projects(request)

        self.assertEqual(response.status_code, 401)
        verify.assert_not_called()

    @patch('api.views._rest')
    @patch('api.views.verify_access_token', return_value={'id': '0ad1480e-b212-4f5d-9ab5-5a6f0c4b3f00'})
    def test_project_list_uses_supabase_for_persisted_rows(self, verify, rest):
        rest.return_value = [{'id': 'project-1', 'title': 'From Supabase'}]
        request = self.factory.get(
            '/api/v1/projects/',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
        )

        response = views.projects(request)

        self.assertEqual(response.status_code, 200)
        self.assertEqual(json.loads(response.content)['data'], rest.return_value)
        rest.assert_called_once_with(
            self.token,
            'projects',
            params={'select': '*', 'order': 'created_at.desc'},
        )

    @patch('api.views._rest')
    @patch('api.views.verify_access_token')
    def test_project_create_assigns_the_verified_owner_id(self, verify, rest):
        verify.return_value = {'id': self.user_id}
        rest.return_value = [{'id': 'project-2', 'title': 'Created'}]
        request = self.factory.post(
            '/api/v1/projects/',
            data=json.dumps({'title': ' Created '}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
        )

        response = views.projects(request)

        self.assertEqual(response.status_code, 201)
        rest.assert_called_once_with(
            self.token,
            'projects',
            'POST',
            body={'title': 'Created', 'user_id': self.user_id},
        )

    @patch('api.views._rest')
    @patch('api.views.verify_access_token')
    def test_project_create_rejects_untrusted_owner_field(self, verify, rest):
        verify.return_value = {'id': self.user_id}
        request = self.factory.post(
            '/api/v1/projects/',
            data=json.dumps({'title': 'Created', 'user_id': 'another-user'}),
            content_type='application/json',
            HTTP_AUTHORIZATION=f'Bearer {self.token}',
        )

        response = views.projects(request)

        self.assertEqual(response.status_code, 400)
        rest.assert_not_called()
