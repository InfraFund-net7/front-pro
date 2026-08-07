import { randomUUID } from 'node:crypto';
import type { NextRequest } from 'next/server';
import {
  BlobSASPermissions,
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} from '@azure/storage-blob';

import { requireBearerToken } from '@/server/auth/bearer';
import { getServerEnv } from '@/server/env';
import { authenticateAppRequest } from '@/server/services/auth';
import { ApiError, handleApiError, jsonOk } from '@/server/http';

const maxUploadBytes = 10 * 1024 * 1024;
// The container is private; the SAS token embedded in storage_url is the
// only credential granting read access. This mirrors the previous Vercel
// Blob "private" access mode: a long-lived, unguessable URL rather than a
// short-lived signed link the app has to keep re-issuing.
const sasExpiryYears = 10;

export async function POST(request: NextRequest) {
  try {
    await authenticateAppRequest(requireBearerToken(request));

    const { connectionString, containerName } = getServerEnv().storage;

    if (!connectionString || !containerName) {
      throw new ApiError(
        'SERVICE_UNAVAILABLE',
        'File storage is not configured.',
        {
          detail:
            'Set AZURE_STORAGE_CONNECTION_STRING and AZURE_STORAGE_CONTAINER_NAME to enable proposal file uploads.',
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

    let storageUrl: string;

    try {
      storageUrl = await uploadProposalBlob(
        connectionString,
        containerName,
        file
      );
    } catch (uploadError) {
      if (uploadError instanceof ApiError) {
        throw uploadError;
      }

      throw new ApiError('SERVICE_UNAVAILABLE', 'Proposal upload failed.', {
        detail:
          uploadError instanceof Error
            ? uploadError.message
            : String(uploadError),
      });
    }

    return jsonOk({
      file_name: file.name,
      mime_type: file.type || 'application/pdf',
      size_bytes: file.size,
      storage_url: storageUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function uploadProposalBlob(
  connectionString: string,
  containerName: string,
  file: File
) {
  const serviceClient =
    BlobServiceClient.fromConnectionString(connectionString);
  const containerClient = serviceClient.getContainerClient(containerName);
  const blobName = `project-proposals/${randomUUID()}-${file.name}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await blockBlobClient.uploadData(buffer, {
    blobHTTPHeaders: { blobContentType: file.type || 'application/pdf' },
  });

  const credential = serviceClient.credential;

  if (!(credential instanceof StorageSharedKeyCredential)) {
    throw new ApiError(
      'SERVICE_UNAVAILABLE',
      'File storage is not configured.',
      {
        detail:
          'AZURE_STORAGE_CONNECTION_STRING must use an account-key credential to generate read URLs.',
      }
    );
  }

  const expiresOn = new Date();
  expiresOn.setFullYear(expiresOn.getFullYear() + sasExpiryYears);

  const sas = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: BlobSASPermissions.parse('r'),
      expiresOn,
    },
    credential
  );

  return `${blockBlobClient.url}?${sas.toString()}`;
}
