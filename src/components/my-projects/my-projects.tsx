'use client';

import type React from 'react';
import {
  listMyProjects,
  type ProjectResponse,
} from '@/lib/backend-auth-client';
import { useAuthSession } from '@/components/auth/auth-session-provider';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { FolderOpen, Loader2 } from 'lucide-react';

function formatLabel(value: string | null | undefined) {
  if (!value) {
    return 'Not set';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatAmount(project: ProjectResponse) {
  if (!project.target_investment_amount) {
    return 'Target not set';
  }

  return `${project.target_investment_amount} ${project.target_investment_currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function roleLabel(role: string) {
  if (role === 'project_owner') {
    return 'Client';
  }

  if (role === 'governance') {
    return 'DAO';
  }

  return formatLabel(role);
}

function ProjectCard({ project }: { project: ProjectResponse }) {
  const title = project.name ?? 'Untitled Project';
  const detailHref = `/projects/${project.id}/digital-twin`;

  return (
    <article className="rounded-[28px] border border-card-bg-border bg-card-bg p-6 text-white backdrop-blur-3xl">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-primary">
              {formatLabel(project.infrastructure_type)}
            </p>
            <h2 className="chakra-petch text-2xl font-semibold text-gray-50">
              {title}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {project.account_roles.map((role) => (
              <span
                key={role}
                className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 font-mono text-xs text-primary"
              >
                {roleLabel(role)}
              </span>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Field
            label="Project Status"
            value={formatLabel(project.project_status)}
          />
          <Field
            label="Submission"
            value={formatLabel(project.submission_status)}
          />
          <Field label="Target Amount" value={formatAmount(project)} />
          <Field label="Updated" value={formatDate(project.updated_at)} />
        </div>

        {project.description ? (
          <p className="line-clamp-3 font-mono text-sm leading-7 text-gray-300">
            {project.description}
          </p>
        ) : null}

        <div className="flex justify-end">
          <Link
            href={detailHref}
            className="chakra-petch rounded-lg bg-primary px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-black transition hover:bg-primary-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View Project
          </Link>
        </div>
      </div>
    </article>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0F1722]/70 p-4">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-100">{value}</p>
    </div>
  );
}

export function MyProjects() {
  const { backendAccessToken, refreshSession } = useAuthSession();
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (left, right) =>
          new Date(right.updated_at).getTime() -
          new Date(left.updated_at).getTime()
      ),
    [projects]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      setIsLoading(true);

      try {
        const accessToken = backendAccessToken ?? (await refreshSession());

        if (!accessToken) {
          throw new Error('Your session has expired. Please sign in again.');
        }

        const response = await listMyProjects(accessToken);

        if (isMounted) {
          setProjects(response.items);
        }
      } catch {
        if (isMounted) {
          setProjects([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadProjects();

    return () => {
      isMounted = false;
    };
  }, [backendAccessToken, refreshSession]);

  if (isLoading) {
    return (
      <StatusCard
        icon={<Loader2 className="h-6 w-6 animate-spin" />}
        title="Loading projects"
        message="Fetching the projects linked to your account."
      />
    );
  }

  if (sortedProjects.length === 0) {
    return (
      <StatusCard
        icon={<FolderOpen className="h-6 w-6" />}
        title="No Projects found"
        message="Projects linked to your account will appear here."
      />
    );
  }

  return (
    <section className="flex min-h-screen flex-col gap-6 px-4 py-6 text-white">
      <div className="space-y-2">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-primary">
          Account projects
        </p>
        <h1 className="chakra-petch text-4xl font-semibold">My Projects</h1>
      </div>

      <div className="grid gap-5">
        {sortedProjects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </section>
  );
}

function StatusCard({
  icon,
  title,
  message,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 py-6 text-white">
      <div className="flex max-w-xl flex-col items-center gap-4 rounded-[28px] border border-card-bg-border bg-card-bg p-8 text-center backdrop-blur-3xl">
        <div className="text-primary">{icon}</div>
        <h1 className="chakra-petch text-2xl font-semibold">{title}</h1>
        <p className="font-mono text-sm leading-6 text-gray-300">{message}</p>
      </div>
    </div>
  );
}
