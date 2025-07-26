import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, ArrowLeft, Play, Download, BookOpen } from 'lucide-react';
import defaultSubjectImage from '@/assets/default-subject.jpg';

interface Subject {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
}

interface Chapter {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  pdf_url: string;
  chapter_id: string;
}

interface VideoContent {
  id: string;
  title: string;
  youtube_url: string;
  chapter_id: string;
}

const SubjectDetail = () => {
  const { subjectId } = useParams<{ subjectId: string }>();
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!subjectId || !userData?.access) {
      navigate('/');
      return;
    }
    fetchSubjectData();
  }, [subjectId, userData]);

  const fetchSubjectData = async () => {
    try {
      // Fetch subject
      const { data: subjectData, error: subjectError } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .single();

      if (subjectError) throw subjectError;
      setSubject(subjectData);

      // Fetch chapters for this subject
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .eq('subject_id', subjectId)
        .order('created_at');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

      // Fetch all notes and videos for chapters of this subject
      const chapterIds = chaptersData?.map(c => c.id) || [];
      
      if (chapterIds.length > 0) {
        const { data: notesData, error: notesError } = await supabase
          .from('notes')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('title');

        if (notesError) throw notesError;
        setNotes(notesData || []);

        const { data: videosData, error: videosError } = await supabase
          .from('videos')
          .select('*')
          .in('chapter_id', chapterIds)
          .order('title');

        if (videosError) throw videosError;
        setVideos(videosData || []);
      }
    } catch (error) {
      console.error('Error fetching subject data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getChapterNotes = (chapterId: string) => 
    notes.filter(note => note.chapter_id === chapterId);

  const getChapterVideos = (chapterId: string) => 
    videos.filter(video => video.chapter_id === chapterId);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Subject Not Found</h2>
          <p className="text-muted-foreground mb-4">The subject you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/')}>Go Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          
          {/* Subject Header */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="relative w-full md:w-48 h-32 md:h-32 rounded-lg overflow-hidden">
              <img 
                src={subject.image_url || defaultSubjectImage} 
                alt={subject.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{subject.name}</h1>
              {subject.description && (
                <p className="text-muted-foreground text-lg mb-4">{subject.description}</p>
              )}
              <div className="flex gap-4 text-sm text-muted-foreground">
                <span>{chapters.length} chapters</span>
                <span>{notes.length} notes</span>
                <span>{videos.length} videos</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {chapters.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Chapters Yet</h3>
            <p className="text-muted-foreground">This subject doesn't have any chapters yet.</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {chapters.map((chapter) => {
              const chapterNotes = getChapterNotes(chapter.id);
              const chapterVideos = getChapterVideos(chapter.id);
              const totalContent = chapterNotes.length + chapterVideos.length;

              return (
                <Card key={chapter.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl">{chapter.title}</CardTitle>
                        {chapter.description && (
                          <CardDescription className="mt-1">{chapter.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant="secondary">
                        {totalContent} items
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Notes Section */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center text-lg">
                          <FileText className="w-5 h-5 mr-2 text-primary" />
                          Notes & Documents
                          {chapterNotes.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {chapterNotes.length}
                            </Badge>
                          )}
                        </h4>
                        
                        {chapterNotes.length > 0 ? (
                          <div className="space-y-3">
                            {chapterNotes.map((note) => (
                              <div key={note.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                                <span className="font-medium truncate mr-2">{note.title}</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(note.pdf_url, '_blank')}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  PDF
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No notes available for this chapter.</p>
                        )}
                      </div>

                      {/* Videos Section */}
                      <div>
                        <h4 className="font-semibold mb-4 flex items-center text-lg">
                          <Video className="w-5 h-5 mr-2 text-primary" />
                          Video Lectures
                          {chapterVideos.length > 0 && (
                            <Badge variant="outline" className="ml-2">
                              {chapterVideos.length}
                            </Badge>
                          )}
                        </h4>
                        
                        {chapterVideos.length > 0 ? (
                          <div className="space-y-4">
                            {chapterVideos.map((video) => {
                              const videoId = getYouTubeVideoId(video.youtube_url);
                              return (
                                <div key={video.id} className="border rounded-lg overflow-hidden group/video">
                                  {videoId && (
                                    <div className="relative aspect-video bg-muted">
                                      <img 
                                        src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                      />
                                      <div className="absolute inset-0 bg-black/20 group-hover/video:bg-black/40 transition-colors flex items-center justify-center">
                                        <Button
                                          onClick={() => window.open(video.youtube_url, '_blank')}
                                          className="bg-white/90 text-black hover:bg-white"
                                        >
                                          <Play className="w-4 h-4 mr-1" />
                                          Watch
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  <div className="p-3">
                                    <p className="font-medium">{video.title}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No videos available for this chapter.</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default SubjectDetail;