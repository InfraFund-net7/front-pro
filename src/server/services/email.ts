import 'server-only';

import nodemailer from 'nodemailer';

import { getServerEnv } from '@/server/env';
import { logger } from '@/server/logger';

import type { ContactFormRecord } from '@/server/repositories/public-forms';

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function contactFormHtml(form: ContactFormRecord) {
  const fullName = `${form.firstName} ${form.lastName}`.trim();

  return `
    <h2>New Contact Form Submission</h2>
    <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
    <p><strong>Email:</strong> ${escapeHtml(form.email)}</p>
    <p><strong>IP:</strong> ${escapeHtml(form.ip ?? '')}</p>
    <p><strong>User Agent:</strong> ${escapeHtml(form.userAgent ?? '')}</p>
    <p><strong>Subject:</strong> ${escapeHtml(form.subject)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(form.message).replaceAll('\n', '<br>')}</p>
  `;
}

export function sendContactFormNotification(form: ContactFormRecord) {
  const env = getServerEnv();

  if (!env.email.enabled) return;

  const missingEmailConfig = [
    env.email.smtpHost,
    env.email.smtpPort,
    env.email.smtpPassword,
    env.email.smtpSender,
    env.email.receiver,
  ].some((value) => !value);

  if (missingEmailConfig) {
    logger.error('contact form email is enabled but SMTP config is incomplete');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: env.email.smtpHost,
    port: Number(env.email.smtpPort),
    secure: Number(env.email.smtpPort) === 465,
    auth: env.email.smtpUser
      ? {
          user: env.email.smtpUser,
          pass: env.email.smtpPassword,
        }
      : undefined,
  });

  void transporter
    .sendMail({
      from: env.email.smtpSender,
      to: env.email.receiver,
      subject: '[Infrafund] New Contact Form Submission',
      html: contactFormHtml(form),
    })
    .catch((error: unknown) => {
      logger.error({ error }, 'failed to send contact form notification email');
    });
}
