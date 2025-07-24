import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from './Dashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Users, Video, FileText } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

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

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Educational Notes Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Access comprehensive study materials, notes, and video lectures all in one place.
            Join our educational community today.
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Get Started
          </Button>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Succeed</h2>
          <p className="text-muted-foreground text-lg">
            Comprehensive educational resources at your fingertips
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center p-6">
            <CardHeader>
              <BookOpen className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Organized Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Browse through well-organized subjects with clear categorization
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <FileText className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>PDF Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Download and access high-quality PDF notes for all subjects
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <Video className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Video Lectures</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Watch educational videos and lectures from expert instructors
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="text-center p-6">
            <CardHeader>
              <Users className="w-12 h-12 mx-auto mb-4 text-primary" />
              <CardTitle>Access Control</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Secure access with admin approval to ensure quality content
              </CardDescription>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-muted/50 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Join thousands of students already using our platform
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate('/auth')}
            className="text-lg px-8 py-6"
          >
            Sign Up with Magic Link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
