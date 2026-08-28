"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function AdminPage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [courses, setCourses] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedChapter, setSelectedChapter] = useState("");

  const [courseForm, setCourseForm] = useState({ title: "", slug: "", description: "" });
  const [chapterForm, setChapterForm] = useState({ title: "", position: 1 });
  const [resourceForm, setResourceForm] = useState({ title: "", type: "video", url: "", position: 1 });
  const [message, setMessage] = useState("");

  async function loadCourses() {
    const { data } = await supabase.from("courses").select("*").order("created_at", { ascending: false });
    setCourses(data || []);
  }

  async function loadChapters(courseId) {
    const { data } = await supabase
      .from("chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("position", { ascending: true });
    setChapters(data || []);
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (profileData?.role !== "admin") {
        router.push("/");
        return;
      }
      setProfile(profileData);
      await loadCourses();
      setLoading(false);
    }
    init();
  }, [router]);

  async function handleCreateCourse(e) {
    e.preventDefault();
    setMessage("");
    const cleanSlug = courseForm.slug.trim().toLowerCase().replace(/\s+/g, "-");
    const { error } = await supabase.from("courses").insert({
      title: courseForm.title.trim(),
      slug: cleanSlug,
      description: courseForm.description.trim