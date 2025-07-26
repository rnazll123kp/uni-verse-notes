import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Plus, Upload, Eye, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  access: boolean;
  is_admin: boolean;
  role: string;
  created_at: string;
}

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
  created_at: string;
}

interface VideoContent {
  id: string;
  title: string;
  youtube_url: string;
  chapter_id: string;
  created_at: string;
}

const Admin = () => {
  const { userData, refetchUserData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newSubject, setNewSubject] = useState({ name: '', description: '', image_url: '' });
  const [newChapter, setNewChapter] = useState({ title: '', description: '', subject_id: '' });
  const [newNote, setNewNote] = useState({ title: '', chapter_id: '', file: null as File | null });
  const [newVideo, setNewVideo] = useState({ title: '', youtube_url: '', chapter_id: '' });

  useEffect(() => {
    if (!userData) {
      navigate('/');
      return;
    }
    
    if (!userData.is_admin) {
      navigate('/');
      return;
    }

    fetchData();
  }, [userData, navigate]);

  const fetchData = async () => {
    try {
      // Fetch users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch chapters
      const { data: chaptersData, error: chaptersError } = await supabase
        .from('chapters')
        .select('*')
        .order('created_at');

      if (chaptersError) throw chaptersError;
      setChapters(chaptersData || []);

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
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load admin data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentAccess: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ access: !currentAccess })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, access: !currentAccess } : user
      ));

      toast({
        title: "Success",
        description: `User access ${!currentAccess ? 'granted' : 'revoked'}`,
      });
    } catch (error) {
      console.error('Error updating user access:', error);
      toast({
        title: "Error",
        description: "Failed to update user access",
        variant: "destructive",
      });
    }
  };

  const toggleUserAdmin = async (userId: string, currentIsAdmin: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_admin: !currentIsAdmin })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_admin: !currentIsAdmin } : user
      ));

      // Refetch current user data if their own admin status was changed
      if (userData && userId === userData.id) {
        await refetchUserData();
        // If user just made themselves non-admin, redirect to dashboard
        if (currentIsAdmin) {
          navigate('/');
        }
      }

      toast({
        title: "Success",
        description: `User ${!currentIsAdmin ? 'promoted to admin' : 'removed from admin'}`,
      });
    } catch (error) {
      console.error('Error updating user admin status:', error);
      toast({
        title: "Error",
        description: "Failed to update user admin status",
        variant: "destructive",
      });
    }
  };

  const createSubject = async () => {
    if (!newSubject.name.trim()) {
      toast({
        title: "Error",
        description: "Subject name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .insert([newSubject]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject created successfully",
      });

      setNewSubject({ name: '', description: '', image_url: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    }
  };

  const createChapter = async () => {
    if (!newChapter.title.trim() || !newChapter.subject_id) {
      toast({
        title: "Error",
        description: "Chapter title and subject are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('chapters')
        .insert([newChapter]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chapter created successfully",
      });

      setNewChapter({ title: '', description: '', subject_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating chapter:', error);
      toast({
        title: "Error",
        description: "Failed to create chapter",
        variant: "destructive",
      });
    }
  };

  const uploadNote = async () => {
    if (!newNote.title.trim() || !newNote.chapter_id || !newNote.file) {
      toast({
        title: "Error",
        description: "Title, chapter, and PDF file are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = newNote.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(fileName, newNote.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('pdfs')
        .getPublicUrl(fileName);

      // Insert note record
      const { error: insertError } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          chapter_id: newNote.chapter_id,
          pdf_url: publicUrl
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "Note uploaded successfully",
      });

      setNewNote({ title: '', chapter_id: '', file: null });
      fetchData();
    } catch (error) {
      console.error('Error uploading note:', error);
      toast({
        title: "Error",
        description: "Failed to upload note",
        variant: "destructive",
      });
    }
  };

  const createVideo = async () => {
    if (!newVideo.title.trim() || !newVideo.youtube_url.trim() || !newVideo.chapter_id) {
      toast({
        title: "Error",
        description: "Title, YouTube URL, and chapter are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .insert([newVideo]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video created successfully",
      });

      setNewVideo({ title: '', youtube_url: '', chapter_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Error",
        description: "Failed to create video",
        variant: "destructive",
      });
    }
  };

  const deleteSubject = async (subjectId: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
        variant: "destructive",
      });
    }
  };

  const deleteChapter = async (chapterId: string) => {
    try {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', chapterId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Chapter deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting chapter:', error);
      toast({
        title: "Error",
        description: "Failed to delete chapter",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Video deleted successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  const getSubjectName = (subjectId: string) => {
    const subject = subjects.find(s => s.id === subjectId);
    return subject?.name || 'Unknown Subject';
  };

  const getChapterName = (chapterId: string) => {
    const chapter = chapters.find(c => c.id === chapterId);
    return chapter?.title || 'Unknown Chapter';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
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
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users, subjects, chapters, notes, and videos</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>
                  Manage user access and admin privileges
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`access-${user.id}`}>Access</Label>
                          <Switch
                            id={`access-${user.id}`}
                            checked={user.access}
                            onCheckedChange={() => toggleUserAccess(user.id, user.access)}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Label htmlFor={`admin-${user.id}`}>Admin</Label>
                          <Switch
                            id={`admin-${user.id}`}
                            checked={user.is_admin}
                            onCheckedChange={() => toggleUserAdmin(user.id, user.is_admin)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Subject</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="subject-name">Subject Name</Label>
                    <Input
                      id="subject-name"
                      value={newSubject.name}
                      onChange={(e) => setNewSubject({...newSubject, name: e.target.value})}
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-description">Description</Label>
                    <Textarea
                      id="subject-description"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({...newSubject, description: e.target.value})}
                      placeholder="Enter subject description"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-image">Image URL</Label>
                    <Input
                      id="subject-image"
                      value={newSubject.image_url}
                      onChange={(e) => setNewSubject({...newSubject, image_url: e.target.value})}
                      placeholder="Enter image URL (optional)"
                    />
                  </div>
                  <Button onClick={createSubject}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Subject
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{subject.name}</h3>
                          {subject.description && (
                            <p className="text-sm text-muted-foreground">{subject.description}</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteSubject(subject.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Chapters Tab */}
          <TabsContent value="chapters">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Chapter</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="chapter-subject">Subject</Label>
                    <Select value={newChapter.subject_id} onValueChange={(value) => setNewChapter({...newChapter, subject_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="chapter-title">Chapter Title</Label>
                    <Input
                      id="chapter-title"
                      value={newChapter.title}
                      onChange={(e) => setNewChapter({...newChapter, title: e.target.value})}
                      placeholder="Enter chapter title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="chapter-description">Description</Label>
                    <Textarea
                      id="chapter-description"
                      value={newChapter.description}
                      onChange={(e) => setNewChapter({...newChapter, description: e.target.value})}
                      placeholder="Enter chapter description"
                    />
                  </div>
                  <Button onClick={createChapter}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Chapter
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {chapters.map((chapter) => (
                      <div key={chapter.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{chapter.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Subject: {getSubjectName(chapter.subject_id)}
                          </p>
                          {chapter.description && (
                            <p className="text-sm text-muted-foreground">{chapter.description}</p>
                          )}
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteChapter(chapter.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload New Note</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="note-title">Note Title</Label>
                    <Input
                      id="note-title"
                      value={newNote.title}
                      onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                      placeholder="Enter note title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note-chapter">Chapter</Label>
                    <Select value={newNote.chapter_id} onValueChange={(value) => setNewNote({...newNote, chapter_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {getSubjectName(chapter.subject_id)} - {chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="note-file">PDF File</Label>
                    <Input
                      id="note-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewNote({...newNote, file: e.target.files?.[0] || null})}
                    />
                  </div>
                  <Button onClick={uploadNote}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Note
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {notes.map((note) => (
                      <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{note.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Chapter: {getChapterName(note.chapter_id)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(note.pdf_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Videos Tab */}
          <TabsContent value="videos">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Video</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="video-title">Video Title</Label>
                    <Input
                      id="video-title"
                      value={newVideo.title}
                      onChange={(e) => setNewVideo({...newVideo, title: e.target.value})}
                      placeholder="Enter video title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-chapter">Chapter</Label>
                    <Select value={newVideo.chapter_id} onValueChange={(value) => setNewVideo({...newVideo, chapter_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a chapter" />
                      </SelectTrigger>
                      <SelectContent>
                        {chapters.map((chapter) => (
                          <SelectItem key={chapter.id} value={chapter.id}>
                            {getSubjectName(chapter.subject_id)} - {chapter.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="video-url">YouTube URL</Label>
                    <Input
                      id="video-url"
                      value={newVideo.youtube_url}
                      onChange={(e) => setNewVideo({...newVideo, youtube_url: e.target.value})}
                      placeholder="Enter YouTube URL"
                    />
                  </div>
                  <Button onClick={createVideo}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Video
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Existing Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-medium">{video.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            Chapter: {getChapterName(video.chapter_id)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(video.youtube_url, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteVideo(video.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {users.filter(u => u.access).length} with access
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{subjects.length}</div>
                  <p className="text-sm text-muted-foreground">Total subjects</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Chapters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{chapters.length}</div>
                  <p className="text-sm text-muted-foreground">Total chapters</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notes.length + videos.length}</div>
                  <p className="text-sm text-muted-foreground">
                    {notes.length} notes, {videos.length} videos
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;