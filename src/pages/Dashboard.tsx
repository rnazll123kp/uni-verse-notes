import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Video, LogOut } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Note {
  id: string;
  title: string;
  pdf_url: string;
  subject_id: string;
}

interface VideoContent {
  id: string;
  title: string;
  youtube_url: string;
  subject_id: string;
}

const Dashboard = () => {
  const { user, userData, signOut } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userData?.access) {
      fetchContent();
    }
    setLoading(false);
  }, [userData]);

  const fetchContent = async () => {
    try {
      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('title');

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('title');

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

  const getYouTubeVideoId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  const getSubjectNotes = (subjectId: string) => 
    notes.filter(note => note.subject_id === subjectId);

  const getSubjectVideos = (subjectId: string) => 
    videos.filter(video => video.subject_id === subjectId);

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

  if (!userData?.access) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Access Pending</CardTitle>
            <CardDescription className="text-center">
              Access pending approval by admin. Please wait for approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={signOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Educational Notes</h1>
          <Button onClick={signOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const subjectNotes = getSubjectNotes(subject.id);
            const subjectVideos = getSubjectVideos(subject.id);

            return (
              <Card key={subject.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle>{subject.name}</CardTitle>
                  {subject.description && (
                    <CardDescription>{subject.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  {/* Notes Section */}
                  {subjectNotes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Notes ({subjectNotes.length})
                      </h4>
                      <div className="space-y-2">
                        {subjectNotes.map((note) => (
                          <div key={note.id} className="p-3 border rounded-lg hover:bg-accent transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{note.title}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(note.pdf_url, '_blank')}
                              >
                                <FileText className="w-3 h-3 mr-1" />
                                PDF
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {subjectVideos.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center">
                        <Video className="w-4 h-4 mr-2" />
                        Videos ({subjectVideos.length})
                      </h4>
                      <div className="space-y-3">
                        {subjectVideos.map((video) => {
                          const videoId = getYouTubeVideoId(video.youtube_url);
                          return (
                            <div key={video.id} className="border rounded-lg overflow-hidden">
                              {videoId && (
                                <div className="aspect-video">
                                  <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title={video.title}
                                    className="w-full h-full"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                              <div className="p-3">
                                <p className="text-sm font-medium">{video.title}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {subjectNotes.length === 0 && subjectVideos.length === 0 && (
                    <p className="text-muted-foreground text-sm">No content available yet.</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {subjects.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No subjects available yet.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;