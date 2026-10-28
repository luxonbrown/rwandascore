import { prisma } from '../config/prisma.js';
import { notFound, badRequest } from '../utils/errors.js';
import { serializeNews } from '../utils/serializers.js';
import { logActivity } from './activity.service.js';
import { broadcast } from '../ws/live.js';
import { slugify } from '../utils/slug.js';

const newsInclude = {
  author: { select: { id: true, name: true, role: true } },
};

async function uniqueSlug(title, excludeId = null) {
  const base = slugify(title) || 'news';
  let candidate = base;
  let counter = 1;

  while (
    await prisma.news.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${counter++}`;
  }

  return candidate;
}

export async function listNews({
  page = 1,
  pageSize = 20,
  category,
  status,
  search,
  featured,
  publicOnly = true,
}) {
  const where = {
    ...(publicOnly ? { status: 'published' } : status ? { status } : {}),
    ...(category ? { category } : {}),
    ...(featured !== undefined ? { featured } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { excerpt: { contains: search } },
          ],
        }
      : {}),
  };

  const [total, articles] = await Promise.all([
    prisma.news.count({ where }),
    prisma.news.findMany({
      where,
      include: newsInclude,
      orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    items: articles.map((article) => serializeNews(article)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getNewsBySlug(slug) {
  const article = await prisma.news.findUnique({
    where: { slug },
    include: newsInclude,
  });

  if (!article || article.status !== 'published') throw notFound('News article not found');

  await prisma.news.update({
    where: { id: article.id },
    data: { views: { increment: 1 } },
  });

  const related = await prisma.news.findMany({
    where: {
      id: { not: article.id },
      status: 'published',
      category: article.category,
    },
    include: newsInclude,
    orderBy: { publishedAt: 'desc' },
    take: 3,
  });

  return {
    article: serializeNews({ ...article, views: article.views + 1 }, { includeContent: true }),
    related: related.map((item) => serializeNews(item)),
  };
}

export async function getNewsById(id) {
  const article = await prisma.news.findUnique({ where: { id }, include: newsInclude });
  if (!article) throw notFound('News article not found');
  return serializeNews(article, { includeContent: true });
}

export async function createNews(data, actor, ipAddress = null) {
  const slug = data.slug ? slugify(data.slug) : await uniqueSlug(data.title);
  const status = data.status ?? 'draft';

  const article = await prisma.$transaction(async (tx) => {
    if (data.featured) {
      await tx.news.updateMany({ where: { featured: true }, data: { featured: false } });
    }

    const created = await tx.news.create({
      data: {
        title: data.title,
        slug,
        excerpt: data.excerpt,
        content: data.content,
        category: data.category,
        imageUrl: data.imageUrl ?? null,
        authorId: actor?.id ?? null,
        status,
        featured: data.featured ?? false,
        publishedAt: status === 'published' ? new Date() : null,
      },
      include: newsInclude,
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'create',
      module: 'News',
      recordType: 'news',
      recordId: created.id,
      description: `Created news article "${created.title}"`,
      ipAddress,
    });

    return created;
  });

  if (article.status === 'published') {
    broadcast('news:published', { news: serializeNews(article) });
  }

  return serializeNews(article, { includeContent: true });
}

export async function updateNews(id, data, actor, ipAddress = null) {
  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) throw notFound('News article not found');

  const slug =
    data.slug !== undefined
      ? slugify(data.slug)
      : data.title && data.title !== existing.title
        ? await uniqueSlug(data.title, id)
        : existing.slug;

  const updateData = {};
  for (const field of ['title', 'excerpt', 'content', 'category', 'imageUrl', 'featured']) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }
  updateData.slug = slug;

  if (data.status !== undefined) {
    updateData.status = data.status;
    if (data.status === 'published' && !existing.publishedAt) {
      updateData.publishedAt = new Date();
    }
  }

  const article = await prisma.$transaction(async (tx) => {
    if (data.featured === true) {
      await tx.news.updateMany({
        where: { featured: true, id: { not: id } },
        data: { featured: false },
      });
    }

    const updated = await tx.news.update({
      where: { id },
      data: updateData,
      include: newsInclude,
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'update',
      module: 'News',
      recordType: 'news',
      recordId: updated.id,
      description: `Updated news article "${updated.title}"`,
      ipAddress,
    });

    return updated;
  });

  if (article.status === 'published') {
    broadcast('news:published', { news: serializeNews(article) });
  }

  return serializeNews(article, { includeContent: true });
}

export async function deleteNews(id, actor, ipAddress = null) {
  await prisma.$transaction(async (tx) => {
    const existing = await tx.news.findUnique({ where: { id } });
    if (!existing) throw notFound('News article not found');

    await tx.news.delete({ where: { id } });

    await logActivity(tx, {
      userId: actor?.id,
      action: 'delete',
      module: 'News',
      recordType: 'news',
      recordId: id,
      description: `Deleted news article "${existing.title}"`,
      ipAddress,
    });
  });

  return { success: true };
}

export async function setNewsPublished(id, published, actor, ipAddress = null) {
  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) throw notFound('News article not found');
  if (published && !existing.content) throw badRequest('A news article needs content before publishing');

  const article = await prisma.$transaction(async (tx) => {
    const updated = await tx.news.update({
      where: { id },
      data: {
        status: published ? 'published' : 'draft',
        publishedAt: published ? existing.publishedAt ?? new Date() : existing.publishedAt,
      },
      include: newsInclude,
    });

    await logActivity(tx, {
      userId: actor?.id,
      action: published ? 'publish' : 'unpublish',
      module: 'News',
      recordType: 'news',
      recordId: id,
      description: `${published ? 'Published' : 'Unpublished'} news article "${updated.title}"`,
      ipAddress,
    });

    return updated;
  });

  if (published) broadcast('news:published', { news: serializeNews(article) });

  return serializeNews(article, { includeContent: true });
}
