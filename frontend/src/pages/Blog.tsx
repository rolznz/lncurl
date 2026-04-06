import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  displayDate: string;
  isoDate: string;
  tags: string[];
  image?: string;
  imageAlt?: string;
}

export function Blog() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/blog-manifest.json")
      .then((r) => r.json())
      .then((data: PostMeta[]) => setPosts(data))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="font-mono text-3xl font-bold mb-2">Blog</h1>
      <p className="text-muted-foreground mb-8">
        Articles about Bitcoin lightning, NWC, and AI agents.
      </p>

      {loading && (
        <p className="font-mono text-muted-foreground text-sm">Loading posts...</p>
      )}

      {!loading && posts.length === 0 && (
        <p className="font-mono text-muted-foreground text-sm">No posts yet.</p>
      )}

      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <article
            key={post.slug}
            className="border border-border rounded-lg bg-card overflow-hidden"
          >
            {post.image && (
              <Link to={`/blog/${post.slug}`}>
                <img
                  src={post.image}
                  alt={post.imageAlt ?? post.title}
                  className="w-full aspect-[1200/630] object-cover block"
                  width={1200}
                  height={630}
                />
              </Link>
            )}
            <div className="p-5">
              <h2 className="font-mono text-xl font-bold mb-2">
                <Link
                  to={`/blog/${post.slug}`}
                  className="text-foreground hover:text-terminal transition-colors no-underline"
                >
                  {post.title}
                </Link>
              </h2>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <time
                  dateTime={post.isoDate}
                  className="font-mono text-sm text-muted-foreground"
                >
                  {post.displayDate}
                </time>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="font-mono text-xs bg-card border border-border rounded px-2 py-0.5 text-terminal-dim"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                {post.description}
              </p>
              <Link
                to={`/blog/${post.slug}`}
                className="font-mono text-sm text-terminal hover:underline"
              >
                Read more →
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
