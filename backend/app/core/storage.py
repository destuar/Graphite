'''
File: app/core/storage.py
Purpose: Storage abstraction for S3 and local filesystem
Dependencies: boto3
Imports: boto3, settings
Exports: upload_bytes(bucket_key, data, content_type)
Created: 2025-09-05
Last Modified: 2025-09-05
'''

from typing import Optional

import boto3
from botocore.client import Config

from .config import get_settings


def _s3_client():
    settings = get_settings()
    if not (settings.aws_access_key_id and settings.aws_secret_access_key and settings.aws_region and settings.s3_bucket):
        return None
    return boto3.client(
        's3',
        region_name=settings.aws_region,
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        config=Config(signature_version='s3v4'),
    )


def upload_bytes(bucket_key: str, data: bytes, content_type: str = 'application/octet-stream') -> Optional[str]:
    settings = get_settings()
    client = _s3_client()
    if client is None:
        # Local fallback: write under .local_uploads
        import os
        base = '.local_uploads'
        os.makedirs(base, exist_ok=True)
        path = os.path.join(base, bucket_key.replace('/', '_'))
        with open(path, 'wb') as f:
            f.write(data)
        return path
    client.put_object(Bucket=settings.s3_bucket, Key=bucket_key, Body=data, ContentType=content_type)
    return f's3://{settings.s3_bucket}/{bucket_key}'


