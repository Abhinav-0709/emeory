import * as fs from 'node:fs';
import * as path from 'node:path';
import type { TechStackFact } from '@project-memory/core';

const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', '.turbo', 'coverage', '.emeory', '.project-memory']);

interface PackageJsonInfo {
  relPath: string;
  deps: Record<string, string>;
}

function findPackageJsons(dir: string, projectRoot: string): PackageJsonInfo[] {
  const results: PackageJsonInfo[] = [];

  function walk(current: string) {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(entry.name)) {
          walk(path.join(current, entry.name));
        }
      } else if (entry.isFile() && entry.name === 'package.json') {
        const fullPath = path.join(current, entry.name);
        const relPath = path.relative(projectRoot, fullPath).replace(/\\/g, '/');
        try {
          const pkg = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));
          const deps = { ...pkg.dependencies, ...pkg.devDependencies, ...pkg.peerDependencies };
          results.push({ relPath, deps });
        } catch {
          // ignore malformed JSON
        }
      }
    }
  }

  walk(dir);
  return results;
}

export function detectTechStack(projectRoot: string): TechStackFact[] {
  const factsMap = new Map<string, TechStackFact>();

  function addFact(fact: TechStackFact) {
    const key = `${fact.category}:${fact.name.toLowerCase()}`;
    const existing = factsMap.get(key);
    if (!existing || (!existing.version && fact.version)) {
      factsMap.set(key, fact);
    }
  }

  // 1. Scan all package.json files (root + workspaces)
  const packageJsons = findPackageJsons(projectRoot, projectRoot);

  if (packageJsons.length > 0) {
    addFact({
      category: 'runtime',
      name: 'Node.js',
      source: { type: 'config', reference: packageJsons[0]?.relPath ?? 'package.json' },
      confidence: 1.0,
    });

    for (const { relPath, deps } of packageJsons) {
      // Languages
      if (deps['typescript']) {
        addFact({
          category: 'language',
          name: 'TypeScript',
          version: deps['typescript'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // Frameworks & UI
      if (deps['next']) {
        addFact({
          category: 'framework',
          name: 'Next.js',
          version: deps['next'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['react']) {
        addFact({
          category: 'framework',
          name: 'React',
          version: deps['react'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['vue']) {
        addFact({
          category: 'framework',
          name: 'Vue.js',
          version: deps['vue'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['svelte']) {
        addFact({
          category: 'framework',
          name: 'Svelte',
          version: deps['svelte'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['express']) {
        addFact({
          category: 'framework',
          name: 'Express',
          version: deps['express'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['fastify']) {
        addFact({
          category: 'framework',
          name: 'Fastify',
          version: deps['fastify'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['@nestjs/core']) {
        addFact({
          category: 'framework',
          name: 'NestJS',
          version: deps['@nestjs/core'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // Databases & BaaS
      if (deps['@supabase/supabase-js'] || deps['supabase'] || deps['@supabase/ssr']) {
        addFact({
          category: 'database',
          name: 'Supabase',
          version: deps['@supabase/supabase-js'] || deps['supabase'] || deps['@supabase/ssr'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['sqlite3'] || deps['better-sqlite3'] || deps['sql.js'] || deps['@libsql/client']) {
        addFact({
          category: 'database',
          name: 'SQLite',
          version: deps['better-sqlite3'] || deps['sqlite3'] || deps['@libsql/client'] || deps['sql.js'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['pg'] || deps['postgres'] || deps['@neondatabase/serverless']) {
        addFact({
          category: 'database',
          name: 'PostgreSQL',
          version: deps['pg'] || deps['postgres'] || deps['@neondatabase/serverless'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['mysql'] || deps['mysql2']) {
        addFact({
          category: 'database',
          name: 'MySQL',
          version: deps['mysql2'] || deps['mysql'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['mongodb'] || deps['mongoose']) {
        addFact({
          category: 'database',
          name: 'MongoDB',
          version: deps['mongodb'] || deps['mongoose'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['redis'] || deps['ioredis'] || deps['@upstash/redis']) {
        addFact({
          category: 'queue',
          name: 'Redis',
          version: deps['ioredis'] || deps['redis'] || deps['@upstash/redis'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['firebase'] || deps['firebase-admin']) {
        addFact({
          category: 'database',
          name: 'Firebase',
          version: deps['firebase'] || deps['firebase-admin'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // ORMs
      if (deps['prisma'] || deps['@prisma/client']) {
        addFact({
          category: 'orm',
          name: 'Prisma',
          version: deps['@prisma/client'] || deps['prisma'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['drizzle-orm']) {
        addFact({
          category: 'orm',
          name: 'Drizzle ORM',
          version: deps['drizzle-orm'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['typeorm']) {
        addFact({
          category: 'orm',
          name: 'TypeORM',
          version: deps['typeorm'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['kysely']) {
        addFact({
          category: 'orm',
          name: 'Kysely',
          version: deps['kysely'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // Authentication
      if (deps['next-auth'] || deps['@auth/core']) {
        addFact({
          category: 'auth',
          name: 'NextAuth.js',
          version: deps['next-auth'] || deps['@auth/core'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['@clerk/nextjs'] || deps['@clerk/clerk-sdk-node'] || deps['@clerk/backend']) {
        addFact({
          category: 'auth',
          name: 'Clerk',
          version: deps['@clerk/nextjs'] || deps['@clerk/backend'] || deps['@clerk/clerk-sdk-node'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['lucia']) {
        addFact({
          category: 'auth',
          name: 'Lucia Auth',
          version: deps['lucia'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['passport']) {
        addFact({
          category: 'auth',
          name: 'Passport.js',
          version: deps['passport'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // AI & LLM Providers
      if (deps['groq-sdk']) {
        addFact({
          category: 'ai',
          name: 'Groq SDK',
          version: deps['groq-sdk'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['@google/genai'] || deps['@google/generative-ai']) {
        addFact({
          category: 'ai',
          name: 'Google GenAI SDK',
          version: deps['@google/genai'] || deps['@google/generative-ai'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['openai']) {
        addFact({
          category: 'ai',
          name: 'OpenAI SDK',
          version: deps['openai'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['@anthropic-ai/sdk']) {
        addFact({
          category: 'ai',
          name: 'Anthropic Claude SDK',
          version: deps['@anthropic-ai/sdk'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }

      // Protocols & Tooling
      if (deps['@modelcontextprotocol/sdk']) {
        addFact({
          category: 'tooling',
          name: 'Model Context Protocol (MCP)',
          version: deps['@modelcontextprotocol/sdk'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
      if (deps['tailwindcss']) {
        addFact({
          category: 'tooling',
          name: 'TailwindCSS',
          version: deps['tailwindcss'],
          source: { type: 'config', reference: relPath },
          confidence: 1.0,
        });
      }
    }
  }

  // 2. Python projects
  const reqTxt = path.join(projectRoot, 'requirements.txt');
  const pyProject = path.join(projectRoot, 'pyproject.toml');
  if (fs.existsSync(reqTxt) || fs.existsSync(pyProject)) {
    addFact({
      category: 'language',
      name: 'Python',
      source: {
        type: 'config',
        reference: fs.existsSync(reqTxt) ? 'requirements.txt' : 'pyproject.toml',
      },
      confidence: 1.0,
    });

    let content = '';
    if (fs.existsSync(reqTxt)) content += fs.readFileSync(reqTxt, 'utf-8');
    if (fs.existsSync(pyProject)) content += fs.readFileSync(pyProject, 'utf-8');
    const lower = content.toLowerCase();

    if (lower.includes('fastapi')) {
      addFact({
        category: 'framework',
        name: 'FastAPI',
        source: { type: 'config', reference: 'requirements.txt / pyproject.toml' },
        confidence: 1.0,
      });
    }
    if (lower.includes('django')) {
      addFact({
        category: 'framework',
        name: 'Django',
        source: { type: 'config', reference: 'requirements.txt / pyproject.toml' },
        confidence: 1.0,
      });
    }
    if (lower.includes('flask')) {
      addFact({
        category: 'framework',
        name: 'Flask',
        source: { type: 'config', reference: 'requirements.txt / pyproject.toml' },
        confidence: 1.0,
      });
    }
    if (lower.includes('celery')) {
      addFact({
        category: 'queue',
        name: 'Celery',
        source: { type: 'config', reference: 'requirements.txt / pyproject.toml' },
        confidence: 1.0,
      });
    }
    if (lower.includes('sqlalchemy')) {
      addFact({
        category: 'orm',
        name: 'SQLAlchemy',
        source: { type: 'config', reference: 'requirements.txt / pyproject.toml' },
        confidence: 1.0,
      });
    }
  }

  // 3. Go projects
  const goMod = path.join(projectRoot, 'go.mod');
  if (fs.existsSync(goMod)) {
    addFact({
      category: 'language',
      name: 'Go',
      source: { type: 'config', reference: 'go.mod' },
      confidence: 1.0,
    });
  }

  // 4. Rust projects
  const cargoToml = path.join(projectRoot, 'Cargo.toml');
  if (fs.existsSync(cargoToml)) {
    addFact({
      category: 'language',
      name: 'Rust',
      source: { type: 'config', reference: 'Cargo.toml' },
      confidence: 1.0,
    });
  }

  return Array.from(factsMap.values());
}
