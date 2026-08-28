"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

function toEmbedUrl(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") || u.hostname.includes("youtu.be")) {
      // Live stream format: youtube.com/live/VIDEO_ID
      if (u.pathname.startsWith("/live/")) {
        const videoId = u.pathname.split("/")[2];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      // Channel "always live" link: youtube.com/@channel/live or /channel/ID/live
      if (u.pathname.endsWith("/live")) {
        return url; // no reliable embed without channel ID lookup; open directly
      }
      let videoId = u.searchParams.get("v");
      if (u.hostname.includes("youtu.be")) videoId = u.pathname.slice(1);
      return `https://www.youtube.com/embed/${videoId}`;
    }
    if (u.hostname.includes("vimeo.com")) {
      const id = u.pathname.split("/").filter(Boolean).pop();
      return `https://player.vimeo.com/video/${id}`;
    }
    if (u.hostname.includes("drive.google.com")) {
      return url.replace("/view", "/preview");
    }
    return url;
  } catch {
    return url;
  }
}

function isEmbeddable(url) {
  try {
    const u = new URL(url);
    if ((u.hostname.includes("youtube.com")) && u.pathname.endsWith("/live") && !u.pathname.startsWith("/live/")) {
      return false;
    }
    return true;
  } catch {
    return true;
  }
}

export default function CoursePage() {
  const router = useRouter();
  const params = useParams();
  const [course, setCourse] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [resourcesByChapter, setResourcesByChapter] = useState({});
  const [activeResource, setActiveResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: courseData } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", params.slug)
        .eq("status", "published")
        .single();

      if (!courseData) {
        setLoading(false);
        return;
      }
      setCourse(courseData);

      const { data: chapterData } = await supabase
        .from("chapters")
        .select("*")
        .eq("course_id", courseData.id)
        .eq("status", "published")
        .order("position", { ascending: true });
      setChapters(chapterData || []);

      if (chapterData && chapterData.length > 0) {
        const chapterIds = chapterData.map((c) => c.id);
        const { data: resourceData } = await supabase
          .from("resources")
          .select("*")
          .in("chapter_id", chapterIds)
          .eq("status", "published")
          .order("position", { ascending: true });

        const grouped = {};
        (resourceData || []).forEach((r) => {
          if (!grouped[r.chapter_id]) grouped[r.chapter_id] = [];
          grouped[r.chapter_id].push(r);
        });
        setResourcesByChapter(grouped);
      }
      setLoading(false);
    }
    load();
  }, [params.slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 dark:bg-[#14141f]">
        Loading...
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400 dark:bg-[#14141f]">
        Course not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen dark:bg-[#14141f]">
      <nav className="bg-white dark:bg-[#1c1c2b] shadow-sm px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-sm text-accent">
          ← Back
        </Link>
        <h1 className="text-lg font-bold text-ink dark:text-gray-100">{course.title}</h1>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {chapters.length === 0 && (
          <p className="text-gray-400 text-sm">No chapters published yet.</p>
        )}
        {chapters.map((chapter) => (
          <div key={chapter.id} className="bg-white dark:bg-[#1c1c2b] rounded-xl shadow-sm p-5">
            <h2 className="font-semibold text-ink dark:text-gray-100 mb-3">{chapter.title}</h2>
            <div className="space-y-2">
              {(resourcesByChapter[chapter.id] || []).map((res) => (
                <button
                  key={res.id}
                  onClick={() => setActiveResource(res)}
                  className="w-full text-left flex items-center gap-3 border dark:border-gray-700 rounded-lg px-3 py-2 hover:bg-gray-50 dark:hover:bg-[#25253a] text-sm"
                >
                  <span className="text-xs uppercase tracking-wide text-accent font-medium w-14">
                    {res.type === "live" ? "🔴 Live" : res.type}
                  </span>
                  <span className="text-ink dark:text-gray-100">{res.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      {activeResource && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50"
          onClick={() => setActiveResource(null)}
        >
          <div
            className="bg-white dark:bg-[#1c1c2b] rounded-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-4 py-3 border-b dark:border-gray-700">
              <h3 className="font-medium text-ink dark:text-gray-100">{activeResource.title}</h3>
              <button
                onClick={() => setActiveResource(null)}
                className="text-gray-400 dark:text-gray-400 text-sm"
              >
                Close
              </button>
            </div>
            <div className="flex-1 bg-gray-100 dark:bg-[#0e0e17]">
              {isEmbeddable(activeResource.url) ? (
                <iframe
                  src={toEmbedUrl(activeResource.url)}
                  className="w-full h-[70vh]"
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4 px-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    This live stream can't be embedded directly. Open it on YouTube instead.
                  </p>
                  <a
                    href={activeResource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-accent text-white rounded-lg px-4 py-2 text-sm font-medium"
                  >
                    Open Live Stream
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}