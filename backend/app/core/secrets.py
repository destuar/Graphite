'''
File: app/core/secrets.py
Purpose: Resolve secrets from AWS Secrets Manager (database URL, etc.)
Dependencies: boto3
Imports: boto3, json, settings
Exports: resolve_database_url()
Created: 2025-09-05
Last Modified: 2025-09-05
'''

import json
import os
from urllib.parse import quote
from typing import Optional

import boto3
from botocore.exceptions import ClientError

from .config import get_settings
from dotenv import load_dotenv


def _get_secret_string(secret_id: str) -> Optional[str]:
    settings = get_settings()
    client = boto3.client(
        'secretsmanager',
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
    )
    try:
        resp = client.get_secret_value(SecretId=secret_id)
    except ClientError:
        return None
    return resp.get('SecretString')


def resolve_database_url() -> Optional[str]:
    # Ensure .env is loaded into process env for fallbacks
    load_dotenv()
    settings = get_settings()
    if settings.secrets_provider != 'aws' or not settings.database_secret_name:
        return settings.database_url

    secret_str = _get_secret_string(settings.database_secret_name)
    if not secret_str:
        return settings.database_url
    # Secret may either be a raw URL string or JSON with a url field
    try:
        data = json.loads(secret_str)
        # direct URL provided
        if 'url' in data:
            return data['url']
        # minimal secret case: only username/password, compose with env host/port/db
        if 'username' in data and 'password' in data:
            host = settings.db_host or os.getenv('AWS_HOST_NAME') or 'localhost'
            port = settings.db_port or 5432
            db = settings.db_name or 'postgres'
            sslmode = f"?sslmode={settings.db_sslmode}" if settings.db_sslmode else ""
            user = quote(str(data['username']), safe='')
            pwd = quote(str(data['password']), safe='')
            return f"postgresql://{user}:{pwd}@{host}:{port}/{db}{sslmode}"
        # full fields
        if all(k in data for k in ('username', 'password', 'host', 'port', 'dbname')):
            sslmode = f"?sslmode={settings.db_sslmode}" if settings.db_sslmode else ""
            user = quote(str(data['username']), safe='')
            pwd = quote(str(data['password']), safe='')
            host = data.get('host') or settings.db_host or os.getenv('AWS_HOST_NAME') or 'localhost'
            port = data.get('port') or settings.db_port or 5432
            dbname = data.get('dbname') or settings.db_name or 'postgres'
            return f"postgresql://{user}:{pwd}@{host}:{port}/{dbname}{sslmode}"
    except json.JSONDecodeError:
        return secret_str if secret_str.startswith('postgres') else settings.database_url

    return settings.database_url


