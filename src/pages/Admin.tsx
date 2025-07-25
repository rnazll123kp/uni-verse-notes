import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, BookOpen, FileText, Video, Upload, Plus, Edit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  access: boolean;
  role: string;
  created_at: string;
}

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
  created_at: string;
}

interface VideoContent {
  id: string;
  title: string;
  youtube_url: string;
  subject_id: string;
  created_at: string;
}

const Admin = () => {
  const { user, userData, refetchUserData } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [videos, setVideos] = useState<VideoContent[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [newSubject, setNewSubject] = useState({ name: '', description: '' });
  const [newNote, setNewNote] = useState({ title: '', subject_id: '', file: null as File | null });
  const [newVideo, setNewVideo] = useState({ title: '', youtube_url: '', subject_id: '' });

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      navigate('/');
      return;
    }
    
    // Check if user has admin role
    if (userData && userData.role !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchData();
  }, [user, userData, navigate]);

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

      // Fetch notes
      const { data: notesData, error: notesError } = await supabase
        .from('notes')
        .select('*')
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notesData || []);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (videosError) throw videosError;
      setVideos(videosData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
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
      
      // Refetch current user data if their own access was changed
      if (userData && userId === userData.id) {
        await refetchUserData();
      }
    } catch (error) {
      console.error('Error updating user access:', error);
      toast({
        title: "Error",
        description: "Failed to update user access",
        variant: "destructive",
      });
    }
  };

  const toggleUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: newRole } : user
      ));

      toast({
        title: "Success",
        description: `User role updated to ${newRole}`,
      });
      
      // Refetch current user data if their own role was changed
      if (userData && userId === userData.id) {
        await refetchUserData();
        // If user just made themselves non-admin, redirect to dashboard
        if (newRole !== 'admin') {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const createSubject = async () => {
    if (!newSubject.name) {
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
        .insert([{ name: newSubject.name, description: newSubject.description }]);

      if (error) throw error;

      setNewSubject({ name: '', description: '' });
      fetchData();
      toast({
        title: "Success",
        description: "Subject created successfully",
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: "Error",
        description: "Failed to create subject",
        variant: "destructive",
      });
    }
  };

  const uploadNote = async () => {
    if (!newNote.title || !newNote.subject_id || !newNote.file) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = newNote.file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('pdfs')
        .upload(filePath, newNote.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);

      // Save note to database
      const { error: dbError } = await supabase
        .from('notes')
        .insert([{
          title: newNote.title,
          subject_id: newNote.subject_id,
          pdf_url: data.publicUrl
        }]);

      if (dbError) throw dbError;

      setNewNote({ title: '', subject_id: '', file: null });
      fetchData();
      toast({
        title: "Success",
        description: "Note uploaded successfully",
      });
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
    if (!newVideo.title || !newVideo.youtube_url || !newVideo.subject_id) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .insert([{
          title: newVideo.title,
          youtube_url: newVideo.youtube_url,
          subject_id: newVideo.subject_id
        }]);

      if (error) throw error;

      setNewVideo({ title: '', youtube_url: '', subject_id: '' });
      fetchData();
      toast({
        title: "Success",
        description: "Video added successfully",
      });
    } catch (error) {
      console.error('Error creating video:', error);
      toast({
        title: "Error",
        description: "Failed to add video",
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

      fetchData();
      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
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

      fetchData();
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
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

      fetchData();
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
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
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <BookOpen className="w-4 h-4 mr-2" />
              Subjects
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{user.email}</p>
                        <p className="text-sm text-muted-foreground">
                          Joined: {new Date(user.created_at).toLocaleDateString()}
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
                           <Label htmlFor={`role-${user.id}`}>Role</Label>
                           <Switch
                             id={`role-${user.id}`}
                             checked={user.role === 'admin'}
                             onCheckedChange={() => toggleUserRole(user.id, user.role)}
                           />
                           <span className="text-sm text-muted-foreground">
                             {user.role}
                           </span>
                         </div>
                       </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

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
                      onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                      placeholder="Enter subject name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject-description">Description (Optional)</Label>
                    <Textarea
                      id="subject-description"
                      value={newSubject.description}
                      onChange={(e) => setNewSubject({ ...newSubject, description: e.target.value })}
                      placeholder="Enter subject description"
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
                          <p className="font-medium">{subject.name}</p>
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
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      placeholder="Enter note title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="note-subject">Subject</Label>
                    <Select
                      value={newNote.subject_id}
                      onValueChange={(value) => setNewNote({ ...newNote, subject_id: value })}
                    >
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
                    <Label htmlFor="note-file">PDF File</Label>
                    <Input
                      id="note-file"
                      type="file"
                      accept=".pdf"
                      onChange={(e) => setNewNote({ ...newNote, file: e.target.files?.[0] || null })}
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
                    {notes.map((note) => {
                      const subject = subjects.find(s => s.id === note.subject_id);
                      return (
                        <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{note.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Subject: {subject?.name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(note.pdf_url, '_blank')}
                            >
                              View PDF
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
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

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
                      onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
                      placeholder="Enter video title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-url">YouTube URL</Label>
                    <Input
                      id="video-url"
                      value={newVideo.youtube_url}
                      onChange={(e) => setNewVideo({ ...newVideo, youtube_url: e.target.value })}
                      placeholder="Enter YouTube URL"
                    />
                  </div>
                  <div>
                    <Label htmlFor="video-subject">Subject</Label>
                    <Select
                      value={newVideo.subject_id}
                      onValueChange={(value) => setNewVideo({ ...newVideo, subject_id: value })}
                    >
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
                    {videos.map((video) => {
                      const subject = subjects.find(s => s.id === video.subject_id);
                      return (
                        <div key={video.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <p className="font-medium">{video.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Subject: {subject?.name}
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(video.youtube_url, '_blank')}
                            >
                              View Video
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
                      );
                    })}
                  </div>
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