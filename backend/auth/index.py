import json
import os
import hashlib
import secrets
import re
from datetime import datetime, timedelta

import psycopg2


CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
    'Access-Control-Max-Age': '86400',
}

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def _resp(status: int, body: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'},
        'isBase64Encoded': False,
        'body': json.dumps(body),
    }


def _hash_password(password: str, salt: str) -> str:
    return hashlib.sha256((salt + password).encode('utf-8')).hexdigest()


def _connect():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: dict, context) -> dict:
    '''Авторизация пользователей по email и паролю: регистрация, вход, проверка сессии.'''
    method = event.get('httpMethod', 'GET')
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'isBase64Encoded': False, 'body': ''}

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    if method == 'GET' and action == 'me':
        token = (event.get('headers') or {}).get('X-Auth-Token') or (event.get('headers') or {}).get('x-auth-token')
        if not token:
            return _resp(401, {'error': 'Не авторизован'})
        conn = _connect()
        try:
            cur = conn.cursor()
            cur.execute(
                "SELECT u.id, u.email, u.display_name, u.auth_provider FROM sessions s "
                "JOIN users u ON u.id = s.user_id "
                "WHERE s.token = %s AND s.expires_at > now()",
                (token,),
            )
            row = cur.fetchone()
            if not row:
                return _resp(401, {'error': 'Сессия истекла'})
            return _resp(200, {'user': {'id': row[0], 'email': row[1], 'name': row[2], 'provider': row[3]}})
        finally:
            conn.close()

    if method != 'POST':
        return _resp(405, {'error': 'Метод не поддерживается'})

    try:
        data = json.loads(event.get('body') or '{}')
    except json.JSONDecodeError:
        return _resp(400, {'error': 'Некорректные данные'})

    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not EMAIL_RE.match(email):
        return _resp(400, {'error': 'Введите корректный email'})
    if len(password) < 6:
        return _resp(400, {'error': 'Пароль должен быть не короче 6 символов'})

    conn = _connect()
    try:
        cur = conn.cursor()

        if action == 'register':
            name = (data.get('name') or email.split('@')[0]).strip()[:120]
            cur.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cur.fetchone():
                return _resp(409, {'error': 'Пользователь с таким email уже существует'})
            salt = secrets.token_hex(8)
            pwd_hash = salt + ':' + _hash_password(password, salt)
            cur.execute(
                "INSERT INTO users (email, password_hash, display_name, auth_provider) "
                "VALUES (%s, %s, %s, 'email') RETURNING id",
                (email, pwd_hash, name),
            )
            user_id = cur.fetchone()[0]
            token = _create_session(cur, user_id)
            conn.commit()
            return _resp(200, {'token': token, 'user': {'id': user_id, 'email': email, 'name': name, 'provider': 'email'}})

        if action == 'login':
            cur.execute("SELECT id, password_hash, display_name FROM users WHERE email = %s", (email,))
            row = cur.fetchone()
            if not row:
                return _resp(401, {'error': 'Неверный email или пароль'})
            user_id, stored, name = row
            try:
                salt, real_hash = stored.split(':', 1)
            except ValueError:
                return _resp(401, {'error': 'Неверный email или пароль'})
            if _hash_password(password, salt) != real_hash:
                return _resp(401, {'error': 'Неверный email или пароль'})
            token = _create_session(cur, user_id)
            conn.commit()
            return _resp(200, {'token': token, 'user': {'id': user_id, 'email': email, 'name': name, 'provider': 'email'}})

        return _resp(400, {'error': 'Неизвестное действие'})
    finally:
        conn.close()


def _create_session(cur, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    expires = datetime.utcnow() + timedelta(days=30)
    cur.execute(
        "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
        (user_id, token, expires),
    )
    return token
