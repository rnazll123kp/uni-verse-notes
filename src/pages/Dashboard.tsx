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
  chapter_id: string;
}

interface VideoContent {
  id: string;
  title: string;
  youtube_url: string;
  chapter_id: string;
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
    } catch (error) {
      console.error('Error fetching content:', error);
    }
  };

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
            const totalContent = notes.length + videos.length;

            return (
              <Card 
                key={subject.id} 
                className="group hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => window.location.href = `/subjects/${subject.id}`}
              >
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
                      Click to explore
                    </Badge>
                  </div>
                </div>

                {/* Simple Content Preview */}
                <CardContent className="p-6">
                  <div className="flex items-center justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.location.href = `/subjects/${subject.id}`;
                      }}
                      className="w-full"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      View Chapters
                    </Button>
                  </div>
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