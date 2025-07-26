import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Video, LogOut, Play, Download, BookOpen } from 'lucide-react';
import defaultSubjectImage from '@/assets/default-subject.jpg';

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
          <div className="flex items-center gap-2">
            {userData?.is_admin && (
              <Button onClick={() => window.location.href = '/admin'} variant="secondary">
                Admin Panel
              </Button>
            )}
            <Button onClick={signOut} variant="outline">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject) => {
            const subjectNotes = getSubjectNotes(subject.id);
            const subjectVideos = getSubjectVideos(subject.id);
            const totalContent = subjectNotes.length + subjectVideos.length;

            return (
              <Card key={subject.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                {/* Subject Image Header */}
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={defaultSubjectImage} 
                    alt={subject.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-bold text-xl mb-1">{subject.name}</h3>
                    {subject.description && (
                      <p className="text-white/90 text-sm line-clamp-2">{subject.description}</p>
                    )}
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                      {totalContent} items
                    </Badge>
                  </div>
                </div>

                {/* Content Sections */}
                <CardContent className="p-6">
                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mb-6">
                    {subjectNotes.length > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <FileText className="w-4 h-4 mr-1" />
                        {subjectNotes.length} Notes
                      </div>
                    )}
                    {subjectVideos.length > 0 && (
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Video className="w-4 h-4 mr-1" />
                        {subjectVideos.length} Videos
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  {subjectNotes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold mb-3 flex items-center text-sm">
                        <FileText className="w-4 h-4 mr-2 text-primary" />
                        Notes & Documents
                      </h4>
                      <div className="space-y-2">
                        {subjectNotes.slice(0, 3).map((note) => (
                          <div key={note.id} className="flex items-center justify-between p-2 rounded-lg border hover:bg-accent/50 transition-colors">
                            <span className="text-sm font-medium truncate mr-2">{note.title}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(note.pdf_url, '_blank')}
                              className="flex-shrink-0"
                            >
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                        {subjectNotes.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{subjectNotes.length - 3} more notes
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Videos Section */}
                  {subjectVideos.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 flex items-center text-sm">
                        <Video className="w-4 h-4 mr-2 text-primary" />
                        Video Lectures
                      </h4>
                      <div className="space-y-2">
                        {subjectVideos.slice(0, 2).map((video) => {
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
                                      size="sm"
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
                                <p className="text-sm font-medium line-clamp-2">{video.title}</p>
                              </div>
                            </div>
                          );
                        })}
                        {subjectVideos.length > 2 && (
                          <p className="text-xs text-muted-foreground text-center py-1">
                            +{subjectVideos.length - 2} more videos
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {totalContent === 0 && (
                    <div className="text-center py-8">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-muted-foreground text-sm">No content available yet</p>
                    </div>
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