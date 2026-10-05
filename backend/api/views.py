import json
import logging
import os
import re
import uuid
from functools import wraps
from urllib.parse import quote, unquote, urlparse

import requests
from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt


logger = logging.getLogger(__name__)


class APIError(Exception):
    def __init__(self, message, status=400):
        self.message = message
        self.status = status
        super().__init__(message)


def json_response(data=None, status=200):
    return JsonResponse({'data': data}, status=status, safe=False)


def api_endpoint(methods):
    def decorate(view):
        @wraps(view)
        def wrapped(request, *args, **kwargs):
            if request.method not in methods:
                return JsonResponse({'error': 'Method not allowed.'}, status=405)

            try:
                if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
                    raise APIError('The Django API is missing Supabase configuration.', 503)

                authorization = request.headers.get('Authorization', '')
                if not authorization.startswith('Bearer '):
                    raise APIError('Authentication is required.', 401)

                request.supabase_token = authorization[7:].strip()
                request.supabase_user = verify_access_token(request.supabase_token)
                return view(request, *args, **kwargs)
            except APIError as exc:
                return JsonResponse({'error': exc.message}, status=exc.status)
            except requests.RequestException:
                logger.exception('Supabase service request failed.')
                return JsonResponse({'error': 'The Supabase service is temporarily unavailable.'}, status=502)
            except Exception:
                logger.exception('Unhandled API request failure.')
                return JsonResponse({'error': 'An unexpected API error occurred.'}, status=500)

        wrapped.csrf_exempt = True
        return wrapped

    return decorate


def _supabase_url(path):
    return f'{settings.SUPABASE_URL}/{path.lstrip("/")}'


def _headers(token, *, content_type=None, prefer=None):
    headers = {
        'apikey': settings.SUPABASE_ANON_KEY,
        'Authorization': f'Bearer {token}',
    }
    if content_type:
        headers['Content-Type'] = content_type
    if prefer:
        headers['Prefer'] = prefer
    return headers


def verify_access_token(token):
    response = requests.get(
        _supabase_url('/auth/v1/user'),
        headers=_headers(token),
        timeout=settings.SUPABASE_TIMEOUT_SECONDS,
    )
    if response.status_code in (401, 403):
        raise APIError('Your session is invalid or has expired. Please sign in again.', 401)
    if not response.ok:
        raise APIError('Unable to verify your Supabase session.', 502)
    user = response.json()
    if not user.get('id'):
        raise APIError('Supabase returned an invalid user session.', 401)
    return user


def _rest(token, table, method='GET', *, params=None, body=None):
    response = requests.request(
        method,
        _supabase_url(f'/rest/v1/{table}'),
        headers=_headers(
            token,
            content_type='application/json' if body is not None else None,
            prefer='return=representation',
        ),
        params=params,
        json=body,
        timeout=settings.SUPABASE_TIMEOUT_SECONDS,
    )
    if response.status_code == 401:
        raise APIError('Your session is invalid or has expired. Please sign in again.', 401)
    if not response.ok:
        try:
            detail = response.json().get('message')
        except ValueError:
            detail = None
        raise APIError(detail or 'Supabase rejected the database request.', response.status_code)
    if response.status_code == 204 or not response.content:
        return None
    return response.json()


def _json_body(request):
    try:
        data = json.loads(request.body or b'{}')
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise APIError('Request body must be valid JSON.')
    if not isinstance(data, dict):
        raise APIError('Request body must be a JSON object.')
    return data


def _validate_fields(data, allowed, required=()):
    unexpected = set(data) - set(allowed)
    if unexpected:
        raise APIError(f'Unsupported field: {sorted(unexpected)[0]}.')
    result = dict(data)
    for key in required:
        if key not in result:
            raise APIError(f'{key.replace("_", " ").capitalize()} is required.')
    return result


def _validate_text(data, field, *, required=False, max_length=5000):
    if field not in data:
        return
    value = data[field]
    if value is None and not required:
        return
    if not isinstance(value, str):
        raise APIError(f'{field.replace("_", " ").capitalize()} must be text.')
    value = value.strip()
    if required and not value:
        raise APIError(f'{field.replace("_", " ").capitalize()} is required.')
    if len(value) > max_length:
        raise APIError(f'{field.replace("_", " ").capitalize()} is too long.')
    data[field] = value


def _require_enum(data, field, values):
    if field in data and data[field] not in values:
        raise APIError(f'{field.replace("_", " ").capitalize()} is invalid.')


def _get_one(token, table, record_id):
    rows = _rest(token, table, params={'select': '*', 'id': f'eq.{record_id}'})
    return rows[0] if rows else None


def health(request):
    return JsonResponse({'status': 'ok'})


@api_endpoint({'GET', 'PATCH'})
def my_profile(request):
    user = request.supabase_user
    token = request.supabase_token
    if request.method == 'GET':
        rows = _rest(token, 'profiles', params={'select': '*', 'id': f'eq.{user["id"]}'})
        if rows:
            return json_response(rows[0])
        metadata = user.get('user_metadata') or {}
        profile = {
            'id': user['id'],
            'email': user.get('email', ''),
            'full_name': metadata.get('full_name') or user.get('email', '').split('@')[0],
            'avatar_url': metadata.get('avatar_url') or '',
            'role': 'Member',
        }
        created = _rest(token, 'profiles', 'POST', body=profile)
        return json_response(created[0] if created else profile, status=201)

    updates = _validate_fields(
        _json_body(request),
        {'full_name', 'bio', 'website', 'avatar_url'},
    )
    _validate_text(updates, 'full_name', max_length=120)
    _validate_text(updates, 'bio', max_length=1000)
    _validate_text(updates, 'website', max_length=2048)
    _validate_text(updates, 'avatar_url', max_length=2048)
    updated = _rest(
        token,
        'profiles',
        'PATCH',
        params={'id': f'eq.{user["id"]}'},
        body=updates,
    )
    if not updated:
        raise APIError('Profile not found.', 404)
    return json_response(updated[0])


@api_endpoint({'GET'})
def profiles(request):
    own_profile = _get_one(request.supabase_token, 'profiles', request.supabase_user['id'])
    if not own_profile or own_profile.get('role') != 'Admin':
        raise APIError('Administrator access is required.', 403)
    rows = _rest(request.supabase_token, 'profiles', params={'select': '*', 'order': 'full_name.asc'})
    return json_response(rows)


@api_endpoint({'GET', 'POST'})
def projects(request):
    if request.method == 'GET':
        rows = _rest(
            request.supabase_token,
            'projects',
            params={'select': '*', 'order': 'created_at.desc'},
        )
        return json_response(rows)

    data = _validate_fields(
        _json_body(request),
        {'title', 'description', 'category', 'status', 'priority', 'cover_url', 'is_public'},
        required={'title'},
    )
    _validate_text(data, 'title', required=True, max_length=200)
    _validate_text(data, 'description', max_length=5000)
    _validate_text(data, 'cover_url', max_length=2048)
    _require_enum(data, 'category', {'General', 'Web Dev', 'Design', 'Marketing', 'Mobile App', 'AI / Data'})
    _require_enum(data, 'status', {'Planning', 'In Progress', 'Completed', 'On Hold'})
    _require_enum(data, 'priority', {'Low', 'Medium', 'High', 'Urgent'})
    if 'is_public' in data and not isinstance(data['is_public'], bool):
        raise APIError('is_public must be a boolean.')
    data['user_id'] = request.supabase_user['id']
    rows = _rest(request.supabase_token, 'projects', 'POST', body=data)
    return json_response(rows[0], status=201)


@api_endpoint({'PATCH', 'DELETE'})
def project_detail(request, project_id):
    if request.method == 'DELETE':
        project = _get_one(request.supabase_token, 'projects', project_id)
        if not project or project.get('user_id') != request.supabase_user['id']:
            raise APIError('Project not found or you do not have permission to delete it.', 404)
        file_rows = _rest(
            request.supabase_token,
            'project_files',
            params={'select': 'file_url', 'project_id': f'eq.{project_id}'},
        )
        for file_record in file_rows:
            _delete_storage_object(request.supabase_token, file_record.get('file_url', ''))
        _delete_storage_object(request.supabase_token, project.get('cover_url', ''))
        _rest(request.supabase_token, 'projects', 'DELETE', params={'id': f'eq.{project_id}'})
        return json_response(None)

    updates = _validate_fields(
        _json_body(request),
        {'title', 'description', 'category', 'status', 'priority', 'cover_url', 'is_public'},
    )
    _validate_text(updates, 'title', required=True, max_length=200)
    _validate_text(updates, 'description', max_length=5000)
    _validate_text(updates, 'cover_url', max_length=2048)
    _require_enum(updates, 'category', {'General', 'Web Dev', 'Design', 'Marketing', 'Mobile App', 'AI / Data'})
    _require_enum(updates, 'status', {'Planning', 'In Progress', 'Completed', 'On Hold'})
    _require_enum(updates, 'priority', {'Low', 'Medium', 'High', 'Urgent'})
    if 'is_public' in updates and not isinstance(updates['is_public'], bool):
        raise APIError('is_public must be a boolean.')
    rows = _rest(
        request.supabase_token,
        'projects',
        'PATCH',
        params={'id': f'eq.{project_id}'},
        body=updates,
    )
    if not rows:
        raise APIError('Project not found or you do not have permission to update it.', 404)
    return json_response(rows[0])


@api_endpoint({'GET', 'POST'})
def tasks(request):
    if request.method == 'GET':
        rows = _rest(request.supabase_token, 'tasks', params={'select': '*', 'order': 'created_at.asc'})
        return json_response(rows)

    data = _validate_fields(
        _json_body(request),
        {'project_id', 'title', 'priority', 'due_date', 'is_completed'},
        required={'project_id', 'title'},
    )
    try:
        data['project_id'] = str(uuid.UUID(str(data['project_id'])))
    except (ValueError, TypeError, AttributeError):
        raise APIError('project_id must be a valid UUID.')
    _validate_text(data, 'title', required=True, max_length=200)
    _require_enum(data, 'priority', {'Low', 'Medium', 'High'})
    if 'is_completed' in data and not isinstance(data['is_completed'], bool):
        raise APIError('is_completed must be a boolean.')
    data['user_id'] = request.supabase_user['id']
    rows = _rest(request.supabase_token, 'tasks', 'POST', body=data)
    return json_response(rows[0], status=201)


@api_endpoint({'PATCH', 'DELETE'})
def task_detail(request, task_id):
    if request.method == 'DELETE':
        task = _get_one(request.supabase_token, 'tasks', task_id)
        if not task or task.get('user_id') != request.supabase_user['id']:
            raise APIError('Task not found or you do not have permission to delete it.', 404)
        _rest(request.supabase_token, 'tasks', 'DELETE', params={'id': f'eq.{task_id}'})
        return json_response(None)

    updates = _validate_fields(
        _json_body(request),
        {'title', 'priority', 'due_date', 'is_completed'},
    )
    _validate_text(updates, 'title', required=True, max_length=200)
    _require_enum(updates, 'priority', {'Low', 'Medium', 'High'})
    if 'is_completed' in updates and not isinstance(updates['is_completed'], bool):
        raise APIError('is_completed must be a boolean.')
    rows = _rest(
        request.supabase_token,
        'tasks',
        'PATCH',
        params={'id': f'eq.{task_id}'},
        body=updates,
    )
    if not rows:
        raise APIError('Task not found or you do not have permission to update it.', 404)
    return json_response(rows[0])


@api_endpoint({'GET'})
def project_files(request):
    rows = _rest(
        request.supabase_token,
        'project_files',
        params={'select': '*', 'order': 'created_at.desc'},
    )
    return json_response(rows)


def _safe_filename(filename):
    basename = os.path.basename(filename.replace('\\', '/'))
    basename = re.sub(r'[^A-Za-z0-9._-]', '_', basename).strip('._')
    return (basename or 'upload')[:150]


def _upload_storage(token, bucket, storage_path, uploaded_file):
    response = requests.post(
        _supabase_url(f'/storage/v1/object/{bucket}/{quote(storage_path, safe="/")}'),
        headers=_headers(
            token,
            content_type=uploaded_file.content_type or 'application/octet-stream',
        ),
        data=uploaded_file.read(),
        timeout=settings.SUPABASE_TIMEOUT_SECONDS,
    )
    if not response.ok:
        try:
            message = response.json().get('message')
        except ValueError:
            message = None
        raise APIError(message or 'Supabase Storage rejected the upload.', response.status_code)
    public_url = (
        f'{settings.SUPABASE_URL}/storage/v1/object/public/'
        f'{bucket}/{quote(storage_path, safe="/")}'
    )
    return public_url


def _delete_storage_object(token, file_url):
    if not file_url:
        return
    parsed = urlparse(file_url)
    prefix = '/storage/v1/object/public/project-assets/'
    if not parsed.path.startswith(prefix):
        return
    storage_path = unquote(parsed.path[len(prefix):])
    response = requests.delete(
        _supabase_url(f'/storage/v1/object/project-assets/{quote(storage_path, safe="/")}'),
        headers=_headers(token),
        timeout=settings.SUPABASE_TIMEOUT_SECONDS,
    )
    if response.status_code not in (200, 204, 404):
        raise APIError('Unable to remove the file from Supabase Storage.', response.status_code)


@api_endpoint({'POST'})
def upload_image(request):
    uploaded_file = request.FILES.get('file')
    if not uploaded_file:
        raise APIError('An image file is required.')
    if not uploaded_file.content_type or not uploaded_file.content_type.startswith('image/'):
        raise APIError('Only image files are accepted.')
    if uploaded_file.size > 5 * 1024 * 1024:
        raise APIError('Image size must be under 5MB.')

    kind = request.POST.get('kind')
    bucket_by_kind = {'avatar': ('avatars', 'avatars'), 'cover': ('project-assets', 'covers')}
    if kind not in bucket_by_kind:
        raise APIError('Upload kind must be avatar or cover.')
    bucket, folder = bucket_by_kind[kind]
    user_id = request.supabase_user['id']
    storage_path = f'{user_id}/{folder}/{uuid.uuid4().hex}_{_safe_filename(uploaded_file.name)}'
    public_url = _upload_storage(request.supabase_token, bucket, storage_path, uploaded_file)
    return json_response({'path': storage_path, 'public_url': public_url}, status=201)


@api_endpoint({'POST'})
def upload_project_file(request):
    uploaded_file = request.FILES.get('file')
    project_id = request.POST.get('project_id', '')
    if not uploaded_file:
        raise APIError('A file is required.')
    if uploaded_file.size > 10 * 1024 * 1024:
        raise APIError('File size limit is 10MB.')
    try:
        project_id = str(uuid.UUID(project_id))
    except (ValueError, TypeError, AttributeError):
        raise APIError('project_id must be a valid UUID.')

    project = _get_one(request.supabase_token, 'projects', project_id)
    if not project or project.get('user_id') != request.supabase_user['id']:
        raise APIError('Project not found or you do not have permission to upload to it.', 404)

    user_id = request.supabase_user['id']
    storage_path = (
        f'{user_id}/attachments/{project_id}/'
        f'{uuid.uuid4().hex}_{_safe_filename(uploaded_file.name)}'
    )
    file_url = _upload_storage(request.supabase_token, 'project-assets', storage_path, uploaded_file)
    metadata = {
        'project_id': project_id,
        'user_id': user_id,
        'file_name': _safe_filename(uploaded_file.name),
        'file_url': file_url,
        'file_size': uploaded_file.size,
        'file_type': uploaded_file.content_type or 'application/octet-stream',
    }
    try:
        rows = _rest(request.supabase_token, 'project_files', 'POST', body=metadata)
    except APIError:
        _delete_storage_object(request.supabase_token, file_url)
        raise
    return json_response(rows[0], status=201)


@api_endpoint({'DELETE'})
def project_file_detail(request, file_id):
    file_record = _get_one(request.supabase_token, 'project_files', file_id)
    if not file_record or file_record.get('user_id') != request.supabase_user['id']:
        raise APIError('File not found or you do not have permission to delete it.', 404)
    _delete_storage_object(request.supabase_token, file_record.get('file_url', ''))
    _rest(request.supabase_token, 'project_files', 'DELETE', params={'id': f'eq.{file_id}'})
    return json_response(None)
