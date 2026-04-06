import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";

interface ContentJson {
  html: string;
  frontmatter: {
    title: string;
    description: string;
    date: string;
    tags: string[];
    image?: string;
    imageAlt?: string;
  };
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const [content, setContent] = useState<ContentJson | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/blog/${slug}/content.json`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.json() as Promise<ContentJson>;
      })
      .then((data) => {
        if (data) setContent(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (notFound) return <Navigate to="/not-found" replace />;

  if (loading) {
    return (
      <p className="font-mono text-muted-foreground text-sm">Loading...</p>
    );
  }

  if (!content) return null;

  const { frontmatter: fm, html } = content;

  const displayDate = new Date(fm.date + "T00:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <div>
      {fm.image && (
        <img
          src={fm.image}
          alt={fm.imageAlt ?? fm.title}
          className="blog-hero-image"
          width={1200}
          height={630}
        />
      )}
      <article className="blog-content">
        <header className="blog-post-header">
          <h1>{fm.title}</h1>
          <div className="blog-post-meta">
            <time dateTime={fm.date + "T00:00:00Z"}>{displayDate}</time>
            {fm.tags.map((tag) => (
              <span key={tag} className="blog-tag">
                {tag}
              </span>
            ))}
          </div>
        </header>
        {/* eslint-disable-next-line react/no-danger */}
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </article>
      <div className="blog-post-footer">
        <Link to="/blog">← All posts</Link>
      </div>
    </div>
  );
}
