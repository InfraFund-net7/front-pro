import type { NextRequest } from 'next/server';
import { BlobError, put } from '@vercel/blob';

import { requireBearerToken } from '@/server/auth/http';
import { authenticateAppRequest } from '@/server/services/auth';
import { ApiError, handleApiError, jsonOk } from '@/server/http';

const maxUploadBytes = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    await authenticateAppRequest(requireBearerToken(request));

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new ApiError(
        'SERVICE_UNAVAILABLE',
        'File storage is not configured.',
        {
          detail:
            'Set BLOB_READ_WRITE_TOKEN in Vercel or the local environment to enable proposal file uploads.',
        }
      );
    }

    const form = await request.formData();
    const file = form.get('file');

    if (!(file instanceof File)) {
      throw new ApiError('BAD_REQUEST', 'A proposal file is required.');
    }

    if (file.type !== 'application/pdf') {
      throw new ApiError('VALIDATION_ERROR', 'Proposal file must be a PDF.');
    }

    if (file.size > maxUploadBytes) {
      throw new ApiError(
        'VALIDATION_ERROR',
        'Proposal file must be 10MB or smaller.'
      );
    }

    let blob: Awaited<ReturnType<typeof put>>;

    try {
      blob = await put(`project-proposals/${file.name}`, file, {
        access: 'private',
        addRandomSuffix: true,
      });
    } catch (uploadError) {
      if (uploadError instanceof BlobError) {
        throw new ApiError('SERVICE_UNAVAILABLE', 'Proposal upload failed.', {
          detail: uploadError.message,
        });
      }

      throw uploadError;
    }

    return jsonOk({
      file_name: file.name,
      mime_type: file.type || 'application/pdf',
      size_bytes: file.size,
      storage_url: blob.url,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
